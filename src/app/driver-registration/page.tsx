"use client";

import React, { useState } from "react";
import styled from "styled-components";
import {
  TextField,
  Button,
  MenuItem,
  Typography,
  Box,
  Paper,
  IconButton,
  InputAdornment,
  Collapse,
  Alert,
  Card,
  CardContent,
} from "@mui/material";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { colors } from "@/lib/theme";
import PhoneInput from "@/components/PhoneInput";

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
    password: "",
    confirmPassword: "",
  });

  const [car, setCar] = useState({
    make: "",
    model: "",
    regNumber: "",
    photo: "",
    availableSeats: "",
  });

  const [showCarSection, setShowCarSection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [phoneError, setPhoneError] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    if (name === "password" || name === "confirmPassword") {
      const pw = name === "password" ? value : updated.password;
      const cpw = name === "confirmPassword" ? value : updated.confirmPassword;
      setPasswordMismatch(cpw.length > 0 && pw !== cpw);
    }
  };

  const handleCarChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCar((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (value: string) => {
    setFormData((prev) => ({ ...prev, phoneNumber: value }));
    setPhoneError(value.replace(/\D/g, "").length < 7);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    if (formData.phoneNumber.replace(/\D/g, "").length < 7) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    const payload: Record<string, any> = {
      fullName: formData.fullName,
      dob: formData.dob,
      licenseNumber: formData.licenseNumber,
      idNumber: formData.idNumber,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      photo: formData.photo,
      sex: formData.sex,
      password: formData.password,
      userType: "driver",
    };

    if (showCarSection && car.make && car.model && car.regNumber && car.availableSeats) {
      payload.cars = [
        {
          make: car.make,
          model: car.model,
          regNumber: car.regNumber,
          photo: car.photo || undefined,
          availableSeats: Number(car.availableSeats),
          isActive: true,
        },
      ];
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/drivers-registration", payload);
      if (response.status === 201) {
        toast.success("Welcome to School Wheelz! Your application is under review.");
        router.push("/profile");
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
            <PhoneInput
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={handlePhoneChange}
              required
              error={phoneError}
              helperText={phoneError ? "Enter a valid phone number" : undefined}
            />
          </Grid2>
          <Grid2>
            <TextField label="Profile Photo URL" name="photo" value={formData.photo} onChange={handleChange} fullWidth />
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

          {/* Optional vehicle section */}
          <ToggleCard
            onClick={() => setShowCarSection((v) => !v)}
            role="button"
            aria-expanded={showCarSection}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <DirectionsCarIcon sx={{ color: colors.skyBlue }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.deepNavy }}>
                  Add Vehicle Details
                  <OptionalBadge>optional</OptionalBadge>
                </Typography>
                <Typography variant="caption" sx={{ color: colors.mutedText }}>
                  {showCarSection ? "Collapse section" : "You can add your vehicle now or later from your profile"}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" sx={{ color: colors.skyBlue, pointerEvents: "none" }}>
              {showCarSection ? <RemoveCircleOutlineIcon /> : <AddCircleOutlineIcon />}
            </IconButton>
          </ToggleCard>

          <Collapse in={showCarSection} unmountOnExit>
            <CarCard variant="outlined">
              <CardContent sx={{ pb: "16px !important" }}>
                <Grid2>
                  <TextField label="Car Make" name="make" value={car.make} onChange={handleCarChange} fullWidth placeholder="e.g. Toyota" />
                  <TextField label="Car Model" name="model" value={car.model} onChange={handleCarChange} fullWidth placeholder="e.g. Probox" />
                </Grid2>
                <Grid2>
                  <TextField label="Registration Number" name="regNumber" value={car.regNumber} onChange={handleCarChange} fullWidth placeholder="e.g. KDA 123A" />
                  <TextField
                    label="Available Seats"
                    name="availableSeats"
                    type="number"
                    value={car.availableSeats}
                    onChange={handleCarChange}
                    fullWidth
                    inputProps={{ min: 1, max: 20 }}
                  />
                </Grid2>
                <TextField
                  label="Car Photo URL"
                  name="photo"
                  value={car.photo}
                  onChange={handleCarChange}
                  fullWidth
                  sx={{ mb: 0 }}
                  placeholder="https://..."
                />
              </CardContent>
            </CarCard>
          </Collapse>

          <SectionLabel>Account Security</SectionLabel>
          <Grid2>
            <TextField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                      {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              fullWidth
              required
              autoComplete="new-password"
              error={passwordMismatch}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end" size="small">
                      {showConfirm ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid2>
          <Collapse in={passwordMismatch}>
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>Passwords do not match.</Alert>
          </Collapse>

          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading || passwordMismatch} sx={{ mt: 2 }}>
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

/* ─── Styled components ─── */

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

const ToggleCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border: 1.5px dashed ${colors.border};
  border-radius: 12px;
  cursor: pointer;
  margin: 20px 0 0;
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    border-color: ${colors.skyBlue};
    background: rgba(66, 153, 225, 0.04);
  }
`;

const OptionalBadge = styled.span`
  font-size: 0.65rem;
  font-weight: 600;
  color: ${colors.mutedText};
  background: ${colors.border};
  border-radius: 4px;
  padding: 1px 6px;
  margin-left: 8px;
  text-transform: lowercase;
`;

const CarCard = styled(Card)`
  && {
    margin-top: 12px;
    border-radius: 12px;
    border-color: ${colors.border};
    background: ${colors.lightBg};
    margin-bottom: 8px;
  }
`;
