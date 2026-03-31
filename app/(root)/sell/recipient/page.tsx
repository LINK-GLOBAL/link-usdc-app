import { Navbar } from "@/components/Navbar";
import { RecipientMain } from "../_components/recipientMain";
import { auth } from "@/auth";

export default async function Recipient() {
  const session = await auth();

  return (
    <main>
      <Navbar route="/sell" title="Payout account" />
      <RecipientMain
        userId={session?.user?.id || ""}
      />
    </main>
  );
}
