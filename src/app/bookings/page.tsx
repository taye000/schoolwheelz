"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/navigation";
import { Typography, Button, CircularProgress, Chip, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import RouteIcon from "@mui/icons-material/Route";
import toast from "react-hot-toast";
import { colors } from "@/lib/theme";

interface IChild {
  name: string;
  age: number;
  school: string;
  gender: string;
}

interface IBooking {
  _id: string;
  bookingId: string;
  driver: { fullName: string } | null;
  parent: { fullName: string } | null;
  children: IChild[];
  seatsBooked: number;
  tripDate: string;
  status: string;
  isDeleted?: boolean;
}

const STATUS_META: Record<string, { bg: string; color: string; label: string }> = {
  pending:     { bg: "#FFF8E1", color: "#B45309",  label: "Pending" },
  accepted:    { bg: "#ECFDF5", color: "#065F46",  label: "Accepted" },
  canceled:    { bg: "#FEF2F2", color: "#991B1B",  label: "Cancelled" },
  completed:   { bg: "#EFF6FF", color: "#1D4ED8",  label: "Completed" },
  in_progress: { bg: "#F0FDF4", color: "#15803D",  label: "In Progress" },
  rejected:    { bg: "#FEF2F2", color: "#991B1B",  label: "Rejected" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const isThisYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-KE", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(isThisYear ? {} : { year: "numeric" }),
  });
}

const greetDriver = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const [user, setUser] = useState<{ _id: string; userType: string; fullName?: string } | null>(null);

  useEffect(() => {
    axios
      .get("/api/auth/me", { withCredentials: true })
      .then((res) => { if (res.data.success) setUser(res.data.user); })
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    setError(false);
    axios
      .get("/api/bookings", { withCredentials: true })
      .then((res) => { if (res.data.success) setBookings(res.data.data); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [fetchKey]);

  const handleCancel = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Cancel this booking?")) return;
    try {
      const res = await axios.delete(`/api/bookings?bookingId=${id}`, { withCredentials: true });
      if (res.data.success) {
        toast.success("Booking cancelled.");
        setBookings((prev) =>
          prev.map((b) => b._id === id ? { ...b, status: "canceled", isDeleted: true } : b)
        );
      }
    } catch {
      toast.error("Failed to cancel booking.");
    }
  };

  const isDriver = user?.userType === "driver";
  const isParent = user?.userType === "parent";
  const acceptedCount  = bookings.filter((b) => b.status === "accepted").length;
  const pendingCount   = bookings.filter((b) => b.status === "pending").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

  if (loading)
    return (
      <Center>
        <CircularProgress sx={{ color: colors.deepNavy }} />
        <LoadingText>Fetching your bookings…</LoadingText>
      </Center>
    );

  if (error)
    return (
      <Center>
        <EmptyEmoji>🚧</EmptyEmoji>
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.deepNavy }}>Oops, hit a bump</Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, mb: 2 }}>Couldn&apos;t load your bookings. Check your connection.</Typography>
        <Button variant="contained" onClick={() => setFetchKey((k) => k + 1)}>Try Again</Button>
      </Center>
    );

  if (!bookings.length)
    return (
      <Center>
        <EmptyEmoji>{isDriver ? "🚌" : "📋"}</EmptyEmoji>
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.deepNavy }}>No bookings yet</Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, mb: 3, maxWidth: 340 }}>
          {isDriver
            ? "Booking requests from parents will appear here. Keep your profile updated to attract more families!"
            : "Your schedule is wide open — find a driver and get those school runs sorted!"}
        </Typography>
        {isParent && <Button variant="contained" onClick={() => router.push("/drivers")}>Browse Drivers</Button>}
        {isDriver && <Button variant="contained" onClick={() => router.push("/profile")}>Update My Profile</Button>}
      </Center>
    );

  return (
    <PageWrapper>
      {isDriver ? (
        <DriverHero>
          <HeroLeft>
            <Greeting>{greetDriver()}, {user?.fullName?.split(" ")[0] ?? "Driver"} 👋</Greeting>
            <HeroTitle>My Bookings</HeroTitle>
            <HeroSub>Every trip you take puts a child safely in school. Keep up the great work.</HeroSub>
            <StatRow>
              <StatPill pending><HourglassEmptyIcon sx={{ fontSize: 13 }} />{pendingCount} pending</StatPill>
              <StatPill accepted><CheckCircleOutlineIcon sx={{ fontSize: 13 }} />{acceptedCount} accepted</StatPill>
              <StatPill completed><RouteIcon sx={{ fontSize: 13 }} />{completedCount} completed</StatPill>
            </StatRow>
          </HeroLeft>
          <Tooltip title="Manage today's active trips" placement="left">
            <HeroAction onClick={() => router.push("/trips")}>
              Today&apos;s Trips <ArrowForwardIcon sx={{ fontSize: 15 }} />
            </HeroAction>
          </Tooltip>
        </DriverHero>
      ) : (
        <PageHeader>
          <div>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.deepNavy, mb: 0.5 }}>My Bookings</Typography>
            <Typography variant="body2" sx={{ color: colors.mutedText }}>
              {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
            </Typography>
          </div>
          {isParent && (
            <Tooltip title="Browse available drivers and request a trip" placement="left">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => router.push("/drivers")}
                sx={{ borderRadius: "50px", fontWeight: 700, px: 3, height: 42, textTransform: "none", boxShadow: "none", whiteSpace: "nowrap" }}
              >
                Book a Driver
              </Button>
            </Tooltip>
          )}
        </PageHeader>
      )}

      <BookingList>
        {bookings.map((b, i) => {
          const meta = STATUS_META[b.status] ?? { bg: colors.lightBg, color: colors.mutedText, label: b.status };
          const schools = Array.from(new Set(b.children.map((c) => c.school).filter(Boolean)));
          const primaryName = isDriver
            ? (b.parent?.fullName ?? "Unknown Parent")
            : (b.driver?.fullName ?? null);

          return (
            <BookingCard
              key={b._id}
              faded={!!b.isDeleted}
              index={i}
              onClick={() => router.push(`/bookings/${b._id}`)}
            >
              <CardTop>
                <PersonBlock>
                  <PersonAvatar>
                    {isDriver
                      ? <PersonIcon sx={{ fontSize: 15, color: colors.skyBlue }} />
                      : <DirectionsCarIcon sx={{ fontSize: 15, color: colors.skyBlue }} />
                    }
                  </PersonAvatar>
                  <PersonName>
                    {primaryName ?? <em style={{ color: colors.mutedText, fontStyle: "italic" }}>No driver assigned</em>}
                  </PersonName>
                </PersonBlock>
                <Chip
                  label={meta.label}
                  size="small"
                  sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700, fontSize: "0.71rem", border: "none", flexShrink: 0 }}
                />
              </CardTop>

              <CardMeta>
                <MetaItem>
                  <CalendarTodayIcon sx={{ fontSize: 12, color: colors.mutedText }} />
                  <span>{formatDate(b.tripDate)}</span>
                </MetaItem>
                <Dot />
                <MetaItem>
                  <EventSeatIcon sx={{ fontSize: 12, color: colors.mutedText }} />
                  <span>{b.seatsBooked} seat{b.seatsBooked !== 1 ? "s" : ""}</span>
                </MetaItem>
                {schools.length > 0 && (
                  <>
                    <Dot />
                    <MetaItem><span>{schools.join(", ")}</span></MetaItem>
                  </>
                )}
              </CardMeta>

              <CardBottom>
                <BookingRef>{b.bookingId}</BookingRef>
                {isParent && !b.isDeleted && b.status === "pending" && (
                  <CancelBtn onClick={(e) => handleCancel(e, b._id)}>Cancel</CancelBtn>
                )}
              </CardBottom>
            </BookingCard>
          );
        })}
      </BookingList>
    </PageWrapper>
  );
}

