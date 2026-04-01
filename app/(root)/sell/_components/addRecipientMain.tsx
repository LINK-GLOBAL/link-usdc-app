"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useRampContext } from "@/contexts/ramp.context";
import { useSellContext } from "@/contexts/sell.context";
import { createRecipientAction } from "@/actions/recipient.actions";
import { accNumberValidate } from "@/actions/auth.actions";
import { getPaymentMethodsByCurrency } from "@/constant/paymentRails";
import { AllCurrencyBanks } from "@/constant/bankList";
import { fiatOptions } from "@/constant/constant";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import clsx from "clsx";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

export const AddRecipientMain = () => {
  const { rampData } = useRampContext();
  const { sellData, setSellData } = useSellContext();
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [currency, setCurrency] = useState(rampData?.receive_asset?.toUpperCase() || "NGN");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [recipientType, setRecipientType] = useState<"first_party" | "third_party">("first_party");

  // Bank details
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  // Mobile money details
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Get payment methods for selected currency
  const paymentMethods = getPaymentMethodsByCurrency(currency);

  // Get banks for selected currency
  const bankList = AllCurrencyBanks?.find(
    (bank) => bank.currency === currency.toUpperCase()
  )?.banks || [];

  // Get bank code for validation
  const getBankCode = bankList.find((bank) => bank.name === bankName);

  // Determine if bank transfer
  const isBankTransfer = paymentMethod?.includes("bank_transfer");

  // Auto-hide messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Reset form when currency changes
  useEffect(() => {
    setPaymentMethod("");
    setBankName("");
    setAccountNumber("");
    setAccountName("");
    setName("");
    setPhoneNumber("");
    setIsVerified(false);
  }, [currency]);

  // Reset fields when payment method changes
  useEffect(() => {
    setBankName("");
    setAccountNumber("");
    setAccountName("");
    setName("");
    setPhoneNumber("");
    setIsVerified(false);
  }, [paymentMethod]);

  const validateAccountNumber = useCallback(async () => {
    if (!getBankCode || !('value' in getBankCode) || !getBankCode.value) return;

    setIsVerifying(true);
    setIsVerified(false);

    try {
      const result = await accNumberValidate({
        number: accountNumber,
        bankCode: getBankCode.value as string,
      });

      if (result.status === "success") {
        setAccountName(result.name);
        setIsVerified(true);
        setSuccess("Account verified successfully");
      } else {
        setError("Invalid account number");
        setIsVerified(false);
      }
    } catch {
      setError("Failed to verify account");
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  }, [getBankCode, accountNumber]);

  // Validate NGN account number (debounced to avoid rapid API calls)
  useEffect(() => {
    if (currency !== "NGN") {
      if (accountNumber.length > 0) setIsVerified(true);
      return;
    }

    if (accountNumber.length !== 10 || !bankName) return;

    const timer = setTimeout(() => {
      validateAccountNumber();
    }, 500);

    return () => clearTimeout(timer);
  }, [accountNumber, bankName, currency, validateAccountNumber]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!currency || !paymentMethod) {
      setError("Please fill all required fields");
      return;
    }

    if (isBankTransfer) {
      if (!bankName || !accountNumber || !accountName) {
        setError("Please fill all bank details");
        return;
      }
    } else {
      if (!name || !phoneNumber) {
        setError("Please fill all mobile money details");
        return;
      }
    }

    startTransition(async () => {
      const result = await createRecipientAction({
        currency: currency.toUpperCase(),
        payment_method: paymentMethod,
        recipient_type: recipientType,
        bank_name: isBankTransfer ? bankName : undefined,
        account_number: isBankTransfer ? accountNumber : undefined,
        account_name: isBankTransfer ? accountName : undefined,
        name: !isBankTransfer ? name : undefined,
        phone_number: !isBankTransfer ? phoneNumber : undefined,
        provider: !isBankTransfer ? paymentMethod : undefined,
      });
      console.log("result", result);

      if (result.status === 200 || result.status === 201) {
        // Save to context for immediate use
        setSellData({
          ...sellData,
          bank_name: isBankTransfer ? bankName : "",
          account_number: isBankTransfer ? accountNumber : "",
          account_name: isBankTransfer ? accountName : name,

        });

        setSuccess("Recipient added successfully");

        // Navigate back to recipient page
        setTimeout(() => {
          router.push("/sell/recipient");
        }, 1000);
      } else {
        setError(result.message || "Failed to add recipient");
      }
    });
  };

  // Check if form is valid
  const isFormValid = () => {
    if (!currency || !paymentMethod) return false;

    if (isBankTransfer) {
      if (currency === "NGN") {
        return bankName && accountNumber.length === 10 && isVerified;
      }
      return bankName && accountNumber && accountName;
    }

    return name && phoneNumber;
  };

  return (
    <div className="space-y-3">
      {/* Receivable amount */}
      <div className="flex shadow rounded-lg p-2 items-center">
        <div className="flex flex-row items-center justify-between gap-5">
          <p className="text-xs text-slate-500">AMOUNT:</p>
          <h2 className="font-bold text-lg">
            {rampData?.receive_amount?.toLocaleString()} {rampData?.receive_asset?.toUpperCase()}
          </h2>
        </div>
      </div>

      {/* Recipient type */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Select
            value={recipientType}
            onValueChange={(value) => setRecipientType(value as "first_party" | "third_party")}
          >
            <SelectTrigger className="w-full outline-none bg-slate-100 py-5 rounded-md border-none text-base">
              <SelectValue placeholder="Select recipient type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="first_party">My Account</SelectItem>
              <SelectItem value="third_party">3rd Party</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </button>
          </PopoverTrigger>
          <PopoverContent className="text-sm space-y-2" side="top">
            <p><span className="font-semibold">My Account</span> — You are paying into your own bank account. The payout goes directly to you.</p>
            <p><span className="font-semibold">Others</span> — Third-party payout. The funds are sent to someone else&apos;s account.</p>
          </PopoverContent>
        </Popover>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 p-2">
        {/* Error/Success messages */}
        {error && (
          <div className="text-rose-600 text-sm text-center bg-rose-50 p-2 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-600 text-sm text-center bg-green-50 p-2 rounded">
            {success}
          </div>
        )}

        {/* Payment Method */}
        {paymentMethods.length > 0 && (
          <div>
            <label htmlFor="payment_method" className="text-sm text-slate-500">
              Payment method
            </label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value)}
            >
              <SelectTrigger className="w-full outline-none bg-slate-100 py-5 rounded-md border-none text-base">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Bank Transfer Fields */}
        {paymentMethod && isBankTransfer && (
          <>
            <div>
              <label htmlFor="bank" className="text-sm text-slate-500">
                Bank
              </label>
              <Select
                value={bankName}
                onValueChange={(value) => {
                  setBankName(value);
                  setAccountNumber("");
                  setAccountName("");
                  setIsVerified(false);
                }}
              >
                <SelectTrigger className="w-full outline-none bg-slate-100 py-5 rounded-md border-none text-base">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent className="h-56">
                  {bankList.map((bank: any, index: number) => (
                    <SelectItem
                      key={index}
                      value={bank.name}
                      className="flex items-center"
                    >
                      {bank?.image && (
                        <span className="inline-block">
                          <Image
                            src={bank.image}
                            alt={bank.label}
                            width={20}
                            height={20}
                            className="object-cover inline-block mr-2"
                          />
                        </span>
                      )}
                      <span className="inline-block">{bank.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="account_number" className="text-sm text-slate-500">
                Account number
              </label>
              <Input
                type="tel"
                name="account_number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                disabled={!bankName}
                placeholder="Enter account number"
                className="outline-none bg-slate-100 py-5 rounded-md border-none text-base"
              />
            </div>

            <div>
              <label htmlFor="account_name" className="text-sm text-slate-500">
                Account name
              </label>
              <Input
                type="text"
                name="account_name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                readOnly={currency === "NGN"}
                placeholder={currency === "NGN" ? "Auto-filled on verification" : "Enter account name"}
                className="outline-none bg-slate-100 py-5 rounded-md border-none text-base"
              />
              {isVerifying && (
                <p className="text-xs text-slate-500 mt-1">Verifying account...</p>
              )}
            </div>
          </>
        )}

        {/* Mobile Money Fields */}
        {paymentMethod && !isBankTransfer && (
          <>
            <div>
              <label htmlFor="name" className="text-sm text-slate-500">
                Name
              </label>
              <Input
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter recipient name"
                className="outline-none bg-slate-100 py-5 rounded-md border-none text-base"
              />
            </div>

            <div>
              <label htmlFor="phone_number" className="text-sm text-slate-500">
                Phone number
              </label>
              <Input
                type="tel"
                name="phone_number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
                className="outline-none bg-slate-100 py-5 rounded-md border-none text-base"
              />
            </div>
          </>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={!isFormValid() || isPending}
          className={clsx(
            "btn_position text-white font-medium rounded-md transition-colors flex items-center justify-center py-3",
            !isFormValid() || isPending
              ? "bg-primary/50 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90"
          )}
        >
          {isPending ? (
            <Image
              src="/assets/progress_activity.svg"
              alt="loading"
              className="animate-spin"
              width={24}
              height={24}
            />
          ) : (
            "Continue"
          )}
        </button>
      </form>
    </div>
  );
};
