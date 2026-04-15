import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ConverterMain } from "./_components/ConverterMain";

interface ConverterPageProps {
  params: Promise<{ flow: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ConverterPage({
  params,
  searchParams,
}: ConverterPageProps) {
  const { flow } = await params;
  const query = await searchParams;

  // Only allow "buy" or "sell" flows
  if (flow !== "buy" && flow !== "sell") {
    redirect("/");
  }

  const session = await auth();

  // Already logged in → skip converter and go straight to authenticated flow
  if (session?.user?.id) {
    const qs = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined) as [string, string][]
    ).toString();
    redirect(`/${flow}${qs ? `?${qs}` : ""}`);
  }

  // Pass all URL params down to the client component
  return (
    <ConverterMain
      flow={flow as "buy" | "sell"}
      type={query.type}
      asset_code={query.asset_code}
      transaction_id={query.transaction_id}
      token={query.token}
      wallet={query.wallet}
      callback={query.callback}
    />
  );
}
