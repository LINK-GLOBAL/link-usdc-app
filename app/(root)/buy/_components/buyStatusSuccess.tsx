"use client";

import { useState } from "react";
import { useBuyContext } from "@/contexts/buy.context";
import { useRampContext } from "@/contexts/ramp.context";
import { anchorUrl } from "@/www";
import Image from "next/image";
import axios from "axios";

export const BuyStatusSuccess = () => {
  const { buyData } = useBuyContext();
  const { rampData } = useRampContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract from BuyContext
  const {
    transaction_type: type,
    asset_code: assetCode,
    transaction_id: transactionId,
    sender_identifier: senderIdentifier,
    token,
  } = buyData;

  // Extract from RampContext
  const { send_amount: sendAmount, merchant_fee: fee, reference, receive_amount: receiveAmount } = rampData;

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
      account: senderIdentifier,
    },
  };

  // Button click handler - executes SEP-24 completion
  const handleDoneClick = async () => {
    // console.log("Done clicked - token:", token, "transactionId:", transactionId, "type:", type);
    setError(null);

    if (!token || !transactionId || !type) {
      // No SEP-24 params - just show success UI without API call
      console.log("No SEP-24 params, skipping API call");
      return;
    }

    setIsLoading(true);
    try {
      // console.log("Making SEP-24 completion request to:", `${anchorUrl}/transactions/${type}/interactive/complete`);
      const data = await axios.get(
        `${anchorUrl}/transactions/${type}/interactive/complete`,
        config
      );

      // console.log("SEP-24 response:", data);

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
    //  console.error("SEP-24 completion error:", err);
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
        <h1 className="font-bold text-2xl">Buy Request Received</h1>
        <p className="text-xs text-slate-500">
          Once your funds have been received your wallet will be funded.
        </p>
      </div>

      {error && (
        <div className="text-rose-600 text-sm text-center bg-rose-50 p-2 rounded mx-4">
          {error}
        </div>
      )}

      <div className="my-10 px-4 my-8">
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
