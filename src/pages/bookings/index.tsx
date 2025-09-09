import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";
import { useRouter } from "next/router";
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
    bookingId: string;
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

            <TableContainer component={Paper}>
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
                        {bookings.map((b) => (
                            <TableRow
                                key={b._id}
                                style={{ backgroundColor: b.isDeleted ? "#f8d7da" : "inherit" }}
                            >
                                <TableCell>{b.bookingId}</TableCell>
                                <TableCell>{b.driver?.fullName || "Driver"}</TableCell>
                                <TableCell>{b.parent?.fullName || "Parent"}</TableCell>
                                <TableCell>{b.seatsBooked}</TableCell>
                                <TableCell>
                                    {new Date(b.tripDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{b.status}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleViewDetails(b._id)}
                                    >
                                        View
                                    </Button>
                                    {user?.userType === "parent" && !b.isDeleted && (
                                        <Button
                                            variant="outlined"
                                            color="secondary"
                                            onClick={() => handleCancelBooking(b._id)}
                                            style={{ marginLeft: "8px" }}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </PageContainer>
    );
};

const PageContainer = styled.div`
  width: 90%;
  margin: 20px auto;
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
