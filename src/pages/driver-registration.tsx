import React, { useState } from "react";
import styled from "styled-components";
import { TextField, Button, MenuItem } from "@mui/material";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from 'next/router';

const DriverRegistration: React.FC = () => {
    const router = useRouter();

    const [formData, setFormData] = useState({
        fullName: "",
        dob: "",
        licenseNumber: "",
        idNumber: "",
        email: "",
        phoneNumber: "",
        photo: "",
        sex: "",
        carMake: "",
        carModel: "",
        carRegNumber: "",
        carPhoto: "",
        availableSeats: "",
        password: "",
        confirmPassword: "",
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }
        try {
            const response = await axios.post("/api/drivers-registration", {
                ...formData,
                availableSeats: Number(formData.availableSeats),
            });
            if (response.status === 201) {
                toast.success("Driver registered successfully!");
                setFormData({
                    fullName: "",
                    dob: "",
                    licenseNumber: "",
                    idNumber: "",
                    email: "",
                    phoneNumber: "",
                    photo: "",
                    sex: "",
                    carMake: "",
                    carModel: "",
                    carRegNumber: "",
                    carPhoto: "",
                    availableSeats: "",
                    password: "",
                    confirmPassword: "",
                });
                router.push('/login')
            }
        } catch (error) {
            console.error("Error registering driver:", error);
            toast.error("Failed to register driver. Please try again.");
        }
    };

    return (
        <PageContainer>
            <FormContainer onSubmit={handleSubmit}>
                <h1>Driver Registration</h1>
                <FormRow>
                    <TextField
                        label="Full Name"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                    />
                    <TextField
                        label="Date of Birth"
                        name="dob"
                        type="date"
                        value={formData.dob}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                        InputLabelProps={{ shrink: true }}
                    />
                </FormRow>
                <FormRow>
                    <TextField
                        label="License Number"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                    />
                    <TextField
                        label="ID Number"
                        name="idNumber"
                        value={formData.idNumber}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                    />
                </FormRow>
                <FormRow>
                    <TextField
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                    />
                    <TextField
                        label="Phone Number"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                    />
                </FormRow>
                <FormRow>
                    <TextField
                        label="Photo URL"
                        name="photo"
                        value={formData.photo}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                    />
                    <TextField
                        label="Sex"
                        name="sex"
                        value={formData.sex}
                        onChange={handleChange}
                        select
                        fullWidth
                        margin="normal"
                        required
                    >
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                    </TextField>
                </FormRow>
                <FormRow>
                    <TextField
                        label="Car Make"
                        name="carMake"
                        value={formData.carMake}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                    />
                    <TextField
                        label="Car Model"
                        name="carModel"
                        value={formData.carModel}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                    />
                </FormRow>
                <FormRow>
                    <TextField
                        label="Car Registration Number"
                        name="carRegNumber"
                        value={formData.carRegNumber}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                    />
                    <TextField
                        label="Car Photo URL"
                        name="carPhoto"
                        value={formData.carPhoto}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                    />
                </FormRow>
                <FormRow>
                    <TextField
                        label="Available Seats"
                        name="availableSeats"
                        type="number"
                        value={formData.availableSeats}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                        inputProps={{ min: 1 }}
                    />
                </FormRow>
                <FormRow>
                    <TextField
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                    />
                    <TextField
                        label="Confirm Password"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                    />
                </FormRow>
                <Button type="submit" variant="contained" color="primary" fullWidth>
                    Submit
                </Button>
            </FormContainer>
        </PageContainer>
    );
};

const PageContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 16px;
  justify-content: space-between;
`;

export default DriverRegistration;
