import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";
import { useRouter } from "next/router";
import {
  Paper,
  Typography,
  Button,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import toast from "react-hot-toast";

interface IChild {
  name: string;
  age: number;
  school: string;
  gender: string;
}

interface IBooking {
  _id: string;
  driver: { fullName: string } | null;
  parent: { fullName: string } | null;
  children: IChild[];
  seatsBooked: number;
  tripDate: string;
  status: string;
  isDeleted?: boolean;
}

const BookingsPage: React.FC = () => {
  const router = useRouter();
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ _id: string; userType: string } | null>(
    null
  );

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/auth/me", { withCredentials: true });
        if (res.data.success) setUser(res.data.user);
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get("/api/bookings", { withCredentials: true });
        if (res.data.success) {
          setBookings(res.data.data);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch bookings.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleCancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const res = await axios.delete(`/api/bookings?bookingId=${id}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        toast.success("Booking cancelled successfully!");
        setBookings(
          bookings.map((b) =>
            b._id === id ? { ...b, status: "canceled", isDeleted: true } : b
          )
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to cancel booking.");
    }
  };

  const handleViewDetails = (id: string) => {
    router.push(`/bookings/${id}`);
  };

  if (loading)
    return (
      <CenteredContainer>
        <CircularProgress />
      </CenteredContainer>
    );

  if (!bookings.length)
    return (
      <CenteredContainer>
        <Typography variant="h5" gutterBottom>
          Oops! No bookings yet.
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Looks like your wheels are still waiting for some action 🚗💨. Time to
          book a trip!
        </Typography>
        <Button
          variant="contained"
          color="primary"
          style={{ marginTop: "16px" }}
          onClick={() => router.push("/drivers")}
        >
          Book a Ride
        </Button>
      </CenteredContainer>
    );

  return (
    <PageContainer>
      <Typography variant="h4" gutterBottom>
        My Bookings
      </Typography>
      <ListContainer>
        {bookings.map((b) => (
          <StyledPaper key={b._id} canceled={b.isDeleted}>
            <ListItem>
              <ListItemText
                primary={`Trip with ${
                  b.driver?.fullName || "Driver"
                } on ${new Date(b.tripDate).toLocaleDateString()}`}
                secondary={`Seats booked: ${b.seatsBooked} | Status: ${b.status}`}
              />
              <Button
                variant="outlined"
                onClick={() => handleViewDetails(b._id)}
              >
                View Details
              </Button>
              {user?.userType === "parent" && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => handleCancelBooking(b._id)}
                  style={{ marginLeft: "8px" }}
                >
                  Cancel
                </Button>
              )}
            </ListItem>
          </StyledPaper>
        ))}
      </ListContainer>
    </PageContainer>
  );
};

const PageContainer = styled.div`
  width: 80%;
  margin: 20px auto;
`;

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StyledPaper = styled(Paper)<{ canceled?: boolean }>`
  padding: 16px;
  background-color: ${({ canceled }) => (canceled ? "#f8d7da" : "#fff")};
`;

const CenteredContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  text-align: center;
  gap: 8px;
`;

export default BookingsPage;
