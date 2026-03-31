import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import RampContextProvider from "@/contexts/ramp.context";
import BuyContextProvider from "@/contexts/buy.context";
import SellContextProvider from "@/contexts/sell.context";
import InitContextProvider from "@/contexts/init.context";
import { Header } from "@/components/Header";
import { MainFooter } from "@/components/MainFooter";
import Image from "next/image";

const sora = Sora({ subsets: ["latin-ext"] });

export const metadata: Metadata = {
  title: "LINK Ramp",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={sora.className}>
        {/* <div>
          <Header />
        </div> */}

        <div className="absolute -bottom-36 -z-10 h-full w-full">
          <Image src="/assets/png/bg-img.jpg" alt="bg" fill />
        </div>

        <div className="container" id="ramp-container">
          <div className="aspect-ratio">
            <div className="h-full overflow-y-auto py-5 px-6 pb-28 scrollbar">
              <InitContextProvider>
                <RampContextProvider>
                  <BuyContextProvider>
                    <SellContextProvider>{children}</SellContextProvider>
                  </BuyContextProvider>
                </RampContextProvider>
              </InitContextProvider>
            </div>
            <Footer />
          </div>
        </div>

        {/* <div className="z-10">
          <MainFooter />
        </div> */}
      </body>
    </html>
  );
}
