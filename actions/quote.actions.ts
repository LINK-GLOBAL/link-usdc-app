"use server";

import { auth } from "@/auth";
import { server } from "@/www";

export interface QuoteRequest {
  amount: number;
  send_asset: string;
  receive_asset: string;
  payment_method: string;
}

export interface QuoteResponse {
  status: number;
  message?: string;
  quote_id?: string;
  rate?: number;
  payout_amount?: number;
}

// Buy Quote Request - for onramp flow
export const requestQuoteAction = async (
  payload: QuoteRequest
): Promise<QuoteResponse> => {
  const session = await auth();

  try {
    const response = await fetch(`${server}/onchain/request_rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: session?.user?.customerId,
        amount: payload.amount,
        send_asset: payload.send_asset,
        receive_asset: payload.receive_asset,
        payment_method: payload.payment_method,
        trx_type: "onramp",
      }),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return { status: 400, message: error?.message || "Failed to fetch quote" };
  }
};

// Confirm onramp request - called after quote is ready
export interface ConfirmOnrampRequest {
  quote_id: string;
  send_asset: string;
  bank_account_number?: string; // bank account or phone number
  phone_number?: string;
  payment_method: string;
  ref_id?: string;
}

export interface ConfirmOnrampResponse {
  status: number;
  message?: string;
  ticket_id?: string;
  payout_amount?: string;
  agent?: string;
  vendor_details?: string;
  expires_at?: string;
}

export const confirmQuoteAction = async (
  payload: ConfirmOnrampRequest
): Promise<ConfirmOnrampResponse> => {
  const session = await auth();

  try {
    const response = await fetch(`${server}/onchain/direct_onramp_request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quote_id: payload.quote_id,
        send_asset: payload.send_asset,
        bank_account_number: payload.bank_account_number,
        phone_number: payload.phone_number,
        payment_method: payload.payment_method,
        ref_id: payload.ref_id,
      }),
    });


    const result = await response.json();
    return result;
  } catch (error: any) {
    return { status: 400, message: error?.message || "Failed to confirm quote" };
  }
};

// Confirm deposit - called when user clicks "Payment made"
export interface ConfirmDepositRequest {
  ref_id: string;
  type: string;
  wallet_address: string;
  network: string;
  memo?: string;
  ticket_id: string;
  transaction_id?: string;
}

export interface ConfirmDepositResponse {
  status: number;
  message?: string;
}

export const confirmDepositAction = async (
  payload: ConfirmDepositRequest
): Promise<ConfirmDepositResponse> => {
  const session = await auth();

  try {
    const response = await fetch(`${server}/onchain/direct_onramp_confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: session?.user?.id,
        ref_id: payload.ref_id,
        type: payload.type,
        wallet_address: payload.wallet_address,
        network: payload.network,
        memo: payload.memo,
        ticket_id: payload.ticket_id,
        transaction_id: payload.transaction_id,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return { status: 400, message: error?.message || "Failed to confirm deposit" };
  }
};

////////////////////////////////////////////////////
// SELL SIDE
////////////////////////////////////////////////////


// Sell Quote Request - for offramp flow
export interface SellQuoteRequest {
  amount: number;
  send_asset: string;
  receive_asset: string;
  payment_method: string;
}

export interface SellQuoteResponse {
  status: number;
  message?: string;
  quote_id?: string;
  rate?: number;
  payout_amount?: number;
}

export const requestSellQuoteAction = async (
  payload: SellQuoteRequest
): Promise<SellQuoteResponse> => {
  const session = await auth();

  try {
    const response = await fetch(`${server}/onchain/request_rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: session?.user?.customerId,
        amount: payload.amount,
        send_asset: payload.send_asset,
        receive_asset: payload.receive_asset,
        payment_method: payload.payment_method,
        trx_type: "offramp",
      }),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    return { status: 400, message: error?.message || "Failed to fetch sell quote" };
  }
};
