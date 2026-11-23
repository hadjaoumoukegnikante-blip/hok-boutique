import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Autorise le test en mode dev depuis un téléphone du réseau local (ex. http://172.20.10.2:3000).
  // Sans cela, Next.js bloque les scripts : la page s'affiche mais aucun bouton ne réagit.
  allowedDevOrigins: ["172.20.10.*", "192.168.*.*", "10.*.*.*", "192.0.2.*", "*.local"],
};

export default nextConfig;
