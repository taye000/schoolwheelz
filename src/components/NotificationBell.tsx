"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Badge,
  IconButton,
  Popover,
  Typography,
  Box,
  Button,
  Divider,
  CircularProgress,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import CheckDoneIcon from "@mui/icons-material/DoneAll";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { colors } from "@/lib/theme";

interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

const POLL_INTERVAL_MS = 30_000;

// ── TYPE → accent color map ────────────────────────────────────────────────
function typeColor(type: string): string {
  if (type.startsWith("booking_accepted") || type === "school_approved" || type === "driver_validated")
    return colors.successGreen;
  if (type === "trip_completed" || type === "bill_paid")
    return colors.mintCream;
  if (type.includes("cancelled") || type === "school_rejected")
    return colors.errorRed;
  if (type === "booking_new" || type === "driver_arrived" || type === "trip_started")
    return colors.skyBlue;
  if (type === "bill_generated")
    return colors.warningAmber;
  return colors.mutedText;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const NotificationBell: React.FC = () => {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async (quiet = true) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // network error — ignore silently
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(false);
    intervalRef.current = setInterval(() => fetchNotifications(true), POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    // refresh when panel opens
    fetchNotifications(true);
  };
  const handleClose = () => setAnchorEl(null);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const markRead = async (notif: Notification) => {
    if (!notif.read) {
      try {
        await fetch(`/api/notifications/${notif._id}`, {
          method: "PATCH",
          credentials: "include",
        });
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch { /* ignore */ }
    }
    handleClose();
    if (notif.href) router.push(notif.href);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton onClick={handleOpen} size="small" sx={{ color: colors.pureWhite, position: "relative" }}>
        <Badge badgeContent={unreadCount} max={99} color="error" sx={{ "& .MuiBadge-badge": { fontSize: "0.65rem", minWidth: 16, height: 16 } }}>
          {unreadCount > 0
            ? <NotificationsIcon fontSize="small" />
            : <NotificationsNoneIcon fontSize="small" />
          }
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1,
            width: 340,
            maxWidth: "95vw",
            borderRadius: "14px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
            overflow: "hidden",
          },
        }}
      >
        {/* Header */}
        <PanelHeader>
          <Typography fontWeight={700} fontSize="0.95rem" color={colors.deepNavy}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={markAllRead}
              startIcon={<CheckDoneIcon fontSize="small" />}
              sx={{ fontSize: "0.72rem", color: colors.skyBlue, textTransform: "none", p: 0 }}
            >
              Mark all read
            </Button>
          )}
        </PanelHeader>
        <Divider />

        {/* Body */}
        <NotifList>
          {loading ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <EmptyState>
              <NotificationsNoneIcon sx={{ fontSize: 36, color: colors.border, mb: 1 }} />
              <Typography fontSize="0.82rem" color={colors.mutedText}>
                You&apos;re all caught up!
              </Typography>
            </EmptyState>
          ) : (
            notifications.map((notif) => (
              <NotifItem
                key={notif._id}
                $unread={!notif.read}
                onClick={() => markRead(notif)}
              >
                <Dot style={{ background: typeColor(notif.type) }} />
                <NotifContent>
                  <NotifTitle $unread={!notif.read}>{notif.title}</NotifTitle>
                  <NotifBody>{notif.body}</NotifBody>
                  <NotifTime>{timeAgo(notif.createdAt)}</NotifTime>
                </NotifContent>
              </NotifItem>
            ))
          )}
        </NotifList>
      </Popover>
    </>
  );
};

export default NotificationBell;

// ── Styled components ────────────────────────────────────────────────────────
const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
`;

const NotifList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
`;

const NotifItem = styled.div<{ $unread: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  background: ${({ $unread }) => ($unread ? "#F0F7FF" : "transparent")};
  border-bottom: 1px solid ${colors.border};
  transition: background 0.15s;
  &:last-child { border-bottom: none; }
  &:hover { background: ${colors.lightBg}; }
`;

const Dot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
`;

const NotifContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotifTitle = styled.div<{ $unread: boolean }>`
  font-size: 0.82rem;
  font-weight: ${({ $unread }) => ($unread ? 700 : 500)};
  color: ${colors.deepNavy};
  margin-bottom: 2px;
`;

const NotifBody = styled.div`
  font-size: 0.78rem;
  color: ${colors.slateCharcoal};
  line-height: 1.4;
  margin-bottom: 3px;
  white-space: pre-wrap;
  word-break: break-word;
`;

const NotifTime = styled.div`
  font-size: 0.72rem;
  color: ${colors.mutedText};
`;