/* ── Animations ── */
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── Styles ── */
const PageWrapper = styled.div`
  max-width: 660px;
  margin: 0 auto;
  padding: 32px 16px;
  @media (min-width: 640px) { padding: 40px 24px; }
`;

const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
`;

const DriverHero = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  background: linear-gradient(135deg, ${colors.deepNavy} 0%, #2c508a 100%);
  border-radius: 20px;
  padding: 28px 24px;
  margin-bottom: 28px;
  animation: ${fadeUp} 0.4s ease both;
`;

const HeroLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
`;

const Greeting = styled.div`
  font-size: 0.82rem;
  color: rgba(255,255,255,0.65);
  font-weight: 500;
`;

const HeroTitle = styled.h1`
  margin: 0;
  font-size: 1.55rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.4px;
`;

const HeroSub = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: rgba(255,255,255,0.55);
  max-width: 300px;
  line-height: 1.45;
`;

const StatRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 10px;
`;

const StatPill = styled.div<{ pending?: boolean; accepted?: boolean; completed?: boolean }>`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 50px;
  background: ${(p) =>
    p.accepted ? "rgba(154,230,180,0.15)" :
    p.completed ? "rgba(255,255,255,0.08)" :
                  "rgba(255,255,255,0.12)"};
  color: ${(p) =>
    p.accepted ? "#9AE6B4" :
    p.completed ? "rgba(255,255,255,0.5)" :
                  "rgba(255,255,255,0.8)"};
`;

const HeroAction = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.13);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: 50px;
  padding: 9px 18px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  align-self: flex-start;
  transition: background 0.15s, transform 0.15s;
  &:hover { background: rgba(255,255,255,0.22); transform: translateY(-1px); }
`;

const BookingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const BookingCard = styled.div<{ faded?: boolean; index: number }>`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 16px;
  padding: 15px 18px;
  cursor: pointer;
  opacity: ${(p) => (p.faded ? 0.5 : 1)};
  animation: ${fadeUp} 0.35s ease both;
  animation-delay: ${(p) => Math.min(p.index * 0.04, 0.3)}s;
  transition: box-shadow 0.18s, border-color 0.18s, transform 0.18s;

  &:hover {
    box-shadow: 0 6px 24px rgba(26,54,93,0.1);
    border-color: ${colors.skyBlue}55;
    transform: translateY(-2px);
  }
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(26,54,93,0.07);
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 9px;
`;

const PersonBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const PersonAvatar = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(66,153,225,0.09);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const PersonName = styled.span`
  font-weight: 700;
  font-size: 0.92rem;
  color: ${colors.deepNavy};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 9px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  color: ${colors.mutedText};
`;

const Dot = styled.span`
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: ${colors.border};
  flex-shrink: 0;
`;

const CardBottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const BookingRef = styled.div`
  font-family: monospace;
  font-size: 0.69rem;
  color: ${colors.mutedText};
  opacity: 0.6;
`;

const CancelBtn = styled.button`
  font-size: 0.73rem;
  font-weight: 600;
  color: ${colors.errorRed};
  background: transparent;
  border: 1px solid ${colors.errorRed}44;
  border-radius: 50px;
  padding: 3px 11px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: ${colors.errorRed}10; }
`;

const Center = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  text-align: center;
  gap: 8px;
`;

const LoadingText = styled.p`
  font-size: 0.9rem;
  color: ${colors.mutedText};
  font-style: italic;
  margin-top: 8px;
`;

const EmptyEmoji = styled.div`
  font-size: 3.5rem;
  margin-bottom: 8px;
`;
