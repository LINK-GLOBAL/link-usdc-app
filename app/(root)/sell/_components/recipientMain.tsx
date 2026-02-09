"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRampContext } from "@/contexts/ramp.context";
import { useSellContext } from "@/contexts/sell.context";
import { fetchRecipientsAction, Recipient } from "@/actions/recipient.actions";
import Image from "next/image";
import clsx from "clsx";

interface RecipientMainProps {
  userId: string;
}

export const RecipientMain = ({ userId }: RecipientMainProps) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { rampData } = useRampContext();
  const { sellData, setSellData } = useSellContext();
  const router = useRouter();

  // Fetch recipients on mount
  useEffect(() => {
    const loadRecipients = async () => {
      setIsLoading(true);
      setError(null);

      const result = await fetchRecipientsAction();
      // console.log("Recipients", result.recipients);

      if (result.status === 200 && result.recipients) {
        // Filter recipients by the selected currency
        const filteredRecipients = result.recipients.filter(
          (r) => r.currency?.toUpperCase() === rampData?.receive_asset?.toUpperCase()
        );
        setRecipients(filteredRecipients);

        // If only one recipient, auto-select it
        if (filteredRecipients.length === 1) {
          setSelectedRecipient(filteredRecipients[0]);
        }
      } else {
        setError(result.message || "Failed to load recipients");
      }

      setIsLoading(false);
    };

    if (userId) {
      loadRecipients();
    } else {
      setIsLoading(false);
    }
  }, [userId, rampData?.receive_asset]);

  // Handle continue - save selected recipient to context and navigate
  const handleContinue = () => {
    if (!selectedRecipient) return;

    setSellData({
      ...sellData,
      bank_name: selectedRecipient.bank_name || "",
      account_number: selectedRecipient.account_number || "",
      account_name: selectedRecipient.account_name || selectedRecipient.name || "",
    });

    router.push("/sell/send");
  };

  // Handle add new recipient
  const handleAddRecipient = () => {
    router.push("/sell/recipient/add");
  };

  // Handle choose recipient (navigate to selection page)
  const handleChooseRecipient = () => {
    router.push("/sell/recipient/choose");
  };

  // Format account number with ellipsis
  const formatAccountNumber = (num: string) => {
    if (!num || num.length <= 8) return num;
    return `${num.slice(0, 5)}...${num.slice(-4)}`;
  };

  // Determine if bank or mobile money
  const isBankTransfer = (recipient: Recipient) => {
    return recipient.payment_method?.includes("bank_transfer") || !!recipient.bank_name;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Image
          src="/assets/progress_activity.svg"
          alt="loading"
          className="animate-spin"
          width={32}
          height={32}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Receivable amount */}
      <div className="flex shadow rounded-lg p-4 items-center justify-center">
        <div className="text-center">
          <p className="text-xs text-slate-500">Amount to receive</p>
          <h2 className="font-bold text-2xl">
            {rampData?.receive_amount?.toLocaleString()} {rampData?.receive_asset?.toUpperCase()}
          </h2>
        </div>
      </div>

      {/* Error message */}
      {/* {error && (
        <div className="text-rose-600 text-sm text-center bg-rose-50 p-2 rounded">
          {error}
        </div>
      )} */}

      {/* No recipients - show Add recipient button */}
      {recipients.length === 0 && (
        <div className="space-y-4 py-8">
          <p className="text-center text-slate-500 text-sm">
            No saved recipients for {rampData?.receive_asset?.toUpperCase()}
          </p>
          <button
            type="button"
            onClick={handleAddRecipient}
            className="w-full py-3 border-2 border-primary text-primary font-medium rounded-lg hover:bg-primary/5 transition-colors"
          >
            Add recipient
          </button>
        </div>
      )}

      {/* Single recipient - show directly */}
      {recipients.length === 1 && selectedRecipient && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Recipient</p>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <span className="material-icons text-primary text-sm">
                  {isBankTransfer(selectedRecipient) ? "account_balance" : "credit_card"}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-xs">
                  {selectedRecipient.account_name || selectedRecipient.name}
                </p>
                <p className="text-sm text-slate-500">
                  {isBankTransfer(selectedRecipient)
                    ? `${formatAccountNumber(selectedRecipient.account_number || "")} | ${selectedRecipient.bank_name}`
                    : `${selectedRecipient.phone_number} | ${selectedRecipient.provider || "Mobile Money"}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddRecipient}
              className="mt-3 text-primary font-medium text-sm"
            >
              Change
            </button>
          </div>
        </div>
      )}

      {/* Multiple recipients - show Choose button */}
      {recipients.length > 1 && !selectedRecipient && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Recipient</p>
          <button
            type="button"
            onClick={handleChooseRecipient}
            className="w-full py-3 border-2 border-primary text-primary font-medium rounded-lg hover:bg-primary/5 transition-colors"
          >
            Choose recipient
          </button>
        </div>
      )}

      {/* Multiple recipients - show selected */}
      {recipients.length > 1 && selectedRecipient && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Recipient</p>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <span className="material-icons text-primary text-sm">
                  {isBankTransfer(selectedRecipient) ? "account_balance" : "credit_card"}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-xs">
                  {selectedRecipient.account_name || selectedRecipient.name}
                </p>
                <p className="text-sm text-slate-500">
                  {isBankTransfer(selectedRecipient)
                    ? `${formatAccountNumber(selectedRecipient.account_number || "")} | ${selectedRecipient.bank_name}`
                    : `${selectedRecipient.phone_number} | ${selectedRecipient.provider || "Mobile Money"}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleChooseRecipient}
              className="mt-3 text-primary font-medium text-sm"
            >
              Change
            </button>
          </div>
        </div>
      )}

      {/* Continue button */}
      {(selectedRecipient || recipients.length === 0) && (
        <div className="pt-8">
          <button
            type="button"
            onClick={recipients.length === 0 ? handleAddRecipient : handleContinue}
            disabled={recipients.length > 0 && !selectedRecipient}
            className={clsx(
              "w-full py-3 text-white font-medium rounded-lg transition-colors",
              recipients.length > 0 && !selectedRecipient
                ? "bg-primary/50 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};
