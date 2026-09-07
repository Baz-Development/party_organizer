import Image from "next/image";

/**
 * Logo da ALF Eventos. Dois recortes do mesmo arquivo original, já com
 * fundo removido (PNG transparente) — servem tanto em fundo claro quanto
 * sobre `bg-ink`.
 *
 * - `lockup`  → assinatura horizontal "ALF EVENTOS" (cabeçalhos, rodapé)
 * - `mark`    → selo circular (ícones, navegação compacta)
 */
export function Logo({
  variant = "lockup",
  height = 40,
  className,
  priority = false,
}: {
  variant?: "lockup" | "mark";
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  const src = variant === "mark" ? "/logo-alf-circular.png" : "/logo-alf.png";
  const ratio = variant === "mark" ? 720 / 710 : 900 / 556;

  return (
    <Image
      src={src}
      alt="ALF Eventos"
      height={height}
      width={Math.round(height * ratio)}
      priority={priority}
      className={className}
    />
  );
}
