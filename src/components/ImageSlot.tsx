import type { CSSProperties } from "react";
import Image from "next/image";

type Shape = "rect" | "circle";

/**
 * Slot de imagem. Com `src`, mostra a imagem real (otimizada pelo `next/image`,
 * preenchendo o contêiner).
 *
 * Sem `src` o comportamento depende de `neutral`:
 * - padrão: placeholder com legenda (telas internas, listas de presentes etc.)
 * - `neutral`: preenchimento sutil da paleta da marca, sem texto — usado na
 *   landing, onde vários slots caem na primeira dobra e um texto de placeholder
 *   passaria impressão de página inacabada.
 */
export function ImageSlot({
  src,
  placeholder = "Imagem",
  shape = "rect",
  className = "",
  style,
  compact,
  neutral = false,
}: {
  src?: string | null;
  placeholder?: string;
  shape?: Shape;
  className?: string;
  style?: CSSProperties;
  compact?: boolean;
  neutral?: boolean;
}) {
  const rounded = shape === "circle" ? "rounded-full" : "";
  const surface = neutral
    ? "bg-[linear-gradient(135deg,var(--accent-soft)_0%,var(--paper-2)_55%,var(--accent-soft)_100%)]"
    : "bg-[linear-gradient(135deg,#e7ded1_0%,#d9cfbf_50%,#e7ded1_100%)]";

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${surface} ${rounded} ${className}`}
      style={style}
      role="img"
      aria-label={placeholder}
    >
      {src ? (
        <Image
          src={src}
          alt={placeholder}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 90vw, 320px"
        />
      ) : neutral ? null : (
        <span
          className={`px-2 text-center font-medium tracking-wide text-ink-faint ${
            compact ? "text-[9px]" : "text-[11px]"
          }`}
        >
          {placeholder}
        </span>
      )}
    </div>
  );
}
