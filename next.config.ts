import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Disable Turbopack — Tailwind CSS v3 tidak kompatibel dengan Turbopack
  // Turbopack tidak menyediakan Node.js polyfills (fs, module, perf_hooks, v8)
  // yang dibutuhkan oleh Tailwind CSS v3 internals.
  // Menggunakan webpack (default) sebagai bundler.
};

export default nextConfig;
