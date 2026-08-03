"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PanelNav({
  brand,
  items,
  right,
}: {
  brand: string;
  items: { href: string; label: string }[];
  right?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3.5">
        <Link href="/" className="font-display text-[18px] font-semibold text-ink no-underline">
          {brand}
        </Link>
        <nav className="no-scrollbar flex flex-1 gap-1 overflow-x-auto">
          {items.map((it) => {
            const active =
              pathname === it.href || (it.href !== "/" && pathname.startsWith(`${it.href}/`));
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`shrink-0 rounded-lg px-3.5 py-2 text-[14px] font-semibold no-underline transition ${
                  active ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-2 hover:text-ink"
                }`}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
        {right}
      </div>
    </header>
  );
}
