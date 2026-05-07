"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import {
  Typography,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";
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

const statusColors: Record<string, { bg: string; color: string }> = {
  pending:  { bg: "#FFF3CD", color: "#856404" },
  accepted: { bg: "#D4EDDA", color: "#155724" },
  canceled: { bg: "#F8D7DA", color: "#721C24" },
};

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
      const res = await axios.delete(`/api/bookings?bookingId=${id}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        toast.success("Booking cancelled.");
        setBookings((prev) =>
          prev.map((b) =>
            b._id === id ? { ...b, status: "canceled", isDeleted: true } : b
          )
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
        <LoadingText>Digging through your bookings…</LoadingText>
      </Center>
    );

  if (error)
    return (
      <Center>
        <EmptyEmoji>🚧</EmptyEmoji>
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.deepNavy }}>
          Oops, hit a bump
        </Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, mb: 2 }}>
          Couldn’t load your bookings. Check your connection.
        </Typography>
        <Button variant="contained" onClick={() => setFetchKey((k) => k + 1)}>
          Try Again
        </Button>
      </Center>
    );

  if (!bookings.length)
    return (
      <Center>
        <EmptyEmoji>📋</EmptyEmoji>
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.deepNavy }}>
          No bookings yet
        </Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, mb: 3, maxWidth: 320 }}>
          Your schedule is wide open — time to find a driver and get those school runs sorted!
        </Typography>
        <Button variant="contained" onClick={() => router.push("/drivers")}>
          Browse Drivers
        </Button>
      </Center>
    );

  return (
    <PageWrapper>
      <Typography variant="h4" sx={{ fontWeight: 700, color: colors.deepNavy, mb: 0.5 }}>
        My Bookings
      </Typography>
      <Typography variant="body2" sx={{ color: colors.mutedText, mb: 4 }}>
        {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
      </Typography>

      <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${colors.border}`, borderRadius: "16px", overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Booking ID</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell>Parent</TableCell>
              <TableCell>Seats</TableCell>
              <TableCell>Trip Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.map((b) => {
              const sc = statusColors[b.status] ?? { bg: colors.lightBg, color: colors.mutedText };
              return (
                <TableRow key={b._id} sx={{ opacity: b.isDeleted ? 0.55 : 1 }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem", color: colors.mutedText }}>
                    {b.bookingId}
                  </TableCell>
                  <TableCell>{b.driver?.fullName || "—"}</TableCell>
                  <TableCell>{b.parent?.fullName || "—"}</TableCell>
                  <TableCell>{b.seatsBooked}</TableCell>
                  <TableCell>{new Date(b.tripDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={b.status}
                      size="small"
                      sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, textTransform: "capitalize" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => router.push(`/bookings/${b._id}`)}
                      sx={{ mr: 1, borderRadius: "50px" }}
                    >
                      View
                    </Button>
                    {user?.userType === "parent" && !b.isDeleted && b.status === "pending" && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleCancel(b._id)}
                        sx={{ borderRadius: "50px" }}
                      >
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 24px;
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
