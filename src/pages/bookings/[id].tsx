import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { Typography, Paper, List, ListItem, ListItemText, CircularProgress } from "@mui/material";
import styled from "styled-components";
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
}

const BookingDetail: React.FC = () => {
    const router = useRouter();
    const { id } = router.query;
    const [booking, setBooking] = useState<IBooking | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchBooking = async () => {
            try {
                const res = await axios.get(`/api/bookings?id=${id}`, { withCredentials: true });
                if (res.data.success) setBooking(res.data.data);
            } catch (error) {
                console.error(error);
                toast.error("Failed to fetch booking details.");
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [id]);

    if (loading) return <CircularProgress />;

    if (!booking) return <Typography>Booking not found.</Typography>;

    return (
        <PageContainer>
            <Typography variant="h4" gutterBottom>
                Booking Details
            </Typography>
            <DetailPaper>
                <Typography variant="h6">Driver: {booking.driver?.fullName}</Typography>
                <Typography variant="h6">Parent: {booking.parent?.fullName}</Typography>
                <Typography variant="h6">Trip Date: {new Date(booking.tripDate).toLocaleDateString()}</Typography>
                <Typography variant="h6">Seats Booked: {booking.seatsBooked}</Typography>
                <Typography variant="h6">Status: {booking.status}</Typography>
                <Typography variant="h6">Children:</Typography>
                <List>
                    {booking.children.map((c, i) => (
                        <ListItem key={i}>
                            <ListItemText primary={`${c.name} | ${c.age} yrs | ${c.gender} | School: ${c.school}`} />
                        </ListItem>
                    ))}
                </List>
            </DetailPaper>
        </PageContainer>
    );
};

const PageContainer = styled.div`
  width: 80%;
  margin: 20px auto;
`;

const DetailPaper = styled(Paper)`
  padding: 16px;
`;

export default BookingDetail;
