"use client";

import React, { useEffect, useState } from "react";
import { Button, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GetAppIcon from "@mui/icons-material/GetApp";
import IosShareIcon from "@mui/icons-material/IosShare";
import styled, { keyframes } from "styled-components";
import { colors } from "@/lib/theme";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isIos = () =>
  typeof navigator !== "undefined" &&
  /iphone|ipad|ipod/i.test(navigator.userAgent);

const isInStandaloneMode = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true));

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (sessionStorage.getItem("pwa-prompt-dismissed")) return;

    const onIos = isIos();
    setIos(onIos);

    if (onIos) {
      setTimeout(() => setVisible(true), 3500);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 3500);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // DEV fallback: show prompt after 4s even without service worker
    let devTimer: ReturnType<typeof setTimeout> | null = null;
    if (process.env.NODE_ENV === "development") {
      devTimer = setTimeout(() => setVisible(true), 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      if (devTimer) clearTimeout(devTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem("pwa-prompt-dismissed", "1");
  };

  if (!visible) return null;

  return (
    <PromptBanner role="dialog" aria-label="Install School Wheelz app">
      <IconWrap>
        {ios ? (
          <IosShareIcon sx={{ fontSize: 22, color: colors.skyBlue }} />
        ) : (
          <GetAppIcon sx={{ fontSize: 24, color: colors.skyBlue }} />
        )}
      </IconWrap>
      <TextBlock>
        <Typography variant="body1" sx={{ fontWeight: 700, color: colors.deepNavy, lineHeight: 1.2 }}>
          {ios ? "Add to Home Screen" : "Install School Wheelz"}
        </Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, fontSize: "0.8rem", mt: 0.3 }}>
          {ios
            ? 'Tap the Share button below, then "Add to Home Screen".'
            : "Install for quick, offline-ready access — no App Store needed."}
        </Typography>
      </TextBlock>
      {!ios && (
        <Button
          variant="contained"
          size="small"
          onClick={handleInstall}
          sx={{ borderRadius: "50px", whiteSpace: "nowrap", flexShrink: 0, fontSize: "0.8rem" }}
        >
          Install
        </Button>
      )}
      <IconButton size="small" onClick={handleDismiss} aria-label="Dismiss">
        <CloseIcon sx={{ fontSize: 18, color: colors.mutedText }} />
      </IconButton>
    </PromptBanner>
  );
}

const slideUp = keyframes`
  from { transform: translateX(-50%) translateY(120%); opacity: 0; }
  to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
`;

const PromptBanner = styled.div`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(26, 54, 93, 0.18);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  max-width: 420px;
  width: calc(100vw - 48px);
  animation: ${slideUp} 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

const IconWrap = styled.div`
  width: 44px;
  height: 44px;
  background: ${colors.deepNavy};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const TextBlock = styled.div`
  flex: 1;
  min-width: 0;
`;
