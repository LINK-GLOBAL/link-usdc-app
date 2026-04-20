import { Navbar } from "@/components/Navbar";
import Image from "next/image";
import { LoginForm } from "./_components/loginForm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (session?.user?.id) return redirect("/");

  return (
    <main>
      <Navbar route="/" />

      <div className="my-9 space-y-3">
        <div className="flex items-center justify-center">
          <Image src="/logo.png" alt="logo" width={100} height={100} />
        </div>
        <p className="text-xs text-center">
          Log in to your account.
        </p>
      </div>

      <LoginForm callbackUrl={params.callbackUrl} />
    </main>
  );
}
