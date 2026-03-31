"use client";

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";

type DTProps = {
  transactions: { asset: string; amount: number; transaction_status: string }[];
};

export const History = ({ transactions }: DTProps) => {
  return (
    <section>
      <TabGroup>
        <TabList className="flex gap-10 items-center">
          <Tab className="text-sm/6 font-medium text-[#D9D9D9] focus:outline-none data-[selected]:text-primary data-[hover]:text-primary/80 transition-all">
            Buy
          </Tab>

          <Tab className="text-sm/6 font-medium text-[#D9D9D9] focus:outline-none data-[selected]:text-primary data-[hover]:text-primary/80 transition-all">
            Sell
          </Tab>

        </TabList>

        <TabPanels className="mt-5">
          <TabPanel className="">
            <div className="grid grid-cols-3 border-b p-2">
              <p className="text-xs font-semibold">Currency</p>
              <p className="text-xs font-semibold">Crypto amount</p>
              <p className="text-xs font-semibold place-self-center">Status</p>
            </div>

            <div className=" h-80 pb-5 scrollbar">
              <div className="grid gap-3 p-2">
                <div className="flex flex-col items-center justify-center gap-2 my-16">
                  <p className="material-symbols-outlined text-5xl">contract</p>
                  <p className="text-[#C4C4C4] text-xs">
                    Your orders will show up here
                  </p>
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel className="">
            <div className="grid grid-cols-3 border-b p-2">
              <p className="text-xs font-semibold">Asset</p>
              <p className="text-xs font-semibold">Cash amount</p>
              <p className="text-xs font-semibold place-self-center">Status</p>
            </div>

            <div className=" h-80 pb-5 scrollbar">
              <div className="flex flex-col items-center justify-center gap-2 my-16">
                <p className="material-symbols-outlined text-5xl">contract</p>
                <p className="text-[#C4C4C4] text-xs">
                  Your orders will show up here
                </p>
              </div>
            </div>
          </TabPanel>

        </TabPanels>
      </TabGroup>
    </section>
  );
};
