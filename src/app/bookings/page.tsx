"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import {
  Typography,
  Button,
  CircularProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventSeatIcon from "@mui/icons-material/EventSeat";
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
  pending:    { bg: "#FFF8E1", color: "#B45309", label: "Pending" },
  accepted:   { bg: "#ECFDF5", color: "#065F46", label: "Accepted" },
  canceled:   { bg: "#FEF2F2", color: "#991B1B", label: "Cancelled" },
  completed:  { bg: "#EFF6FF", color: "#1D4ED8", label: "Completed" },
  in_progress:{ bg: "#F0FDF4", color: "#15803D", label: "In Progress" },
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

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const [user, setUser] = useState<{ _id: string; userType: string } | null>(null);

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

  const handleCancel = async (id: string) => {
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
        <EmptyEmoji>📋</EmptyEmoji>
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.deepNavy }}>No bookings yet</Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, mb: 3, maxWidth: 320 }}>
          Your schedule is wide open — find a driver and get those school runs sorted!
        </Typography>
        <Button variant="contained" onClick={() => router.push("/drivers")}>Browse Drivers</Button>
      </Center>
    );

  return (
    <PageWrapper>
      <PageHeader>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.deepNavy, mb: 0.5 }}>
            My Bookings
          </Typography>
          <Typography variant="body2" sx={{ color: colors.mutedText }}>
            {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
          </Typography>
        </div>
        {user?.userType === "parent" && (
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

      <BookingList>
        {bookings.map((b) => {
          const meta = STATUS_META[b.status] ?? { bg: colors.lightBg, color: colors.mutedText, label: b.status };
          const schools = [...new Set(b.children.map((c) => c.school).filter(Boolean))];
          return (
            <BookingCard key={b._id} faded={!!b.isDeleted}>
              <CardTop>
                <DriverBlock>
                  <DriverIcon><DirectionsCarIcon sx={{ fontSize: 16, color: colors.skyBlue }} /></DriverIcon>
                  <DriverName>{b.driver?.fullName || <span style={{ color: colors.mutedText, fontStyle: "italic" }}>No driver assigned</span>}</DriverName>
                </DriverBlock>
                <Chip
                  label={meta.label}
                  size="small"
                  sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700, fontSize: "0.72rem", border: "none" }}
                />
              </CardTop>

              <CardMeta>
                <MetaItem>
                  <CalendarTodayIcon sx={{ fontSize: 13, color: colors.mutedText }} />
                  <span>{formatDate(b.tripDate)}</span>
                </MetaItem>
                <Dot />
                <MetaItem>
                  <EventSeatIcon sx={{ fontSize: 13, color: colors.mutedText }} />
                  <span>{b.seatsBooked} seat{b.seatsBooked !== 1 ? "s" : ""}</span>
                </MetaItem>
                {schools.length > 0 && (
                  <>
                    <Dot />
                    <MetaItem>
                      <span>{schools.join(", ")}</span>
                    </MetaItem>
                  </>
                )}
              </CardMeta>

              <BookingRef>{b.bookingId}</BookingRef>

              <CardActions>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => router.push(`/bookings/${b._id}`)}
                  sx={{ borderRadius: "50px", fontSize: "0.75rem", textTransform: "none" }}
                >
                  View Details
                </Button>
                {user?.userType === "parent" && !b.isDeleted && b.status === "pending" && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleCancel(b._id)}
                    sx={{ borderRadius: "50px", fontSize: "0.75rem", textTransform: "none" }}
                  >
                    Cancel
                  </Button>
                )}
              </CardActions>
            </BookingCard>
          );
        })}
      </BookingList>
    </PageWrapper>
  );
}

/* ── Styles ── */

const PageWrapper = styled.div`
  max-width: 860px;
  margin: 0 auto;
  padding: 40px 24px;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 32px;
`;

const BookingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const BookingCard = styled.div<{ faded?: boolean }>`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 16px;
  padding: 18px 20px;
  opacity: ${(p) => (p.faded ? 0.55 : 1)};
  transition: box-shadow 0.15s;

  &:hover {
    box-shadow: 0 4px 16px rgba(26, 54, 93, 0.08);
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
`;

const DriverBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const DriverIcon = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: ${colors.lightBg};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const DriverName = styled.span`
  font-weight: 700;
  font-size: 0.95rem;
  color: ${colors.deepNavy};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: ${colors.mutedText};
`;

const Dot = styled.span`
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: ${colors.border};
  flex-shrink: 0;
`;

const BookingRef = styled.div`
  font-family: monospace;
  font-size: 0.72rem;
  color: ${colors.mutedText};
  margin-bottom: 12px;
  opacity: 0.75;
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
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
  font-size: 0.925rem;
  color: ${colors.mutedText};
  font-style: italic;
  margin-top: 8px;
`;

const EmptyEmoji = styled.div`
  font-size: 3.5rem;
  margin-bottom: 8px;
`;

