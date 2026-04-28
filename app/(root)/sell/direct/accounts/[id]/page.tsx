"use client";

import { CopyButton } from "@/components/CopyButton";
import { Navbar } from "@/components/Navbar";
import { useDirectContext } from "@/contexts/direct.context";
import { truncateString } from "@/lib/format";

import Image from "next/image";
import { useRouter } from "next/navigation";

type props = {
  params: {
    id: string;
  };
};

export default function AccountId({ params }: props) {
  const { directData } = useDirectContext();
  const navigate = useRouter();

  const getData = directData?.wallets?.find(
    (item) => item?.network === params?.id
  );

  return (
    <main>
      <Navbar
        route="/sell/direct/accounts"
        title={`Send ${directData?.asset}`}
      />
      <div className="bg-p-light p-2 rounded-md items-center flex space-x-1">
        <span className="material-icons-round block text-primary">info</span>
        <p className="text-primary text-[9px]">
          Ensure to only send {directData?.asset} to this wallet address on the{" "}
          {getData?.network === "ethereum" ? (
            "Polygon"
          ) : (
            <span className="capitalize">{getData?.network}</span>
          )}{" "}
          network.
        </p>
      </div>

      <section className="rounded-lg bg-[#F7F7F7] p-4 space-y-4 mt-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#696F79]">Supported asset</p>
          <p className="font-semibold text-sm">{directData?.asset}</p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-[#696F79]">Send to</p>
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm">
              {truncateString(String(getData?.address), 5, 4)}
            </p>

            <CopyButton className="text-2xl" value={String(getData?.address)} />
            <button
              type="button"
              onClick={() =>
                navigate.push(`/sell/direct/accounts/${params.id}/qrc`)
              }
            >
              <span className="text-2xl material-symbols-outlined">
                qr_code
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-[#696F79]">Receive cash in</p>
          <div className="text-right">
            <p className="text-sm font-semibold">
              {truncateString(String(directData?.account_number), 2, 2, "****")}
            </p>
            <p className="text-sm font-semibold">{directData?.bank_name}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-[#696F79]">Network</p>
          <div className="flex items-center gap-1">
            <Image
              src={`/assets/png/networks/${getData?.network === "ethereum" ? "polygon" : getData?.network}.png`}
              alt="polygon"
              width={20}
              height={20}
            />
            <p className="text-sm font-semibold capitalize">
              {" "}
              {getData?.network === "ethereum" ? "polygon" : getData?.network}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-[#696F79]">Rate</p>
          <p className="font-semibold text-sm">
            1 {directData?.asset} = 1 {directData?.asset.slice(0, 3)}
          </p>
        </div>
      </section>
    </main>
  );
}
