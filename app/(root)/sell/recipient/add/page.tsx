import { Navbar } from "@/components/Navbar";
import { AddRecipientMain } from "../../_components/addRecipientMain";
import { auth } from "@/auth";

export default async function AddRecipientPage() {
  const session = await auth();

  return (
    <main>
      <Navbar route="/sell/recipient" title="Payout Account" />
      <AddRecipientMain />
    </main>
  );
}
