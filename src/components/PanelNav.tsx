"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

/**
 * Aba ativa = o item de href mais específico que casa com a rota. Sem isso,
 * "Visão geral" (`/painel`) casaria por prefixo com toda subpágina
 * (`/painel/sorteios/...`) e ficaria marcada junto com a aba de verdade.
 */
function activeHref(pathname: string, items: { href: string }[]): string | undefined {
  return items
    .filter((it) => pathname === it.href || pathname.startsWith(`${it.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

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
  const current = activeHref(pathname, items);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3.5">
        {/* Só identidade, sem link: a navegação de volta é a aba "Visão geral". */}
        <div className="flex items-center gap-2.5 font-display text-[15px] font-semibold text-ink-soft">
          <Logo variant="mark" height={30} />
          {brand}
        </div>
        <nav className="no-scrollbar flex flex-1 gap-1 overflow-x-auto">
          {items.map((it) => {
            const active = it.href === current;
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`relative shrink-0 rounded-lg px-3.5 py-2 text-[14px] font-semibold no-underline transition after:absolute after:inset-x-3.5 after:bottom-0.5 after:h-[2px] after:rounded-full after:transition ${
                  active
                    ? "text-ink after:bg-accent"
                    : "text-ink-soft after:bg-transparent hover:bg-paper-2 hover:text-ink"
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
