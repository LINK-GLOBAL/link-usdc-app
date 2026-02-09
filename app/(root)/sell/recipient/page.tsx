import { Navbar } from "@/components/Navbar";
import { RecipientMain } from "../_components/recipientMain";
import { auth } from "@/auth";

export default async function Recipient() {
  const session = await auth();

  return (
    <main>
      <Navbar route="/sell" title="Receiver's details" />
      <RecipientMain userId={session?.user?.id || ""} />
    </main>
  );
}
