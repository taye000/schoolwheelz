import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "School Wheelz",
    short_name: "SchoolWheelz",
    description:
      "Safe, reliable, and trackable school transportation for parents and drivers.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7FAFC",
    theme_color: "#1A365D",
    categories: ["transportation", "education"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [],
  };
}
