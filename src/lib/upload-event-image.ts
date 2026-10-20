/**
 * Envia uma imagem do painel direto ao Storage por URL assinada (mesmo fluxo
 * da capa) e devolve o path para ser gravado junto do registro — foto de
 * presente, de prêmio de sorteio etc. Lança com a mensagem a exibir.
 */
export async function uploadEventImage(eventSlug: string, file: File): Promise<string> {
  const uploadRes = await fetch(`/api/eventos/${eventSlug}/capa/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type }),
  });
  const uploadBody = await uploadRes.json().catch(() => null);
  if (!uploadRes.ok) {
    throw new Error(uploadBody?.error ?? "Não foi possível preparar o envio.");
  }

  const { path, signedUrl } = uploadBody.data as { path: string; signedUrl: string };
  const putRes = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putRes.ok) throw new Error("Não foi possível enviar o arquivo.");

  return path;
}
