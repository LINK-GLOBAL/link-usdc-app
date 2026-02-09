"use server";

import { auth, signIn, signOut } from "@/auth";
import { getUserByEmail, resend2FA, sendKYC } from "@/lib/user";
import { DEFAULT_LOGIC_REDIRECT } from "@/routes";
import { server } from "@/www";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";

export const loginActions = async (email: string) => {
  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.data.email) {
    return { error: "Email does not exist!" };
  }

  return { message: existingUser?.message, email: existingUser?.data?.email };
};

export const logoutActions = async () => {
  await signOut();
};

export const kycActions = async ({
  id_type,
  id_number,
}: {
  id_type: string;
  id_number: string;
}) => {
  const session = await auth();

  const response = await sendKYC(
    id_type,
    id_number,
    session?.user?.id as string
  );

  return response;
};

export const validate2FACode = async (
  email: string,
  code: string,
  callbackUrl?: string | null
) => {
  if (!email) {
    return { error: "Email not found!" };
  }

  if (!code) {
    return { error: "Enter 2FA code!" };
  }

  try {
    // Sign in - this validates OTP internally via credentials provider
    // Don't call getUserByCode separately as it would consume the OTP
    await signIn("credentials", {
      email,
      code,
      redirect: false,
    });

    // After successful sign-in, get the session to access user data
    const session = await auth();
    console.log("current session", session);

    const user = session?.user;

    // Parse callbackUrl to get type param
    let type: string | null = null;
    let queryParams = "";

    if (callbackUrl) {
      try {
        const url = new URL(callbackUrl, "http://localhost");
        type = url.searchParams.get("type");
        queryParams = url.searchParams.toString();
      } catch {
        // If URL parsing fails, use defaults
      }
    }

    // Determine redirect based on verification status from session
    const isFullyVerified = user?.hasKyc && user?.verified && user?.customerId;

    let redirectTo: string;
    if (isFullyVerified) {
      // Fully verified user - go directly to buy/sell
      if (type === "withdraw") {
        redirectTo = queryParams ? `/sell?${queryParams}` : "/sell";
      } else {
        redirectTo = queryParams ? `/buy?${queryParams}` : "/buy";
      }
    } else {
      // Needs KYC or verification - go to ID page
      const returnTo = type === "withdraw" ? "sell" : "buy";
      redirectTo = queryParams
        ? `/buy/id?${queryParams}&returnTo=${returnTo}`
        : `/buy/id?returnTo=${returnTo}`;
    }

    return { success: true, redirectTo };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        case "CallbackRouteError":
          return { error: "Callback route error!" };

        default:
          if (error.name === "InvalidError") {
            return { error: "Invalid security code!" };
          }
          if (error.name === "ExpiredError") {
            return { error: "2FA code expired!" };
          }

          return { error: "Something went wrong!" };
      }
    }

    throw error;
  }
};

export const resend2FACode = async (email: string) => {
  const code = await resend2FA(email);

  return code;
};

export const walletValidate = async ({
  chain,
  value,
}: {
  chain: string;
  value: string;
}) => {
  try {
    const request = await fetch(
      `https://api.checkcryptoaddress.com/wallet-checks`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: value,
          network: chain,
        }),
      }
    );

    return await request.json();
  } catch (error: any) {
    return { message: error?.Error };
  }
};

export const accNumberValidate = async ({
  number,
  bankCode,
}: {
  number: string;
  bankCode: string;
}) => {
  const session = await auth();

  try {
    const request = await fetch(
      `${server}/account/verify-account-number?num=${number}&bank_code=${bankCode}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return await request.json();
  } catch (error: any) {
    return { message: error?.Error };
  }
};

// Case B: Customer verification/creation action
export const verifyCustomerAction = async ({ name }: { name: string }) => {
  const session = await auth();

  try {
    const response = await fetch(`${server}/account/verify-customer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: session?.user?.id,
        name: name,
        email: session?.user?.email,
      }),
    });
    const result = await response.json();

    // Revalidate paths to clear cache so session data refreshes
    revalidatePath("/buy/id");
    revalidatePath("/buy");
    revalidatePath("/sell");

    return result;
  } catch (error: any) {
    return { status: 400, message: error?.message || "Something went wrong" };
  }
};
