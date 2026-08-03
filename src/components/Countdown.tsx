"use client";

import { useNow } from "@/lib/use-now";

const pad = (n: number) => String(n).padStart(2, "0");

export function useCountdown(iso: string) {
  const now = useNow();
  const target = new Date(iso).getTime();

  // Antes da hidratação `now` é 0, então mostramos zeros — nunca um valor que
  // divirja do HTML gerado no servidor.
  const diff = now === 0 ? 0 : Math.max(0, target - now);

  return {
    days: pad(Math.floor(diff / 86400000)),
    hours: pad(Math.floor((diff % 86400000) / 3600000)),
    mins: pad(Math.floor((diff % 3600000) / 60000)),
    secs: pad(Math.floor((diff % 60000) / 1000)),
    done: now !== 0 && diff === 0,
  };
}

export function Countdown({ iso, size = "md" }: { iso: string; size?: "sm" | "md" }) {
  const { days, hours, mins, secs } = useCountdown(iso);
  const units = [
    { v: days, l: "dias" },
    { v: hours, l: "horas" },
    { v: mins, l: "min" },
    { v: secs, l: "seg" },
  ];
  const num = size === "sm" ? "text-[28px]" : "text-[clamp(30px,6vw,44px)]";

  return (
    <div className="flex justify-center gap-5 sm:gap-7">
      {units.map((u) => (
        <div key={u.l} className="min-w-16 text-center">
          <div className={`font-display font-semibold tabular-nums ${num}`}>{u.v}</div>
          <div className="mt-1.5 text-[12px] uppercase tracking-[1.5px] text-ink-soft">{u.l}</div>
        </div>
      ))}
    </div>
  );
}
