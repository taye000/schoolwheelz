"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { AppLogoIcon } from "@/components/AppLogo";
import { colors } from "@/lib/theme";

/**
 * PWA launch page — set as start_url in manifest.
 *
 * Checks auth and routes to the right destination:
 *   • not authenticated  → /login
 *   • parent             → /drivers   (find a driver)
 *   • driver             → /profile
 *   • admin              → /admin
 */
export default function AppLaunchPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) { router.replace("/login"); return; }
        const t = data.user?.userType;
        if (t === "parent") router.replace("/drivers");
        else if (t === "driver") router.replace("/profile");
        else if (t === "admin") router.replace("/admin");
        else router.replace("/login");
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  return (
    <Splash>
      <Inner>
        <AppLogoIcon size={96} />
        <AppName>School Wheelz</AppName>
        <Tagline>Safe rides for every child.</Tagline>
        <Dots>
          <Dot delay="0s" />
          <Dot delay="0.2s" />
          <Dot delay="0.4s" />
        </Dots>
      </Inner>
    </Splash>
  );
}

const Splash = styled.div`
  min-height: 100svh;
  background: ${colors.deepNavy};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Inner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const AppName = styled.h1`
  color: #fff;
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
`;

const Tagline = styled.p`
  color: ${colors.mintCream};
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0;
  opacity: 0.85;
`;

const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
  40%            { transform: scale(1); opacity: 1; }
`;

const Dots = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const Dot = styled.span<{ delay: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${colors.mintCream};
  animation: ${bounce} 1.4s infinite ease-in-out;
  animation-delay: ${(p) => p.delay};
`;
