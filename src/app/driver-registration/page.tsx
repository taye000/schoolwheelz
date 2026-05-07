"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { TextField, Button, MenuItem, Typography, Box, Paper } from "@mui/material";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import { colors } from "@/lib/theme";

export default function DriverRegistrationPage() {
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
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      const response = await axios.post("/api/drivers-registration", {
        ...formData,
        availableSeats: Number(formData.availableSeats),
      });
      if (response.status === 201) {
        toast.success("Application submitted! Please sign in.");
        router.push("/login");
      }
    } catch (error) {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <FormCard elevation={0}>
        <LogoWrap>
          <DirectionsCarIcon sx={{ fontSize: 36, color: colors.skyBlue }} />
        </LogoWrap>
        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.deepNavy, mb: 0.5 }}>
          Become a Driver
        </Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, mb: 4 }}>
          Fill in your details to join the School Wheelz driver network.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <SectionLabel>Personal Information</SectionLabel>
          <Grid2>
            <TextField label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} fullWidth required />
            <TextField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} fullWidth required InputLabelProps={{ shrink: true }} />
          </Grid2>
          <Grid2>
            <TextField label="License Number" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} fullWidth required />
            <TextField label="ID Number" name="idNumber" value={formData.idNumber} onChange={handleChange} fullWidth required />
          </Grid2>
          <Grid2>
            <TextField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} fullWidth required autoComplete="email" />
            <TextField label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} fullWidth required />
          </Grid2>
          <Grid2>
            <TextField label="Profile Photo URL" name="photo" value={formData.photo} onChange={handleChange} fullWidth required />
            <TextField
              select
              label="Sex"
              name="sex"
              value={formData.sex}
              onChange={handleChange}
              fullWidth
              required
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </TextField>
          </Grid2>

          <SectionLabel>Vehicle Details</SectionLabel>
          <Grid2>
            <TextField label="Car Make" name="carMake" value={formData.carMake} onChange={handleChange} fullWidth required />
            <TextField label="Car Model" name="carModel" value={formData.carModel} onChange={handleChange} fullWidth required />
          </Grid2>
          <Grid2>
            <TextField label="Registration Number" name="carRegNumber" value={formData.carRegNumber} onChange={handleChange} fullWidth required />
            <TextField label="Car Photo URL" name="carPhoto" value={formData.carPhoto} onChange={handleChange} fullWidth required />
          </Grid2>
          <TextField
            label="Available Seats"
            name="availableSeats"
            type="number"
            value={formData.availableSeats}
            onChange={handleChange}
            fullWidth
            required
            inputProps={{ min: 1, max: 10 }}
            sx={{ mb: 3 }}
          />

          <SectionLabel>Account Security</SectionLabel>
          <Grid2>
            <TextField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} fullWidth required autoComplete="new-password" />
            <TextField label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} fullWidth required autoComplete="new-password" />
          </Grid2>

          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ mt: 2 }}>
            {loading ? "Submitting…" : "Submit Application"}
          </Button>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2" sx={{ color: colors.mutedText }}>
              Already registered?{" "}
              <a href="/login" style={{ color: colors.skyBlue, fontWeight: 600 }}>Sign in</a>
            </Typography>
          </Box>
        </Box>
      </FormCard>
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  background: ${colors.lightBg};
  min-height: 100vh;
  padding: 48px 24px;
`;

const FormCard = styled(Paper)`
  && {
    max-width: 760px;
    margin: 0 auto;
    padding: 48px;
    border-radius: 20px;
    border: 1px solid ${colors.border};
    box-shadow: 0 20px 60px rgba(26, 54, 93, 0.08);

    @media (max-width: 600px) {
      padding: 24px;
    }
  }
`;

const LogoWrap = styled.div`
  width: 64px;
  height: 64px;
  background: ${colors.deepNavy};
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`;

const SectionLabel = styled.p`
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: ${colors.skyBlue};
  margin: 24px 0 16px;
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;
