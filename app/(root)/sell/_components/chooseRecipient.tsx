"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRampContext } from "@/contexts/ramp.context";
import { useSellContext } from "@/contexts/sell.context";
import { fetchRecipientsAction, Recipient } from "@/actions/recipient.actions";
import Image from "next/image";
import clsx from "clsx";

interface ChooseRecipientProps {
  userId: string;
}

export const ChooseRecipient = ({ userId }: ChooseRecipientProps) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

      if (result.status === 200 && result.recipients) {
        // Filter recipients by the selected currency
        const filteredRecipients = result.recipients.filter(
          (r) => r.currency?.toUpperCase() === rampData?.receive_asset?.toUpperCase()
        );
        setRecipients(filteredRecipients);
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

  // Handle selection and navigate back
  const handleSelect = (recipient: Recipient) => {
    setSelectedId(recipient.id);

    // Save to context
    setSellData({
      ...sellData,
      bank_name: recipient.bank_name || "",
      account_number: recipient.account_number || "",
      account_name: recipient.account_name || recipient.name || "",
    });

    // Navigate to send page
    router.push("/sell/send");
  };

  // Handle add new recipient
  const handleAddRecipient = () => {
    router.push("/sell/recipient/add");
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
      {/* Add new recipient button */}
      <button
        type="button"
        onClick={handleAddRecipient}
        className="w-full py-3 border-2 border-primary text-primary font-medium rounded-lg hover:bg-primary/5 transition-colors"
      >
        Add new recipient
      </button>

      {/* Error message */}
      {error && (
        <div className="text-rose-600 text-sm text-center bg-rose-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* Recipients list */}
      <div className="space-y-3">
        {recipients.map((recipient) => (
          <button
            key={recipient.id}
            type="button"
            onClick={() => handleSelect(recipient)}
            className={clsx(
              "w-full bg-slate-50 rounded-lg p-4 text-left transition-all",
              selectedId === recipient.id
                ? "ring-2 ring-primary"
                : "hover:bg-slate-100"
            )}
          >
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <span className="material-icons text-primary">
                  {isBankTransfer(recipient) ? "account_balance" : "credit_card"}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold">
                  {recipient.account_name || recipient.name}
                </p>
                <p className="text-sm text-slate-500">
                  {isBankTransfer(recipient)
                    ? `${formatAccountNumber(recipient.account_number || "")} | ${recipient.bank_name}`
                    : `${recipient.phone_number} | ${recipient.provider || "Mobile Money"}`}
                </p>
              </div>
              <div
                className={clsx(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  selectedId === recipient.id
                    ? "border-primary bg-primary"
                    : "border-slate-300"
                )}
              >
                {selectedId === recipient.id && (
                  <span className="material-icons text-white text-sm">check</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {recipients.length === 0 && !isLoading && (
        <p className="text-center text-slate-500 text-sm py-8">
          No saved recipients for {rampData?.receive_asset?.toUpperCase()}
        </p>
      )}

      {/* Powered by LINK */}
      <p className="text-center text-slate-400 text-sm pt-8">Powered by LINK</p>
    </div>
  );
};
