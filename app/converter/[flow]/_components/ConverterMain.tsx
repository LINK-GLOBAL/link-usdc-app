"use client";

import { useEffect, useState, useTransition } from "react";
import {
  fiatOptions,
  stablesOptions,
  AllCurrencyLimits,
  AllStablesLimits,
  AllCurrencyReceiver,
  AllStablesReceiver,
} from "@/constant/constant";
import { getPaymentMethodsByCurrency } from "@/constant/paymentRails";
import { requestPublicQuoteAction } from "@/actions/quote.actions";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import clsx from "clsx";

interface ConverterMainProps {
  flow: "buy" | "sell";
  type?: string;
  asset_code?: string;
  transaction_id?: string;
  token?: string;
  wallet?: string;
  callback?: string;
}

export const ConverterMain = ({
  flow,
  type,
  asset_code,
  transaction_id,
  token,
  wallet,
  callback,
}: ConverterMainProps) => {
  const isBuy = flow === "buy";

  // ── Buy state ──────────────────────────────────────────────────
  const [sendFiatAsset, setSendFiatAsset] = useState(fiatOptions[0]);
  const [receiveStableAsset, setReceiveStableAsset] = useState(stablesOptions[0]);

  // ── Sell state ─────────────────────────────────────────────────
  const [sendStableAsset, setSendStableAsset] = useState(stablesOptions[0]);
  const receiveSellCurrencies =
    AllStablesReceiver.find((r) => r.stable === sendStableAsset.value)?.currencies ||
    fiatOptions;
  const [receiveFiatAsset, setReceiveFiatAsset] = useState(
    receiveSellCurrencies[0] || fiatOptions[0]
  );

  // ── Shared state ───────────────────────────────────────────────
  const [sendAmount, setSendAmount] = useState(isBuy ? 20000 : 20);
  const [paymentMethod, setPaymentMethod] = useState("");

  // Quote
  const [quoteState, setQuoteState] = useState<"idle" | "loading" | "ready">("idle");
  const [rate, setRate] = useState<number | null>(null);
  const [receiveAmount, setReceiveAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Derived values ─────────────────────────────────────────────
  const paymentMethods = isBuy
    ? getPaymentMethodsByCurrency(sendFiatAsset.value)
    : getPaymentMethodsByCurrency(receiveFiatAsset.value);

  const buyLimits = AllCurrencyLimits.find(
    (l) => l.currency === sendFiatAsset.value.toUpperCase()
  )?.limit[0];

  const sellLimits = AllStablesLimits.find(
    (l) => l.currency === sendStableAsset.value
  )?.limit[0] as { minimum: number; maximumBuy: number } | undefined;

  const limits = isBuy ? buyLimits : sellLimits;

  // ── Reset quote when inputs change ──────────────────────────────
  useEffect(() => {
    setQuoteState("idle");
    setRate(null);
    setReceiveAmount(null);
    setError(null);
  }, [sendAmount, sendFiatAsset, receiveStableAsset, sendStableAsset, receiveFiatAsset, paymentMethod]);

  // ── Reset payment method on asset change ───────────────────────
  useEffect(() => {
    setPaymentMethod("");
  }, [sendFiatAsset, receiveFiatAsset, sendStableAsset]);

  // ── Update sell receive currencies when stable changes ──────────
  useEffect(() => {
    if (!isBuy) {
      const currencies =
        AllStablesReceiver.find((r) => r.stable === sendStableAsset.value)?.currencies ||
        fiatOptions;
      setReceiveFiatAsset(currencies[0]);
    }
  }, [sendStableAsset, isBuy]);

  // ── Quote request ───────────────────────────────────────────────
  const handleRequestQuote = () => {
    if (!paymentMethod) {
      setError("Please select a payment method");
      return;
    }
    if (!sendAmount || sendAmount <= 0) {
      setError("Please enter an amount");
      return;
    }
    if (limits && sendAmount < limits.minimum) {
      const assetLabel = isBuy
        ? sendFiatAsset.label
        : sendStableAsset.label;
      setError(`Minimum amount is ${limits.minimum} ${assetLabel}`);
      return;
    }

    setQuoteState("loading");
    setError(null);

    startTransition(async () => {
      const result = await requestPublicQuoteAction(
        isBuy
          ? {
              amount: sendAmount,
              send_asset: sendFiatAsset.value.toUpperCase(),
              receive_asset: receiveStableAsset.value,
              payment_method: paymentMethod,
              trx_type: "onramp",
            }
          : {
              amount: sendAmount,
              send_asset: sendStableAsset.value,
              receive_asset: receiveFiatAsset.value.toUpperCase(),
              payment_method: paymentMethod,
              trx_type: "offramp",
            }
      );

      if (result.status === 200 && result.rate && result.payout_amount) {
        setRate(result.rate);
        setReceiveAmount(result.payout_amount);
        setQuoteState("ready");
      } else {
        setError(result.message || "Failed to get quote. Please try again.");
        setQuoteState("idle");
      }
    });
  };

  // ── Build login URL — callbackUrl points to /buy?... or /sell?... ──
  const buildLoginUrl = () => {
    const dest = isBuy ? "/buy" : "/sell";
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (asset_code) params.set("asset_code", asset_code);
    if (transaction_id) params.set("transaction_id", transaction_id);
    if (token) params.set("token", token);
    if (wallet) params.set("wallet", wallet);
    if (callback) params.set("callback", callback);
    const qs = params.toString();
    const callbackUrl = encodeURIComponent(`${dest}${qs ? `?${qs}` : ""}`);
    return `/auth/login?callbackUrl=${callbackUrl}`;
  };

  // ── Current receive label ────────────────────────────────────────
  const receiveLabel = isBuy ? receiveStableAsset.label : receiveFiatAsset.label;
  const receiveImg = isBuy ? receiveStableAsset.img : receiveFiatAsset.img;

  return (
    <div>
      {/* Header */}
      <nav className="relative flex items-center justify-center mb-3">
        <p className="font-medium text-primary text-base">
          {isBuy ? "Buy Stables" : "Sell Stables"}
        </p>
      </nav>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (quoteState === "idle") handleRequestQuote();
        }}
        className="flex flex-col gap-y-4"
      >
        {/* ── You send ─────────────────────────────────────────── */}
        <div>
          <label className="text-sm text-slate-500">You send</label>
          <div className="relative bg-slate-100 py-1 rounded-lg flex items-center space-x-1 justify-center">
            <div className="after:absolute after:right-32 after:top-[0.6rem] after:bottom-0 after:w-[1px] after:h-7 after:bg-slate-400 after:content-[' ']">
              <Input
                type="tel"
                value={sendAmount}
                onChange={(e) => setSendAmount(Number(e.target.value))}
                className="outline-none py-1 number-input font-semibold border-none text-lg ring-0 focus-visible:ring-0"
                placeholder={isBuy ? "20000" : "20"}
              />
            </div>

            {/* Buy: fiat selector | Sell: stable selector */}
            {isBuy ? (
              <Listbox value={sendFiatAsset} onChange={setSendFiatAsset}>
                <ListboxButton className="relative block w-40 rounded-lg bg-white/5 py-1.5 pr-8 pl-3 text-left text-sm/6 text-black focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-black/25">
                  <div className="flex items-center space-x-2">
                    <Image
                      src={sendFiatAsset.img}
                      alt={sendFiatAsset.label}
                      width={24}
                      height={24}
                      className="object-cover"
                    />
                    <p className="text-sm/6 text-black pt-1">{sendFiatAsset.label}</p>
                  </div>
                  <ChevronDownIcon className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-black/60" />
                </ListboxButton>
                <ListboxOptions
                  anchor="bottom"
                  transition
                  className="w-[var(--button-width)] rounded-xl border border-white/5 bg-white p-1 shadow-lg [--anchor-gap:var(--spacing-1)] focus:outline-none transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0 z-50"
                >
                  {fiatOptions.map((option) => (
                    <ListboxOption
                      key={option.value}
                      value={option}
                      className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-slate-100"
                    >
                      <CheckIcon className="invisible size-4 fill-black group-data-[selected]:visible" />
                      <Image src={option.img} alt={option.label} width={20} height={20} />
                      <p className="text-sm/6 text-black">{option.label}</p>
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Listbox>
            ) : (
              <Listbox value={sendStableAsset} onChange={setSendStableAsset}>
                <ListboxButton className="relative block w-40 rounded-lg bg-white/5 py-1.5 pr-8 pl-3 text-left text-sm/6 text-black focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-black/25">
                  <div className="flex items-center space-x-2">
                    <Image
                      src={sendStableAsset.img}
                      alt={sendStableAsset.label}
                      width={24}
                      height={24}
                      className="object-cover"
                    />
                    <p className="text-sm/6 text-black pt-1">{sendStableAsset.label}</p>
                  </div>
                  <ChevronDownIcon className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-black/60" />
                </ListboxButton>
                <ListboxOptions
                  anchor="bottom"
                  transition
                  className="w-[var(--button-width)] rounded-xl border border-white/5 bg-white p-1 shadow-lg [--anchor-gap:var(--spacing-1)] focus:outline-none transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0 z-50"
                >
                  {stablesOptions.map((option) => (
                    <ListboxOption
                      key={option.value}
                      value={option}
                      className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-slate-100"
                    >
                      <CheckIcon className="invisible size-4 fill-black group-data-[selected]:visible" />
                      <Image src={option.img} alt={option.label} width={20} height={20} />
                      <p className="text-sm/6 text-black">{option.label}</p>
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Listbox>
            )}
          </div>
        </div>

        {/* ── You receive ──────────────────────────────────────── */}
        <div>
          <label className="text-sm text-slate-500">You receive</label>
          <div className="relative bg-slate-100 py-1 rounded-lg flex items-center space-x-1 justify-center">
            <div className="after:absolute after:right-32 after:top-[0.6rem] after:bottom-0 after:w-[1px] after:h-7 after:bg-slate-400 after:content-[' ']">
              <Input
                type="text"
                value={
                  quoteState === "ready" && receiveAmount !== null
                    ? receiveAmount.toLocaleString()
                    : ""
                }
                readOnly
                placeholder=""
                className="outline-none py-1 number-input font-semibold border-none text-lg ring-0 focus-visible:ring-0 bg-transparent"
              />
            </div>

            {/* Buy: stable display | Sell: fiat selector */}
            {isBuy ? (
              <Listbox value={receiveStableAsset} onChange={setReceiveStableAsset}>
                <ListboxButton className="relative block w-40 rounded-lg bg-white/5 py-1.5 pr-8 pl-3 text-left text-sm/6 text-black focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-black/25">
                  <div className="flex items-center space-x-2">
                    <Image
                      src={receiveStableAsset.img}
                      alt={receiveStableAsset.label}
                      width={24}
                      height={24}
                      className="object-cover"
                    />
                    <p className="text-sm/6 text-black pt-1">{receiveStableAsset.label}</p>
                  </div>
                  <ChevronDownIcon className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-black/60" />
                </ListboxButton>
                <ListboxOptions
                  anchor="bottom"
                  transition
                  className="w-[var(--button-width)] rounded-xl border border-white/5 bg-white p-1 shadow-lg [--anchor-gap:var(--spacing-1)] focus:outline-none transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0 z-50"
                >
                  {(AllCurrencyReceiver.find(
                    (r) => r.currency === sendFiatAsset.value.toUpperCase()
                  )?.stables || stablesOptions).map((option: any) => (
                    <ListboxOption
                      key={option.value}
                      value={option}
                      className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-slate-100"
                    >
                      <CheckIcon className="invisible size-4 fill-black group-data-[selected]:visible" />
                      <Image src={option.img} alt={option.label} width={20} height={20} />
                      <p className="text-sm/6 text-black">{option.label}</p>
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Listbox>
            ) : (
              <Listbox value={receiveFiatAsset} onChange={setReceiveFiatAsset}>
                <ListboxButton className="relative block w-40 rounded-lg bg-white/5 py-1.5 pr-8 pl-3 text-left text-sm/6 text-black focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-black/25">
                  <div className="flex items-center space-x-2">
                    <Image
                      src={receiveFiatAsset.img}
                      alt={receiveFiatAsset.label}
                      width={24}
                      height={24}
                      className="object-cover"
                    />
                    <p className="text-sm/6 text-black pt-1">{receiveFiatAsset.label}</p>
                  </div>
                  <ChevronDownIcon className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-black/60" />
                </ListboxButton>
                <ListboxOptions
                  anchor="bottom"
                  transition
                  className="w-[var(--button-width)] rounded-xl border border-white/5 bg-white p-1 shadow-lg [--anchor-gap:var(--spacing-1)] focus:outline-none transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0 z-50"
                >
                  {receiveSellCurrencies.map((option) => (
                    <ListboxOption
                      key={option.value}
                      value={option}
                      className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-slate-100"
                    >
                      <CheckIcon className="invisible size-4 fill-black group-data-[selected]:visible" />
                      <Image src={option.img} alt={option.label} width={20} height={20} />
                      <p className="text-sm/6 text-black">{option.label}</p>
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Listbox>
            )}
          </div>
        </div>

        {/* ── Payment method ───────────────────────────────────── */}
        {paymentMethods.length > 0 && (
          <div>
            <label className="text-sm text-slate-500">Payment method</label>
            <Select
              value={paymentMethod}
              onValueChange={setPaymentMethod}
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

        {/* ── Exchange rate ────────────────────────────────────── */}
        <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
          <p className="text-sm font-semibold text-slate-600">Exchange rate</p>
          <p className="text-sm text-slate-500">
            {quoteState === "ready" && rate !== null
              ? `1 ${isBuy ? receiveStableAsset.label : sendStableAsset.label} = ${rate.toLocaleString()} ${isBuy ? sendFiatAsset.label : receiveFiatAsset.label}`
              : "---"}
          </p>
        </div>

        {/* ── Error ────────────────────────────────────────────── */}
        {error && (
          <div className="text-rose-600 text-xs text-center bg-rose-50 p-2 rounded">
            {error}
          </div>
        )}

        {/* ── Request Quote button ─────────────────────────────── */}
        {quoteState !== "ready" && (
          <button
            type="submit"
            disabled={quoteState === "loading" || !paymentMethod || !sendAmount}
            className={clsx(
              "btn_position text-white font-medium rounded-md transition-colors flex items-center justify-center py-3",
              quoteState === "loading" || !paymentMethod || !sendAmount
                ? "bg-primary/50 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {quoteState === "loading" ? (
              <Image
                src="/assets/progress_activity.svg"
                alt="loading"
                className="animate-spin"
                width={24}
                height={24}
              />
            ) : (
              "Request quote"
            )}
          </button>
        )}
      </form>

      {/* ── Login button — shown only after quote is ready ───── */}
      {quoteState === "ready" && (
        <div className="mt-4 space-y-2">
          <div className="text-center text-xs text-slate-500">
            You will receive{" "}
            <span className="font-semibold text-slate-700">
              {receiveAmount?.toLocaleString()} {receiveLabel}
            </span>
          </div>
          <a
            href={buildLoginUrl()}
            className="btn_position bg-primary hover:bg-primary/90 text-white font-medium rounded-md transition-colors flex items-center justify-center py-3"
          >
            Login to continue
          </a>
        </div>
      )}
    </div>
  );
};
