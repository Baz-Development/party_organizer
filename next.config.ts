import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Habilita `forbidden()`, usado pelos layouts de `/organizacao` e `/admin`
    // para responder 403 a quem tem sessão mas não tem o papel necessário.
    // Sem isso a alternativa seria renderizar um aviso com status 200, que
    // mente sobre o resultado da requisição.
    authInterrupts: true,
  },
};

export default nextConfig;
