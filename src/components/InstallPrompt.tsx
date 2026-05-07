"use client";

import React, { useEffect, useState } from "react";
import { Button, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GetAppIcon from "@mui/icons-material/GetApp";
import styled, { keyframes } from "styled-components";
import { colors } from "@/lib/theme";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if previously dismissed this session
    if (sessionStorage.getItem("pwa-prompt-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after a short delay so users have time to see the app
      setTimeout(() => setVisible(true), 3500);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-prompt-dismissed", "1");
  };

  if (!visible || dismissed) return null;

  return (
    <PromptBanner role="dialog" aria-label="Install School Wheelz app">
      <IconWrap>
        <GetAppIcon sx={{ fontSize: 24, color: colors.skyBlue }} />
      </IconWrap>
      <TextBlock>
        <Typography variant="body1" sx={{ fontWeight: 700, color: colors.deepNavy, lineHeight: 1.2 }}>
          Add to Home Screen
        </Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, fontSize: "0.8rem" }}>
          Install School Wheelz for quick, offline-ready access.
        </Typography>
      </TextBlock>
      <Button
        variant="contained"
        size="small"
        onClick={handleInstall}
        sx={{ borderRadius: "50px", whiteSpace: "nowrap", flexShrink: 0, fontSize: "0.8rem" }}
      >
        Install
      </Button>
      <IconButton size="small" onClick={handleDismiss} aria-label="Dismiss install prompt">
        <CloseIcon sx={{ fontSize: 18, color: colors.mutedText }} />
      </IconButton>
    </PromptBanner>
  );
}

const slideUp = keyframes`
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
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
