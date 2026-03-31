import { LogoutModal } from "@/components/LogoutModal";
import { MenuNavbar } from "@/components/Navbar";
import { auth } from "@/auth";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginButton } from "./_components/LoginButton";

export default async function Menu({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; returnTo?: string; [key: string]: string | undefined }>;
}) {
  const session = await auth();
  const params = await searchParams;

  // Auto-redirect logged-in users based on type param and verification status
  if (session?.user?.id && params.type) {
    const queryString = new URLSearchParams(
      params as Record<string, string>
    ).toString();

    // Check if user is verified (both verified flag AND customerId required)
    const isVerified = session.user.verified && session.user.customerId;

    if (params.type === "deposit") {
      if (isVerified) {
        redirect(`/buy?${queryString}`);
      } else {
        // Send to KYC first, then return to buy flow
        redirect(`/buy/id?${queryString}&returnTo=buy`);
      }
    } else if (params.type === "withdraw") {
      if (isVerified) {
        redirect(`/sell?${queryString}`);
      } else {
        // Send to KYC first, then return to sell flow
        redirect(`/buy/id?${queryString}&returnTo=sell`);
      }
    }
  }

  return (
    <main className="grid gap-y-2">
      <MenuNavbar returnTo={params.returnTo} />

      {session?.user?.id ? (
        <div>
          <Link href="/history">
            <div className="border border-slate-200 flex items-center justify-between py-1 px-2 mt-2 rounded">
              <div className="flex items-center space-x-1">
                <button className="bg-p-light text-primary cursor-default flex items-center justify-center rounded-full p-1.5">
                  <span className="material-symbols-outlined">
                    receipt_long
                  </span>
                </button>
                <p className="font-medium">Transactions</p>
              </div>
              <button>
                <span className="material-icons-round text-sm">
                  arrow_forward_ios
                </span>
              </button>
            </div>
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-center">
              <Image src="/logo.png" alt="logo" width={150} height={150} />
            </div>
            <h1 className="font-semibold text-center">
              Welcome to LINK ramps!
            </h1>
            <p className="text-xs text-center">
              Log in to your account to buy or sell stables.
            </p>
          </div>

          <div>
            <Suspense
              fallback={
                <div className="bg-primary text-base text-white flex items-center justify-center p-2 w-full rounded-md">
                  Login
                </div>
              }
            >
              <LoginButton />
            </Suspense>
          </div>
        </div>
      )}

      <section
        className={`${session?.user?.email ? "my-10" : "my-14"} space-y-3`}
      >
        {session?.user?.id && (
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <p>
                  <span className="material-symbols-outlined">mail</span>
                </p>

                <p className="font-medium text-sm mb-2">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            {session?.user?.name && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <p>
                    <span className="material-symbols-outlined">
                      account_circle
                    </span>
                  </p>

                  <p className="font-medium text-sm capitalize mb-2">
                    {session?.user?.name}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <hr />
        <div className="space-y-3 mt-14">
          <Link
            href="https://api.whatsapp.com/send/?phone=16893033761&text&type=phone_number&app_absent=0"
            passHref={true}
            target="_blank"
            className="block"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <p>
                  <span className="material-icons text-xl">call</span>
                </p>
                <p className="font-medium text-sm">Contact support</p>
              </div>
              <button>
                <span className="material-symbols-outlined">link</span>
              </button>
            </div>
          </Link>

          {/*
        <Link
          href="https://playful-radish-285.notion.site/Terms-Conditions-f8cb83774bc14cb29423d29d1ab08a50"
          passHref={true}
          target="_blank"
          className="block"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <p>
                <span className="material-icons-outlined text-xl">
                  receipt_long
                </span>
              </p>
              <p className="font-medium text-sm">Terms & Conditions</p>
            </div>
            <button>
              <span className="material-icons-round text-sm">
                arrow_forward_ios
              </span>
            </button>
          </div>
        </Link>

        <Link
          href="https://playful-radish-285.notion.site/Privacy-Policy-0d639b29edc840c4aa48eab00c9231fd"
          passHref={true}
          target="_blank"
          className="block"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <p>
                <span className="material-icons-outlined">add_moderator</span>
              </p>
              <p className="font-medium text-sm">Privacy Policy</p>
            </div>
            <button>
              <span className="material-icons-round text-sm">
                arrow_forward_ios
              </span>
            </button>
          </div>
        </Link> */}

          {session?.user?.id && (
            <div>
              <LogoutModal>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <p>
                      <span className="material-icons-outlined">logout</span>
                    </p>
                    <p className="font-medium text-sm">Log out</p>
                  </div>
                  <div className="flex items-center">
                    <span className="material-icons-round text-sm">
                      arrow_forward_ios
                    </span>
                  </div>
                </div>
              </LogoutModal>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
