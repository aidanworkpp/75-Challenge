"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/",         label: "Today",    icon: "◉" },
  { href: "/history",  label: "History",  icon: "▤" },
  { href: "/insights", label: "Insights", icon: "▲" },
  { href: "/rules",    label: "Rules",    icon: "❖" },
  { href: "/coach",    label: "Coach",    icon: "⚡" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 border-t border-border bg-surface pb-safe z-40">
      <ul className="flex items-stretch justify-around max-w-lg mx-auto">
        {TABS.map((t) => {
          const active =
            t.href === "/"
              ? path === "/"
              : t.href === "/coach"
                ? path.startsWith("/coach") || path === "/motivation"
                : path.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={clsx(
                  "flex flex-col items-center gap-0.5 py-2 text-xs",
                  active ? "text-accent" : "text-muted",
                )}
              >
                <span className="text-lg leading-none">{t.icon}</span>
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
