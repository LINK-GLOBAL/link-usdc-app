"use client";

import { Navbar } from "@/components/Navbar";
import { useBuyContext } from "@/contexts/buy.context";
import { useRampContext } from "@/contexts/ramp.context";
import { useRouter } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { confirmDepositAction } from "@/actions/quote.actions";
import { useState, useEffect } from "react";
import Image from "next/image";

interface VendorInfo {
  account_name?: string;
  bank_name?: string;
  account_number?: string;
  phone_number?: string;
}

export const MakePayment = () => {
  const { buyData } = useBuyContext();
  const { rampData } = useRampContext();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-hide error after 2 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const vendorInfo: VendorInfo | null = buyData.vendor_details
    ? (() => {
        // First try to parse as JSON
        try {
          const parsed = JSON.parse(buyData.vendor_details);
          if (typeof parsed === 'object') {
            return {
              account_name: parsed.account_name,
              bank_name: parsed.bank_name,
              account_number: parsed.account_number,
              phone_number: parsed.phone_number,
            };
          }
        } catch {
          // Not JSON, parse as newline-separated string
        }

        // Parse as newline-separated string
        const lines = buyData.vendor_details.split('\n').map(line => line.trim()).filter(Boolean);
        if (lines.length >= 2) {
          // First line is always phone/account number
          // Second line is account name
          // Third line (if exists) is bank name
          return {
            phone_number: lines[0],
            account_name: lines[1],
            bank_name: lines[2] || undefined,
          };
        } else if (lines.length === 1) {
          // Single line - just phone number
          return {
            phone_number: lines[0],
          };
        }
        return null;
      })()
    : null;

  // console.log("Parsed vendorInfo:", vendorInfo);

  // Determine if bank transfer or mobile money (bank transfer has bank_name)
  const isBankTransfer = Boolean(vendorInfo?.bank_name);

  // Format amount with commas
  const formattedAmount = rampData?.send_amount?.toLocaleString() || "0";
  const reference_id = rampData?.reference;
  // console.log("Reference ID:", reference_id);

  const handlePaymentMade = async () => {
    setLoading(true);
    setError(null);

    if (!reference_id) {
      setError("Reference ID is missing. Please try again.");
      setLoading(false);
      return;
    }

    const result = await confirmDepositAction({
      ref_id: reference_id,
      type: "onramp",
      wallet_address: buyData.wallet_address,
      network: buyData.network,
      memo: buyData.stellar_memo || undefined,
      ticket_id: rampData.order_id,
      transaction_id: buyData.transaction_id,
    });
    // console.log("Confirm deposit result", result);

    if (result.status === 200) {
      router.push("/buy/status/success");
    } else {
      setError(result.message || "Failed to confirm deposit");
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col min-h-screen">
      <Navbar route="/buy/confirm" title="Make Payment" />

      <div className="flex-1 space-y-4">
        {/* Info banner */}
        <div className="bg-amber-50 p-2 rounded-lg flex items-start space-x-2">
          <span className="material-icons-round text-amber-600 text-xl">
            info
          </span>
          <p className="text-amber-700 text-xs">
           Ensure to add the REFERENCE CODE below to your transfer.
          </p>
        </div>

        {/* Amount to send */}
        <div className="bg-slate-50 rounded-lg px-4 py-2 text-center">
          <p className="text-sm text-slate-500 mb-1">Amount to send</p>
          <div className="flex items-center justify-center space-x-2">
            <h2 className="font-bold text-2xl">
              {formattedAmount} {rampData?.send_asset?.toUpperCase()}
            </h2>
            <CopyButton value={String(rampData?.send_amount)} />
          </div>
        </div>

        {/* Payment method header */}
        <div className="border-b-2 border-primary pb-2 flex items-center space-x-2">
          <span className="material-icons text-primary">account_balance</span>
          <p className="text-primary font-medium">
            {isBankTransfer ? "Bank transfer" : "Mobile money"}
          </p>
        </div>

        {/* Vendor details - clean block format */}
        <div className="space-y-3 py-2">
          {/* Vendor name */}
          {vendorInfo?.account_name && (
            <p className="font-semibold text-lg">{vendorInfo.account_name}</p>
          )}

          {/* Bank name (if applicable) */}
          {vendorInfo?.bank_name && (
            <p className="text-slate-700">{vendorInfo.bank_name}</p>
          )}

          {/* Account number or phone number with copy */}
          {vendorInfo?.account_number && (
            <div className="flex items-center space-x-2">
              <CopyButton value={vendorInfo.account_number} />
              <p className="font-medium">{vendorInfo.account_number}</p>
            </div>
          )}

          {vendorInfo?.phone_number && (
            <div className="flex items-center space-x-2">
              <CopyButton value={vendorInfo.phone_number} />
              <p className="font-medium">{vendorInfo.phone_number}</p>
            </div>
          )}

          {/* Reference code */}
          {rampData?.reference && (
            <div className="flex items-center space-x-2">
              <CopyButton value={String(rampData.reference)} />
              <p className="font-medium">
                {rampData.reference}{" "}
                <span className="text-slate-500">(reference code)</span>
              </p>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="text-rose-600 text-sm text-center bg-rose-50 p-2 rounded">
            {error}
          </div>
        )}

        {/* Bottom section */}
        <div className="mt-auto space-y-4 pb-4">
          {/* Submit button */}
          <button
            type="button"
            onClick={handlePaymentMade}
            disabled={loading}
            className="bg-primary text-base text-white flex items-center justify-center p-3 w-full rounded-md disabled:opacity-50"
          >
            {loading ? (
              <Image
                src="/assets/progress_activity.svg"
                alt="loading"
                className="animate-spin"
                width={24}
                height={24}
              />
            ) : (
              "I have paid, Continue"
            )}
          </button>
        </div>


        {/* Powered by LINK
        <p className="text-center text-slate-400 text-sm">Powered by LINK</p> */}
      </div>
    </section>
  );
};
