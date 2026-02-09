import { Navbar } from "@/components/Navbar";
import { ChooseRecipient } from "../../_components/chooseRecipient";
import { auth } from "@/auth";

export default async function ChooseRecipientPage() {
  const session = await auth();

  return (
    <main>
      <Navbar route="/sell/recipient" title="Choose recipient" />
      <ChooseRecipient userId={session?.user?.id || ""} />
    </main>
  );
}
