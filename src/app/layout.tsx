import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Providers from "./providers";
import StyledComponentsRegistry from "@/lib/registry";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "School Wheelz",
    template: "%s | School Wheelz",
  },
  description:
    "Safe, reliable, and trackable school transportation for parents and drivers.",
  applicationName: "School Wheelz",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "School Wheelz",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#1A365D",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <StyledComponentsRegistry>
          <Providers>{children}</Providers>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
