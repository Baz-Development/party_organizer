const STORAGE_KEY = "convite:visitor-id";

/**
 * Identidade estável de quem não tem conta nem convite, para curtidas e
 * limite de envios (ver design.md de `add-media-storage-backend`). Gerada
 * uma vez por navegador e guardada em `localStorage` — não é autenticação,
 * só evita duplicar curtida/considerar dois envios como pessoas diferentes.
 *
 * `""` em Server Components: `localStorage` não existe no servidor, e este
 * módulo só é chamado a partir de Client Components (`"use client"`).
 */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, id);
  return id;
}
