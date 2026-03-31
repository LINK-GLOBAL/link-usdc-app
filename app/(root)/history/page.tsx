import { getDirectTranasctionsActions } from "@/actions/direct";
import { History } from "@/components/History";
import { Navbar } from "@/components/Navbar";

export default async function page() {
  const response = await getDirectTranasctionsActions();

  return (
    <main>
      <Navbar route="/sell" title="Order history" />

      <History transactions={response.data} />
    </main>
  );
}
