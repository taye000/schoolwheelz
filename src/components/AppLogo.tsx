import React from "react";
import { colors } from "@/lib/theme";

interface Props {
  /** Overall size of the square icon in px */
  size?: number;
}

/**
 * School Wheelz app icon — navy rounded square + white bus SVG.
 * Use anywhere a logo mark is needed (Navbar, splash screen, etc.)
 */
export function AppLogoIcon({ size = 32 }: Props) {
  const r = Math.round(size * 0.1875); // corner radius = ~18.75% of size
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="School Wheelz"
      role="img"
      style={{ flexShrink: 0, display: "block" }}
    >
      <rect width="512" height="512" rx="96" fill={colors.deepNavy} />
      <rect x="96" y="400" width="320" height="24" rx="12" fill={colors.mintCream} opacity="0.85" />
      <g transform="translate(64,64) scale(16)" fill="white">
        <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5S15.67 14 16.5 14s1.5.67 1.5 1.5S17.33 17 16.5 17zM12 6H4V8.5h8V6zm8 0h-8V8.5h8V6zm-8 3.5H4V12h8V9.5zm8 0h-8V12h8V9.5z" />
      </g>
    </svg>
  );
}

/**
 * Full logo lockup — icon + wordmark side by side.
 */
export function AppLogoFull({ size = 32, light = false }: Props & { light?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.28) }}>
      <AppLogoIcon size={size} />
      <span
        style={{
          fontWeight: 800,
          fontSize: Math.round(size * 0.56),
          letterSpacing: "-0.02em",
          color: light ? "#fff" : colors.deepNavy,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        School Wheelz
      </span>
    </span>
  );
}
