"use client";

import { useEffect, useState } from "react";
import { useRampContext } from "@/contexts/ramp.context";
import { useSellContext } from "@/contexts/sell.context";
import { anchorUrl } from "@/www";
import Image from "next/image";
import axios from "axios";

export const SellStatusSuccess = () => {
  const { rampData } = useRampContext();
  const { sellData } = useSellContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError(null);
    }, 1000);

    return () => clearTimeout(timer);
  }, [error]);

  // Extract from SellContext
  const {
    transaction_type: type,
    asset_code: assetCode,
    transaction_id: transactionId,
    token,
    account_name: accountName,
    account_number: accountNumber,
  } = sellData;

  // Extract from RampContext
  const {
    send_amount: sendAmount,
    receive_amount: receiveAmount,
    merchant_fee: fee,
    reference,
  } = rampData;

  // Generate base64 hash of reference
  const Hex = reference
    ? Buffer.from(String(reference), "utf8").toString("base64")
    : "";

  // SEP-24 config
  const config = {
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      transaction_id: transactionId,
      asset_code: assetCode,
      amount: sendAmount,
      amount_out: receiveAmount,
      amount_fee: fee,
      memo_type: "text",
      hashed: Hex,
      callback: "postmessage",
      externalId: reference,
      account: `${accountName} ${accountNumber}`,
    },
  };

  // Button click handler - executes SEP-24 completion
  const handleDoneClick = async () => {
    setError(null);

    if (!token || !transactionId || !type) {
      // No SEP-24 params - just show success UI without API call
      console.log("No SEP-24 params, skipping API call");
      return;
    }

    setIsLoading(true);
    try {
      const data = await axios.get(
        `${anchorUrl}/transactions/${type}/interactive/complete`,
        config
      );

      if (data.status === 200) {
        // postMessage to parent if in popup
        if (window.opener) {
          window.opener.postMessage(
            JSON.stringify({ id: transactionId, status: "pending" }),
            window.location.origin
          );
          window.close();
        }

        // Redirect after delay
        setTimeout(() => {
          window.location.replace(
            `${anchorUrl}/transaction/more_info?id=${transactionId}`
          );
        }, 2000);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to complete request");
      setIsLoading(false);
    }
  };

  return (
    <section className="grid gap-y-10">
      <div className="flex items-center justify-center mt-10">
        <Image
          src="/assets/png/success.svg"
          width={150}
          height={150}
          alt="success"
        />
      </div>

      <div className="text-center space-y-5">
        <h1 className="font-bold text-2xl">Sell Request Received</h1>
        <p className="text-xs text-slate-500">
          Once your {rampData?.send_asset || "USDC"} has been received, your payout will be processed.
        </p>
      </div>

      {error && (
        <div className="text-rose-600 text-sm text-center bg-rose-50 p-2 rounded mx-4">
          {error}
        </div>
      )}

      <div className="my-10 px-4">
        <button
          type="button"
          onClick={handleDoneClick}
          disabled={isLoading}
          className="bg-primary text-base text-white flex items-center justify-center p-3 w-full rounded-md disabled:opacity-50"
        >
          {isLoading ? (
            <Image
              src="/assets/progress_activity.svg"
              alt="loading"
              className="animate-spin"
              width={24}
              height={24}
            />
          ) : (
            "Done"
          )}
        </button>
      </div>
    </section>
  );
};
