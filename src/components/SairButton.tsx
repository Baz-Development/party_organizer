/**
 * Encerra a sessão.
 *
 * Um `<form method="post">` em vez de um link: a rota de saída só aceita POST,
 * para que prefetch de navegador ou uma imagem apontando para ela não derrubem
 * a sessão de ninguém. Como é HTML puro, funciona sem JavaScript.
 */
export function SairButton() {
  return (
    <form action="/api/auth/sair" method="post">
      <button
        type="submit"
        className="cursor-pointer rounded-lg border border-line-strong px-3.5 py-2 text-[13.5px] font-semibold text-ink-soft hover:bg-paper-2 hover:text-ink"
      >
        Sair
      </button>
    </form>
  );
}
