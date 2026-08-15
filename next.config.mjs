/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Server Actions default to a 1MB body limit. Zone uploads (up to 3
      // files per request) are allowed up to 10MB each at the Supabase
      // Storage bucket level, so the combined request needs headroom above
      // that or uploads silently hang instead of erroring.
      bodySizeLimit: "35mb",
    },
    // La segmentación del servidor (/api/remove-bg) usa binarios nativos:
    // webpack no puede empaquetarlos, tiene que dejarlos como require() en
    // tiempo de ejecución.
    serverComponentsExternalPackages: [
      "@huggingface/transformers",
      "onnxruntime-node",
      "sharp",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "fal.media" },
    ],
  },
  webpack: (config, { isServer }) => {
    // Ojo: SOLO en el bundle del cliente. Antes esto se aplicaba también al
    // build del servidor, lo que dejaba a /api/remove-bg sin onnxruntime-node
    // ni sharp — es decir, sin forma de correr el modelo.
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "sharp$": false,
        "onnxruntime-node$": false,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
