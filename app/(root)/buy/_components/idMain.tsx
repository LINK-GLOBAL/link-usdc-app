"use client";

import { kycActions, verifyCustomerAction } from "@/actions/auth.actions";
import { FormError, FormSuccess } from "@/components/FormStatus";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KycRails, getIdTypesByCountry } from "@/constant/paymentRails";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface IDMainProps {
  route?: string;
  hasKyc: boolean;
  verified: boolean;
  customerId?: string;
  userName?: string;
  userIdNumber?: string;
  userIdType?: string;
}

export const IDMain = ({
  route,
  hasKyc,
  verified,
  customerId,
  userName,
  userIdNumber,
  userIdType,
}: IDMainProps) => {
  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [idType, setIdType] = useState(userIdType || "");
  const [name, setName] = useState(userName || "");

  const idTypes = getIdTypesByCountry(countryCode);

  useEffect(() => {
    setIdType("");
  }, [countryCode]);

  const navigate = useRouter();

  // console.log("Current", route, hasKyc, verified, customerId, userName, userIdNumber, userIdType);

  // Determine which case we're in:
  // - Fully verified: hasKyc + verified + customerId → redirect
  // - Has KYC but not fully verified: show pre-filled verification form
  // - No KYC: show empty form to fill in
  const isFullyVerified = hasKyc && verified && customerId;
  const needsKyc = !hasKyc;
  // Any user with hasKyc=true who isn't fully verified goes to verification form
  const needsVerification = hasKyc && !isFullyVerified;

  // Case C: Auto-redirect if fully verified
  useEffect(() => {
    if (isFullyVerified && route) {
      navigate.push(route);
    }
  }, [isFullyVerified, route, navigate]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (error || success) {
        setError("");
        setSuccess("");
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [error, success]);

  // Case A: Handle KYC submission (no KYC yet)
  const handleKycSubmit = async (event: FormData) => {
    await kycActions({
      id_type: idType,
      id_number: event?.get("id_number") as string,
      country,
      country_code: countryCode,
    })
      .then(async (data) => {
        if (data.status === 400) return setError(data?.message);

        setSuccess(data?.message);
        return navigate.push(route ? route : "/buy");
      })
      .catch(() => {
        setError("Something went wrong");
      });
  };

  // Case B: Handle name verification submission
  const handleVerificationSubmit = async (event: FormData) => {
    const submittedName = event?.get("name") as string;

    await verifyCustomerAction({ name: submittedName })
      .then(async (data) => {
        if (data.status === "Failed") {
          // Parse error message if it's JSON string
          let errorMessage = data?.message;
          try {
            const parsed = JSON.parse(errorMessage);
            errorMessage = parsed.error || errorMessage;
          } catch {
            // If parsing fails, use original message
          }
          return setError(errorMessage);
        }

        setSuccess(data?.message || "Verification successful!");

        // Refresh to get updated session data (triggers JWT callback)
        navigate.refresh();

        // Small delay to allow session refresh, then redirect
        setTimeout(() => {
          navigate.push(route ? route : "/buy");
        }, 100);
      })
      .catch(() => {
        setError("Something went wrong");
      });
  };

  // Case C: Show loading while redirecting
  if (isFullyVerified) {
    return (
      <div className="flex items-center justify-center my-32">
        <Image
          src="/assets/progress_activity.svg"
          alt="progress_activity"
          className="animate-spin"
          width={24}
          height={24}
        />
      </div>
    );
  }

  // Case A: KYC form (user has no KYC)
  if (needsKyc) {
    return (
      <form>
        <h2 className="text-center text-md font-semibold m-4">Fill KYC details below</h2>
        <FormError message={error} className="text-xs" />
        <FormSuccess message={success} />

        <div className="space-y-5 mt-5">
          <div>
            <label htmlFor="country" className="text-sm text-slate-500">
              Country
            </label>
            <Select
              onValueChange={(value) => {
                const selected = KycRails.find((r) => r.country_code === value);
                setCountryCode(value);
                setCountry(selected?.country || "");
              }}
              required
            >
              <SelectTrigger className="w-full outline-none bg-slate-100 py-5 rounded-md border-none text-base">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {KycRails.map((r) => (
                  <SelectItem key={r.country_code} value={r.country_code}>
                    {r.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="id_type" className="text-sm text-slate-500">
              ID Type
            </label>
            <Select
              onValueChange={(value) => setIdType(value)}
              disabled={!countryCode}
              required
            >
              <SelectTrigger className="w-full outline-none bg-slate-100 py-5 rounded-md border-none text-base">
                <SelectValue placeholder="" />
              </SelectTrigger>
              <SelectContent>
                {idTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="id_number" className="text-sm text-slate-500">
              ID number
            </label>
            <Input
              type="text"
              name="id_number"
              disabled={idType === ""}
              required
              className="outline-none bg-slate-100 py-5 rounded-md border-none text-base"
            />
          </div>
        </div>

        <div className="my-32">
          <button
            type="submit"
            disabled={isPending}
            formAction={(event) =>
              startTransition(() => handleKycSubmit(event))
            }
            className="bg-primary text-base text-white flex items-center justify-center p-2 btn_position rounded-md"
          >
            {isPending ? (
              <Image
                src="/assets/progress_activity.svg"
                alt="progress_activity"
                className="animate-spin"
                width={24}
                height={24}
              />
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </form>
    );
  }

  // Case B: Verification form (hasKyc=true but not fully verified)
  // Show all KYC details pre-filled — user just confirms and clicks Verify
  if (needsVerification) {
    return (
      <form>
        <h2 className="text-center text-lg font-semibold my-2">Verify Your Identity</h2>
        <p className="text-center text-sm text-slate-500 mb-4">
          Your KYC details are on file. Please confirm and verify.
        </p>
        <FormError message={error} className="text-xs" />
        <FormSuccess message={success} />

        <div className="space-y-5 mt-5">
          {userName && (
            <div>
              <label className="text-sm text-slate-500">Full name</label>
              <Input
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="outline-none bg-slate-100 py-5 rounded-md border-none text-base"
              />
            </div>
          )}
          {userIdType && (
            <div>
              <label className="text-sm text-slate-500">ID Type</label>
              <Input
                type="text"
                name="id_type"
                value={userIdType}
                readOnly
                className="outline-none bg-slate-100 py-5 rounded-md border-none text-base text-slate-600 cursor-not-allowed"
              />
            </div>
          )}
          {userIdNumber && (
            <div>
              <label className="text-sm text-slate-500">ID Number</label>
              <Input
                type="text"
                name="id_number"
                value={userIdNumber}
                readOnly
                className="outline-none bg-slate-100 py-5 rounded-md border-none text-base text-slate-600 cursor-not-allowed"
              />
            </div>
          )}
        </div>

        <div className="my-32">
          <button
            type="submit"
            disabled={isPending}
            formAction={(event) =>
              startTransition(() => handleVerificationSubmit(event))
            }
            className="bg-primary text-base text-white flex items-center justify-center p-2 btn_position rounded-md"
          >
            {isPending ? (
              <Image
                src="/assets/progress_activity.svg"
                alt="progress_activity"
                className="animate-spin"
                width={24}
                height={24}
              />
            ) : (
              "Verify"
            )}
          </button>
        </div>
      </form>
    );
  }

  return null;
};
