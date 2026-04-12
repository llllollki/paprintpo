import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage — public product images
      // Add your project URL here once Supabase is set up:
      // { protocol: "https", hostname: "<project>.supabase.co" }
    ],
  },
};

export default nextConfig;
