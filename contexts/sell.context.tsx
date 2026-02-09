"use client";

import { createContext, useContext, useState } from "react";

type SellContextType = {
  children: React.ReactNode;
};

type SellProps = {
  bank_name: string;
  account_number: string;
  account_name?: string;
  routing_number?: string;
  account_type?: string;
  full_name?: string;
  pix_key?: string;
  interac?: string;
  network?: string;
  quote_id?: string;
  payment_method?: string;
};

type SellContextProp = {
  sellData: SellProps;
  setSellData: React.Dispatch<React.SetStateAction<SellProps>>;
};

const SellContext = createContext<SellContextProp | null>(null);

export default function SellContextProvider({ children }: SellContextType) {
  const [sellData, setSellData] = useState<SellProps>({
    bank_name: "",
    account_name: "",
    account_number: "",
    routing_number: "",
    account_type: "",
    full_name: "",
    pix_key: "",
    interac: "",
    network: "",
    quote_id: "",
    payment_method: "",
  });

  return (
    <SellContext.Provider value={{ sellData, setSellData }}>
      {children}
    </SellContext.Provider>
  );
}

export const useSellContext = () => {
  const context = useContext(SellContext);

  if (!context) {
    throw new Error(
      "useSellContext must be used within a useSellContextProvider"
    );
  }
  return context;
};
