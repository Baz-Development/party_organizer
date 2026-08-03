import type { CSSProperties } from "react";

type Shape = "rect" | "circle";

/**
 * Equivalente ao <image-slot> do projeto de design: um placeholder de imagem
 * com legenda. Enquanto não há upload/banco, todas as fotos usam este slot.
 */
export function ImageSlot({
  placeholder = "Imagem",
  shape = "rect",
  className = "",
  style,
  compact,
}: {
  placeholder?: string;
  shape?: Shape;
  className?: string;
  style?: CSSProperties;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#e7ded1_0%,#d9cfbf_50%,#e7ded1_100%)] ${
        shape === "circle" ? "rounded-full" : ""
      } ${className}`}
      style={style}
      role="img"
      aria-label={placeholder}
    >
      <span
        className={`px-2 text-center font-medium tracking-wide text-[#9c917f] ${
          compact ? "text-[9px]" : "text-[11px]"
        }`}
      >
        {placeholder}
      </span>
    </div>
  );
}
