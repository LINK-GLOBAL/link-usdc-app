"use server";

import { auth } from "@/auth";
import { server } from "@/www";

// Recipient types
export interface Recipient {
  id: string;
  customer_id: string;
  currency: string;
  payment_method: string;
  payout_id: string;
  // Bank details
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  // Mobile money details
  phone_number?: string;
  name?: string;
  // Provider/network info
  provider?: string;
  payment_type?: string;
  created_at?: string;
}

export interface FetchRecipientsResponse {
  status: number;
  message?: string;
  recipients?: Recipient[];
}

export interface CreateRecipientRequest {
  currency: string;
  payment_method: string;
  // Bank details
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  // Mobile money details
  phone_number?: string;
  name?: string;
  provider?: string;
}

export interface CreateRecipientResponse {
  status: number;
  message?: string;
  recipient?: Recipient;
}

// Fetch all recipients for a user
export const fetchRecipientsAction = async (): Promise<FetchRecipientsResponse> => {
  const session = await auth();

  if (!session?.user?.id) {
    return { status: 401, message: "Unauthorized" };
  }

  try {
    const response = await fetch(`${server}/onchain/recipients/${session.user.id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return { status: 400, message: error?.message || "Failed to fetch recipients" };
  }
};

// Create a new recipient
export const createRecipientAction = async (
  payload: CreateRecipientRequest
): Promise<CreateRecipientResponse> => {
  const session = await auth();

  if (!session?.user?.customerId) {
    return { status: 401, message: "Unauthorized" };
  }

  try {
    const response = await fetch(`${server}/onchain/recipients/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: session.user.id,
        customer_id: session.user.customerId,
        currency: payload.currency,
        payment_method: payload.payment_method,
        bank_name: payload.bank_name,
        account_number: payload.account_number,
        account_name: payload.account_name,
        phone_number: payload.phone_number,
        name: payload.name,
        provider: payload.provider,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return { status: 400, message: error?.message || "Failed to create recipient" };
  }
};

// Confirm Withdraw Request - for offramp flow
export interface ConfirmWithdrawRequest {
  quote_id: string;
  payout_id: string;
  currency: string;
  send_amount: number;
  address: string;
}

export interface ConfirmWithdrawResponse {
  status: number;
  message?: string;
  transaction_id?: string;
  ticket_id?: string;
}

export const confirmWithdrawAction = async (
  payload: ConfirmWithdrawRequest
): Promise<ConfirmWithdrawResponse> => {
  const session = await auth();

  if (!session?.user?.customerId) {
    return { status: 401, message: "Unauthorized" };
  }

  try {
    const response = await fetch(`${server}/onchain/direct_offramp_request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: session.user.customerId,
        quote_id: payload.quote_id,
        payout_id: payload.payout_id,
        currency: payload.currency,
        send_amount: payload.send_amount,
        address: payload.address,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return { status: 400, message: error?.message || "Failed to confirm withdraw" };
  }
};
