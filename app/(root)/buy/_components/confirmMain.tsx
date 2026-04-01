"use client";

import { Input } from "@/components/ui/input";
import { walletValidate } from "@/actions/auth.actions";
import { useBuyContext } from "@/contexts/buy.context";
import { useRampContext } from "@/contexts/ramp.context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { FormError, FormSuccess } from "@/components/FormStatus";

export const ConfirmForm = () => {
  const [feedback, setFeedback] = useState(false);

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const [isPending, startTransition] = useTransition();

  const { buyData, setBuyData } = useBuyContext();
  const { rampData } = useRampContext();
  const router = useRouter();

  // console.log("Buy-data", buyData);
  // console.log("Ramp-data", rampData);

  const findNetwork = networkOptions.find(
    (item) => item.label === buyData?.network
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (feedback) {
        setError("");
        setSuccess("");
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [feedback]);

  const handleFeedback = (type: string, message: string) => {
    if (type === "success") setSuccess(message);
    if (type === "error") setError(message);

    return setFeedback(true);
  };

  const handleContinue = async (event: FormData) => {
    setBuyData({
      ...buyData,
      wallet_address: event.get("wallet_address") as string,
      network: findNetwork?.label as string,
      stellar_memo: event.get("stellar_memo") as string,
    });

    const request = await walletValidate({
      chain: findNetwork?.value as string,
      value: event?.get("wallet_address") as string,
    });

    if (request?.valid === true) {
      handleFeedback("success", request.message);
      // KYC check is now done at menu level, always proceed to payment
      return router.push("/buy/payment");
    } else {
      return handleFeedback("error", request.message);
    }
  };

  return (
    <form action={(event) => startTransition(() => handleContinue(event))}>
      <FormError message={error} />
      <FormSuccess message={success} />

      <div className="space-y-3 mt-4">
        <div>
          <label htmlFor="amount" className="text-sm text-slate-500">
            Amount
          </label>
          <Input
            type="number"
            name="amount"
            required
            disabled
            defaultValue={rampData.send_amount}
            className="outline-none number-input bg-slate-100 py-5 rounded-md border-none text-base"
          />
        </div>
        <div>
          <label htmlFor="network" className="text-sm text-slate-500">
            Network
          </label>
          <Input
            type="text"
            name="network"
            disabled
            readOnly
            defaultValue={findNetwork?.label}
            required
            className="outline-none bg-slate-100 py-5 rounded-md border-none text-base"
          />
        </div>
        <div>
          <label htmlFor="wallet_address" className="text-sm text-slate-500">
            Wallet Address
          </label>
          <Input
            type="text"
            name="wallet_address"
            disabled={buyData?.network === "" ? true : false}
            readOnly={Boolean(buyData?.wallet_address)}
            defaultValue={buyData?.wallet_address || ""}
            required
            className="outline-none bg-slate-100 py-5 rounded-md border-none text-base"
          />
        </div>
        {findNetwork?.label === "Stellar" ? (
          <div>
            <label htmlFor="stellar_memo" className="text-sm text-slate-500">
              Stellar Memo <span className="text-slate-400">(optional)</span>
            </label>
            <Input
              type="text"
              name="stellar_memo"
              className="outline-none bg-slate-100 py-5 rounded-md border-none text-base"
            />
          </div>
        ) : null}
      </div>

      {/* {feedback && (
        <div className="bg-rose-200 p-1 rounded flex mt-2 items-center space-x-2">
          <span className="material-icons-round block text-rose-600">info</span>
          <p className="text-rose-600 text-xs">{error}</p>
        </div>
      )} */}

      <div className="my-15">
        <button
          type="submit"
          className={`bg-primary text-base text-white flex items-center justify-center p-2 btn_position rounded-md`}
        >
          {isPending ? (
            <Image
              src="/assets/progress_activity.svg"
              alt="progress_activity"
              className="animate-spin"
              width={24}
              height={24}
            />
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </form>
  );
};

const networkOptions = [
  {
    label: "Polygon",
    value: "matic",
  },
  {
    label: "Solana",
    value: "sol",
  },
  {
    label: "Avalanche",
    value: "avax",
  },
  {
    label: "Base",
    value: "eth",
  },
  {
    label: "Stellar",
    value: "xlm",
  },
  {
    label: "XRPL",
    value: "xrp",
  },
];
