"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const Navbar = ({
  route,
  title,
}: {
  route?: string;
  title?: string;
}) => {
  const path = usePathname();
  const searchParams = useSearchParams();
  const navigate = useRouter();

  // Build menu href with current URL as returnTo
  const currentSearch = searchParams.toString();
  const currentUrl = currentSearch ? `${path}?${currentSearch}` : path;
  const menuHref = `/menu?returnTo=${encodeURIComponent(currentUrl)}`;

  // If route and title are provided, show centered title with back arrow
  if (route && title) {
    return (
      <nav className="relative flex items-center justify-between mb-3">
        {/* Back arrow */}
        <button
          onClick={() => navigate.push(route)}
          className="bg-p-light text-primary flex items-center justify-center rounded-full p-1.5"
        >
          <span className="material-icons-round">arrow_back</span>
        </button>

        {/* Centered title */}
        <p className="font-medium text-md absolute left-1/2 transform -translate-x-1/2">
          {title}
        </p>

        {/* Menu button */}
        <Link
          href={menuHref}
          className="bg-p-light text-primary flex items-center justify-center rounded-full p-1.5"
        >
          <span className="material-icons-round">menu</span>
        </Link>
      </nav>
    );
  }

  // Default navbar for main pages (Buy/Sell)
  return (
    <nav className="relative flex items-center justify-between gap-5 mb-3">
      {(path === "/buy" || path === "/buy/confirm" || path === "/buy/pop") && (
        <div className="flex items-center w-full justify-center">
          <Link
            href="/buy"
            className={`${
              path.indexOf("/buy") !== -1 ? "text-primary" : "text-gray-400"
            } block text-base font-medium`}
          >
            Buy Stables
          </Link>
        </div>
      )}
      {(path === "/sell" || path === "/sell/confirm" || path === "/sell/pop") && (
        <div className="flex items-center w-full justify-center">
          <Link
            href="/sell"
            className={`${
              path.indexOf("/sell") !== -1 ? "text-primary" : "text-gray-400"
            } block text-base font-medium`}
          >
            Sell Stables
          </Link>
        </div>
      )}

      {title && !route && <p className="font-medium text-lg">{title}</p>}

      <Link
        href={menuHref}
        className="bg-p-light text-primary flex items-center justify-center rounded-full p-1.5"
      >
        <span className="material-icons-round">menu</span>
      </Link>
    </nav>
  );
};

export const MenuNavbar = ({ returnTo }: { returnTo?: string }) => {
  const navigate = useRouter();
  // Validate returnTo is a safe relative path
  const isValidReturnTo = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//");
  const destination = isValidReturnTo ? returnTo : "/sell";
  return (
    <nav className="flex items-center justify-between mb-5">
      <p className="font-medium">Menu</p>

      <div
        onClick={() => navigate.push(destination)}
        className="bg-p-light text-primary cursor-pointer flex items-center justify-center rounded-full p-1.5"
      >
        <span className="material-icons-round">close</span>
      </div>
    </nav>
  );
};
