/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import {
  fiatOptions,
  stablesOptions,
  AllCurrencyLimits,
  AllCurrencyReceiver,
} from "@/constant/constant";
import { getPaymentMethodsByCurrency } from "@/constant/paymentRails";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRampContext } from "@/contexts/ramp.context";
import { useBuyContext } from "@/contexts/buy.context";
import { requestQuoteAction, confirmQuoteAction } from "@/actions/quote.actions";
import { Input } from "@/components/ui/input";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import Image from "next/image";

export const BuyMain = ({ session_email }: { session_email: string }) => {
  // Quote state - initially null until quote is fetched
  const [rate, setRate] = useState<number | null>(null);
  const [receiveAmount, setReceiveAmount] = useState<number | null>(null);
  const [quoteState, setQuoteState] = useState<"idle" | "loading" | "ready" | "confirming">("idle");
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [sendAsset, setSendAsset] = useState(fiatOptions[0]);
  const [receiveAsset, setReceiveAsset] = useState(stablesOptions[0]);
  const [sendAmount, setSendAmount] = useState(20000);
  const [paymentMethod, setPaymentMethod] = useState<string>(() => {
    const methods = getPaymentMethodsByCurrency(fiatOptions[0].value);
    return methods[0]?.value || "";
  });
  const [senderIdentifier, setSenderIdentifier] = useState<string>("");

  const [isPending, startTransition] = useTransition();

  const { rampData, setRampData } = useRampContext();
  const { buyData, setBuyData } = useBuyContext();

  const router = useRouter();
  const searchParams = useSearchParams();

  const findOption = stablesOptions.find(
    (option) => option?.value === receiveAsset.value
  );

  const generateReference = () => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const prefix = letters.charAt(Math.floor(Math.random() * 26)) +
                 letters.charAt(Math.floor(Math.random() * 26)) +
                 letters.charAt(Math.floor(Math.random() * 26));
  const num1 = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  const num2 = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  const suffix = letters.charAt(Math.floor(Math.random() * 26)) +
                 letters.charAt(Math.floor(Math.random() * 26)) +
                 letters.charAt(Math.floor(Math.random() * 26));
  return `${prefix}-${num1}-${num2}-${suffix}`;
};

  const ref_id = generateReference();
  const reference = ref_id.toString();

  // Get payment methods for selected currency
  const paymentMethods = getPaymentMethodsByCurrency(sendAsset?.value);

  // Determine if current payment method is bank transfer
  const isBankTransfer = paymentMethod?.includes("bank_transfer");
  const senderInputLabel = isBankTransfer ? "Bank account" : "Phone number";
  const senderInputPlaceholder = isBankTransfer
    ? "Account sending from"
    : "Phone number";

  // Note: Do NOT send any postMessage on popup open
  // SEP-24 spec: The popup should only send a message when the user completes the flow
  // The parent wallet will poll the transaction status or wait for the completion message

  // Persist URL params to BuyContext on mount
  useEffect(() => {
    const type = searchParams.get("type");
    const assetCode = searchParams.get("assetCode");
    const transactionId = searchParams.get("transaction_id");
    const token = searchParams.get("token");
    const wallet = searchParams.get("wallet");

    if (type || assetCode || transactionId || token || wallet) {
      setBuyData((prev) => ({
        ...prev,
        transaction_type: type || prev.transaction_type || "",
        asset_code: assetCode || prev.asset_code || "",
        transaction_id: transactionId || prev.transaction_id || "",
        token: token || prev.token || "",
        wallet_address: wallet || prev.wallet_address || "",
      }));
    }
  }, [searchParams, setBuyData]);

  // Get Currency input limit list based of Currency selected
  let selectedCurLimit = AllCurrencyLimits?.filter(
    (item) => item.currency === sendAsset?.value.toUpperCase()
  );
  const selectedCurLimits = selectedCurLimit[0]?.limit[0];

  // Get list of receiving stables based on Currency selected
  let selectedCurReceive = AllCurrencyReceiver?.filter(
    (item) => item?.currency === sendAsset?.value.toUpperCase()
  );
  const currencyReceive = selectedCurReceive[0]?.stables;

  // Cap send amount at maximum
  useEffect(() => {
    if (selectedCurLimits && sendAmount > selectedCurLimits?.maximumBuy) {
      setSendAmount(Number(selectedCurLimits?.maximumBuy));
    }
  }, [sendAmount, selectedCurLimits]);

  // Reset quote when inputs change
  useEffect(() => {
    setQuoteState("idle");
    setRate(null);
    setReceiveAmount(null);
    setQuoteId(null);
    setError(null);
  }, [sendAmount, sendAsset, receiveAsset, paymentMethod]);

  // Pre-fill payment method with first available option when currency changes
  useEffect(() => {
    const methods = getPaymentMethodsByCurrency(sendAsset?.value);
    setPaymentMethod(methods[0]?.value || "");
    setSenderIdentifier("");
  }, [sendAsset]);

  // Reset sender identifier when payment method changes
  useEffect(() => {
    setSenderIdentifier("");
  }, [paymentMethod]);

  // Handle quote request
  const handleRequestQuote = () => {
    if (!paymentMethod || !sendAmount) {
      setError("Please select a payment method");
      return;
    }

    if (sendAmount < selectedCurLimits?.minimum) {
      setError(`Minimum amount is ${selectedCurLimits?.minimum} ${sendAsset?.value.toUpperCase()}`);
      return;
    }

    setQuoteState("loading");
    setError(null);

    startTransition(async () => {
      const result = await requestQuoteAction({
        amount: sendAmount,
        send_asset: sendAsset.value.toUpperCase(),
        receive_asset: receiveAsset.value,
        payment_method: paymentMethod,
      });
      // console.log("Quote-Res", result);
      if (result.status === 200 && result?.rate && result?.payout_amount) {
        setQuoteId(result.quote_id || null);
        setRate(result.rate);
        setReceiveAmount(result.payout_amount);
        setQuoteState("ready");
      } else {
        setError(result.message || "Failed to get quote");
        setQuoteState("idle");
      }
    });
  };

  // Handle continue - confirm quote and navigate
  const handleContinue = async () => {
    if (!session_email) {
      const callbackUrl = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      window.location.href = `/auth/login?callbackUrl=${callbackUrl}`;
      return;
    }

    if (quoteState !== "ready" || !quoteId || !senderIdentifier) {
      setError("Please complete all fields");
      return;
    }

    setQuoteState("confirming");
    setError(null);

    // Call confirm onramp endpoint
    const result = await confirmQuoteAction({
      quote_id: quoteId,
      send_asset: sendAsset.value.toUpperCase(),
      ref_id: reference.toString(),
      payment_method: isBankTransfer ? "bank_transfer" : "mobile_money",
      ...(isBankTransfer
        ? {
            bank_account_number: senderIdentifier,
          }
        : {
            phone_number: senderIdentifier,
          }),
    });

    if (result.status !== 200) {
      setError(result.message || "Failed to confirm quote");
      setQuoteState("ready");
      return;
    }

    // Store data in contexts
    setRampData({
      ...rampData,
      send_asset: sendAsset.value,
      receive_asset: receiveAsset.value,
      send_amount: sendAmount,
      receive_amount: receiveAmount!,
      merchant_fee: 0,
      rate: String(rate),
      reference: reference,
    });

    setBuyData((prev) => ({
      ...prev,
      network: findOption?.network as string,
      quote_id: quoteId,
      payment_method: isBankTransfer ? "bank_transfer" : "mobile_money",
      sender_identifier: senderIdentifier,
      ticket_id: result.ticket_id,
      agent: result.agent,
      vendor_details: result.vendor_details,
      expires_at: result.expires_at,
    }));

    router.push("/buy/confirm");
  };

  const findSendOption = fiatOptions?.find(
    (option) => option?.value === sendAsset.value
  );

  const findReceiveOption = stablesOptions?.find(
    (option: any) => option?.value === receiveAsset.value
  );

  useEffect(() => {
    if (findSendOption === undefined || findReceiveOption === undefined) {
      setSendAsset({
        value: "ngn",
        label: "NGN",
        img: "/assets/svg/fiat/ngn.svg",
      });
      setReceiveAsset({
        value: "usdc_polygon",
        label: "USDC",
        img: "/assets/svg/otc/usdc-stellar.svg",
        network: "stellar",
      });
    }

    if (findSendOption) {
      setSendAsset(findSendOption);
    }

    if (findReceiveOption) {
      setReceiveAsset(findReceiveOption);
    }
  }, []);

  // Determine button state and action
  const isButtonDisabled =
    !session_email ||
    sendAmount < (selectedCurLimits?.minimum || 0) ||
    (quoteState === "idle" && !paymentMethod) ||
    quoteState === "loading" ||
    quoteState === "confirming" ||
    (quoteState === "ready" && !senderIdentifier);

  const handleButtonClick = () => {
    if (!session_email) {
      const callbackUrl = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      window.location.href = `/auth/login?callbackUrl=${callbackUrl}`;
      return;
    }

    if (quoteState === "ready") {
      handleContinue();
    } else if (quoteState === "idle") {
      handleRequestQuote();
    }
  };

  const getButtonText = () => {
    if (!session_email) return "Sign in to continue";
    if (quoteState === "loading") return "Calculating";
    if (quoteState === "confirming") return "Processing...";
    if (quoteState === "ready") return "Continue";
    return "See how much";
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleButtonClick();
      }}
      className="flex flex-col gap-y-4"
    >
      {/* You send */}
      <div>
        <label htmlFor="You send" className="text-sm text-slate-500">
          You send
        </label>
        <div className="relative bg-slate-100 py-1 rounded-lg flex items-center space-x-1 justify-center">
          <div className="after:absolute after:right-32 after:top-[0.6rem] after:bottom-0 after:w-[1px] after:h-7 after:bg-slate-400 after:content-[' ']">
            <Input
              type="tel"
              name="send_amount"
              placeholder="10000"
              className="outline-none py-1 number-input font-semibold border-none text-lg ring-0 focus-visible:ring-0"
              value={sendAmount}
              onChange={(e) => {
                setSendAmount(Number(e.target.value));
              }}
            />
          </div>

          <Listbox
            value={sendAsset}
            onChange={(option) => {
              setSendAsset(option);
            }}
          >
            <ListboxButton
              className={clsx(
                "relative block w-40 rounded-lg bg-white/5 py-1.5 pr-8 pl-3 text-left text-sm/6 text-black",
                "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-black/25"
              )}
            >
              <div className="flex items-center space-x-2">
                <Image
                  src={(sendAsset?.img as string) || ""}
                  alt={sendAsset?.img as string}
                  width={24}
                  height={24}
                  className="object-cover"
                />
                <p className="text-sm/6 text-black pt-1">{sendAsset.label}</p>
              </div>

              <ChevronDownIcon
                className="group pointer-events-none absolute top-2.5 right-2.5 size-4 fill-black"
                aria-hidden="true"
              />
            </ListboxButton>

            <ListboxOptions
              anchor="bottom"
              transition
              className={clsx(
                "w-[var(--button-width)] rounded-xl shadow-xl bg-white p-1 [--anchor-gap:var(--spacing-1)] focus:outline-none",
                "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0"
              )}
            >
              {fiatOptions.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option}
                  className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-black/10"
                >
                  <div className="flex items-center space-x-2">
                    <Image
                      src={(option?.img as string) || ""}
                      alt={option?.img as string}
                      width={23}
                      height={23}
                      className="object-cover"
                    />
                    <p className="text-sm/6 text-black">{option.label}</p>
                  </div>
                  <CheckIcon className="invisible size-4 fill-black group-data-[selected]:visible" />
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Listbox>
        </div>
      </div>

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
            <SelectTrigger className="w-full outline-none bg-slate-100 py-5 rounded-lg border-none text-base">
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

       {/* Sender Identifier Input - shown after payment method is selected */}
      {paymentMethod && (
        <div>
          <label htmlFor="sender_identifier" className="text-sm text-slate-500">
            {senderInputLabel}
          </label>
          <Input
            type="tel"
            name="sender_identifier"
            placeholder={senderInputPlaceholder}
            className="outline-none bg-slate-100 py-5 rounded-lg border-none text-base"
            value={senderIdentifier}
            onChange={(e) => setSenderIdentifier(e.target.value)}
          />
        </div>
      )}

      {/* You receive */}
      <div>
        <label htmlFor="You receive" className="text-sm text-slate-500">
          You receive
        </label>
        <div className="relative bg-slate-100 py-1 rounded-lg flex items-center space-x-1 justify-center">
          <div className="after:absolute after:right-32 after:top-[0.6rem] after:bottom-0 after:w-[1px] after:h-7 after:bg-slate-400 after:content-[' ']">
            <Input
              type="tel"
              name="receive_amount"
              placeholder=""
              className={clsx(
                "outline-none py-1 number-input font-semibold border-none text-lg ring-0 focus-visible:ring-0",
                sendAmount < (selectedCurLimits?.minimum || 0) && "text-rose-600"
              )}
              value={receiveAmount !== null ? receiveAmount : ""}
              readOnly
            />
          </div>

          <Listbox
            value={receiveAsset}
            onChange={(option) => {
              setReceiveAsset(option);
            }}
          >
            <ListboxButton
              className={clsx(
                "relative block w-40 rounded-lg bg-white/5 py-1.5 pr-8 pl-3 text-left text-sm/6 text-black",
                "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-black/25"
              )}
            >
              <div className="flex items-center space-x-2">
                <Image
                  src={(receiveAsset?.img as string) || ""}
                  alt={receiveAsset?.img as string}
                  width={24}
                  height={24}
                  className="object-cover"
                />
                <p className="text-sm/6 text-black pt-1">
                  {receiveAsset.label}
                </p>
              </div>

              <ChevronDownIcon
                className="group pointer-events-none absolute top-2.5 right-2.5 size-4 fill-black"
                aria-hidden="true"
              />
            </ListboxButton>
            <ListboxOptions
              anchor="bottom"
              transition
              className={clsx(
                "w-[var(--button-width)] rounded-xl shadow-xl bg-white p-1 [--anchor-gap:var(--spacing-1)] focus:outline-none",
                "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0"
              )}
            >
              {currencyReceive?.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option}
                  className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-black/10"
                >
                  <div className="flex items-center space-x-2">
                    <Image
                      src={(option?.img as string) || ""}
                      alt={option?.img as string}
                      width={23}
                      height={23}
                      className="object-cover"
                    />
                    <p className="text-sm/6 text-black">{option.label}</p>
                  </div>
                  <CheckIcon className="invisible size-4 fill-black group-data-[selected]:visible" />
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Listbox>
        </div>
      </div>

      {/* Exchange rate */}
      <div className="bg-slate-100 py-3 font-medium space-y-2 rounded-lg text-xs px-4">
        <div className="flex items-center justify-between">
          <p>Exchange rate</p>
          <p>
            {rate !== null
              ? `1 ${findOption?.label} = ${rate} ${sendAsset?.value.toUpperCase()}`
              : "---"}
          </p>
        </div>
      </div>


      {/* Error message */}
      {error && (
        <div className="text-rose-600 text-sm text-center">{error}</div>
      )}

      {/* Submit button */}
      <div className="my-16">
        <button
          type="submit"
          disabled={isButtonDisabled}
          className={clsx(
            "text-base text-white flex items-center justify-center p-2 btn_position rounded-md",
            isButtonDisabled
              ? "cursor-not-allowed bg-primary opacity-50"
              : "cursor-pointer bg-primary opacity-100"
          )}
        >
          {isPending || quoteState === "loading" || quoteState === "confirming" ? (
            <Image
              src="/assets/progress_activity.svg"
              alt="progress_activity"
              className="animate-spin"
              width={24}
              height={24}
            />
          ) : (
            getButtonText()
          )}
        </button>
      </div>
    </form>
  );
};
