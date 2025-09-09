import React, { useState } from "react";
import { Button, FormControlLabel, Checkbox, TextField } from "@mui/material";
import axios from "axios";
import toast from "react-hot-toast";

interface Child {
    _id: string;
    name: string;
    age: number;
    school: string;
    gender: string;
}

interface BookingFormProps {
    parent: {
        _id: string;
        fullName: string;
        children?: Child[];
    };
    driverId: string;
}

const BookingForm: React.FC<BookingFormProps> = ({ parent, driverId }) => {
    const [selectedChildren, setSelectedChildren] = useState<Child[]>([]);
    const [tripDate, setTripDate] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const toggleChild = (child: Child) => {
        setSelectedChildren((prev) =>
            prev.find((c) => c._id === child._id)
                ? prev.filter((c) => c._id !== child._id)
                : [...prev, child]
        );
    };

    const handleSubmit = async () => {
        if (!selectedChildren.length) {
            toast.error("Please select at least one child");
            return;
        }
        setLoading(true);
        try {
            await axios.post(
                "/api/bookings",
                {
                    driverId,
                    children: selectedChildren,
                    seatsBooked: selectedChildren.length,
                    tripDate,
                },
                {
                    withCredentials: true,
                }
            );
            toast.success("Booking request sent! Pending driver approval.");
            setSelectedChildren([]);
            setTripDate("");
        } catch (err) {
            console.error(err);
            toast.error("Failed to book.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h4>Choose children for pick-up:</h4>
            {parent.children?.length ? (
                parent.children.map((child, idx) => (
                    <FormControlLabel
                        key={idx}
                        control={
                            <Checkbox
                                checked={!!selectedChildren.find((c) => c._id === child._id)}
                                onChange={() => toggleChild(child)}
                            />
                        }
                        label={`${child.name} (${child.age} Years old - ${child.gender})`}
                    />
                ))
            ) : (
                <p>No children registered under your profile.</p>
            )}

            <TextField
                label="Trip Date"
                type="date"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                style={{ margin: "16px 0" }}
            />

            <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={!selectedChildren.length || !tripDate || loading}
            >
                {loading ? "Submitting..." : "Confirm Booking"}
            </Button>
        </div>
    );
};

export default BookingForm;
