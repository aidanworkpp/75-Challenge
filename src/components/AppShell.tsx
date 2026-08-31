import Link from "next/link";
import BottomNav from "./BottomNav";

export default function AppShell({
  title,
  right,
  children,
  hideNav,
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  hideNav?: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto">
      {title && (
        <header className="pt-safe px-4 pt-4 pb-2 flex items-center justify-between">
          <h1 className="text-xl font-bold">{title}</h1>
          <div className="flex items-center gap-2">
            {right}
            <Link
              href="/settings"
              aria-label="Settings"
              className="w-9 h-9 flex items-center justify-center rounded-md bg-surface border border-border text-muted"
            >
              ⚙
            </Link>
          </div>
        </header>
      )}
      <main className="flex-1 px-4 pb-28">{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
