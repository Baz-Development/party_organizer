"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Sheet } from "@/components/ui";

/**
 * Popup de confirmação e de aviso no visual do painel, no lugar do
 * `confirm()`/`alert()` nativos do navegador (feios, fora do tema e que
 * derrubam a tela cheia).
 *
 * Uso:
 *   const { confirm, notify, dialog } = useConfirm();
 *   if (!(await confirm({ title: "Excluir?", confirmLabel: "Excluir", tone: "danger" }))) return;
 *   await notify({ title: "Não foi possível excluir", message: erro });
 *   …
 *   return <>{…}{dialog}</>;
 */

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** `danger` para ações que apagam algo. */
  tone?: "danger" | "primary";
}

export interface NotifyOptions {
  title: string;
  message?: string;
  buttonLabel?: string;
}

interface Pending extends ConfirmOptions {
  /** Aviso: um botão só, sem escolha. */
  notice?: boolean;
  resolve: (ok: boolean) => void;
}

export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  );

  const notify = useCallback(
    ({ title, message, buttonLabel }: NotifyOptions) =>
      new Promise<void>((resolve) =>
        setPending({
          title,
          message,
          confirmLabel: buttonLabel ?? "Entendi",
          notice: true,
          resolve: () => resolve(),
        }),
      ),
    [],
  );

  const close = useCallback(
    (ok: boolean) => {
      pending?.resolve(ok);
      setPending(null);
    },
    [pending],
  );

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, close]);

  const danger = pending?.tone === "danger";

  const dialog = (
    <Sheet open={!!pending} onClose={() => close(false)} maxWidth={420}>
      {pending && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
          <div id="confirm-title" className="font-display text-[22px] font-semibold leading-tight">
            {pending.title}
          </div>
          {pending.message && (
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-soft">{pending.message}</p>
          )}
          {/* Botões afastados (e empilhados no celular) para não errar o toque;
              o foco começa em "Cancelar" quando a ação apaga algo. */}
          {pending.notice ? (
            <div className="mt-7 flex justify-end">
              <Button autoFocus onClick={() => close(true)} className="sm:min-w-[130px]">
                {pending.confirmLabel}
              </Button>
            </div>
          ) : (
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:gap-6">
              <Button
                variant="outline"
                autoFocus={danger}
                onClick={() => close(false)}
                className="sm:min-w-[130px]"
              >
                {pending.cancelLabel ?? "Cancelar"}
              </Button>
              <Button
                variant={danger ? "danger" : "primary"}
                autoFocus={!danger}
                onClick={() => close(true)}
                className="sm:min-w-[150px]"
              >
                {pending.confirmLabel}
              </Button>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );

  return { confirm, notify, dialog };
}
