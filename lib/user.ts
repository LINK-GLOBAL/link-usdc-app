import { server } from "@/www";

export const getUserByEmail = async (email: string) => {
  try {
    const response = await fetch(`${server}/account/auth/sign-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
      }),
    });

    const user = await response.json();

    return user;
  } catch (error) {
    return error;
  }
};

export const getUserByCode = async (email: string, code: string) => {
  const request = await fetch(`${server}/account/auth/sign-in/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_email: email,
      code: code,
    }),
  });
  const user = await request.json();

  return user;
};

export const getUserById = async (id: string) => {
  const request = await fetch(`${server}/account/auth/sign-in/id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: id,
    }),
  });

  const user = await request.json();

  return user;
};

export const resend2FA = async (email: string) => {
  const request = await fetch(`${server}/account/auth/sign-in/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_email: email,
    }),
  });

  const data = await request.json();

  return data;
};

export const sendKYC = async (
  id_type: string,
  id_number: string,
  id: string,
  country: string,
  country_code: string
) => {
  const request = await fetch(`${server}/onchain/customer-kyc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idType: id_type,
      idNumber: id_number,
      customer_id: id,
      country,
      country_code,
    }),
  });

  return await request.json();
};
