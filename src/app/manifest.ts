import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "School Wheelz",
    short_name: "SchoolWheelz",
    description:
      "Safe, reliable, and trackable school transportation for parents and drivers.",
    start_url: "/app-launch",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1A365D",
    theme_color: "#1A365D",
    categories: ["transportation", "education"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [],
  };
}
