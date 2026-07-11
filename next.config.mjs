/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "fal.media" },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules[\\/]onnxruntime-web/,
      type: "javascript/esm",
      resolve: { fullySpecified: false },
    });
    return config;
  },
};

export default nextConfig;
