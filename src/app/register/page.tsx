"use client";

import React, { useState } from "react";
import {
  TextField,
  Paper,
  FormControlLabel,
  Checkbox,
  Typography,
  Button,
  Box,
  IconButton,
} from "@mui/material";
import styled from "styled-components";
import dynamic from "next/dynamic";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { colors } from "@/lib/theme";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const MapContainer = styled.div`
  flex: 2;
  min-width: 300px;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  margin: 16px 0;
`;

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    parentLocation: "",
    children: [{ childName: "", school: "", location: "", gender: "", age: "" }],
    pickupLocation: { lat: 0, lng: 0 },
    dropoffLocation: { lat: 0, lng: 0 },
    recurring: false,
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleMapChange = (locations: {
    pickupLocation: { lat: number; lng: number };
    dropoffLocation: { lat: number; lng: number };
  }) => {
    setFormData({ ...formData, ...locations });
  };

  const handleChildChange = (index: number, field: string, value: string) => {
    const updatedChildren = formData.children.map((child, i) =>
      i === index ? { ...child, [field]: value } : child
    );
    setFormData({ ...formData, children: updatedChildren });
  };

  const handleAddChild = () => {
    setFormData({
      ...formData,
      children: [
        ...formData.children,
        { childName: "", school: "", location: "", gender: "", age: "" },
      ],
    });
  };

  const handleRemoveChild = (index: number) => {
    setFormData({
      ...formData,
      children: formData.children.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    const payload = {
      fullName: formData.parentName,
      email: formData.parentEmail,
      phoneNumber: formData.parentPhone,
      address: formData.parentLocation,
      password: formData.password,
      userType: "parent",
      children: formData.children.map((child) => ({
        name: child.childName,
        school: child.school,
        gender: child.gender,
        age: child.age,
      })),
    };
    try {
      const response = await axios.post("/api/parents-registration", payload);
      if (response.status === 201) {
        toast.success("Account created! Browse drivers to book your first ride.");
        router.push("/drivers");
      }
    } catch (error) {
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <PageWrapper>
      <FormCard elevation={0}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.deepNavy, mb: 0.5 }}>
          Register Your Family
        </Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, mb: 4 }}>
          Create an account to book school drop-offs for your children.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <SectionTitle>Parent Details</SectionTitle>
          <TwoCol>
            <TextField label="Full Name" name="parentName" value={formData.parentName} onChange={handleChange} fullWidth required />
            <TextField label="Phone Number" name="parentPhone" value={formData.parentPhone} onChange={handleChange} fullWidth required />
          </TwoCol>
          <TwoCol>
            <TextField label="Email" name="parentEmail" type="email" value={formData.parentEmail} onChange={handleChange} fullWidth required />
            <TextField label="Home Address" name="parentLocation" value={formData.parentLocation} onChange={handleChange} fullWidth required />
          </TwoCol>
          <TwoCol>
            <TextField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} fullWidth required autoComplete="new-password" />
            <TextField label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} fullWidth required autoComplete="new-password" />
          </TwoCol>

          <SectionTitle>Children</SectionTitle>
          {formData.children.map((child, idx) => (
            <ChildRow key={idx}>
              <TextField label="Child's Name" fullWidth value={child.childName} onChange={(e) => handleChildChange(idx, "childName", e.target.value)} required size="small" />
              <TextField label="Age" type="number" fullWidth value={child.age} onChange={(e) => handleChildChange(idx, "age", e.target.value)} required size="small" />
              <TextField
                select
                label="Gender"
                fullWidth
                value={child.gender}
                onChange={(e) => handleChildChange(idx, "gender", e.target.value)}
                required
                size="small"
                SelectProps={{ native: true }}
              >
                <option value="">Gender</option>
                <option value="Boy">Boy</option>
                <option value="Girl">Girl</option>
              </TextField>
              <TextField label="School" fullWidth value={child.school} onChange={(e) => handleChildChange(idx, "school", e.target.value)} required size="small" />
              {formData.children.length > 1 && (
                <IconButton onClick={() => handleRemoveChild(idx)} color="error" size="small">
                  <RemoveCircleOutlineIcon />
                </IconButton>
              )}
            </ChildRow>
          ))}
          <Button
            variant="outlined"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleAddChild}
            sx={{ mb: 3, borderRadius: "50px" }}
          >
            Add Child
          </Button>

          <SectionTitle>Pick-Up & Drop-Off Locations</SectionTitle>
          <Typography variant="body2" sx={{ color: colors.mutedText, mb: 1 }}>
            Click on the map to set pick-up, then drop-off location.
          </Typography>
          <MapContainer>
            <Map mode="register" onLocationsChange={handleMapChange} />
          </MapContainer>

          <FormControlLabel
            control={<Checkbox name="recurring" checked={formData.recurring} onChange={handleChange} />}
            label="Set as recurring weekly pick-up"
            sx={{ mb: 3 }}
          />

          <Button type="submit" variant="contained" size="large" fullWidth>
            Create Account
          </Button>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2" sx={{ color: colors.mutedText }}>
              Already have an account?{" "}
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
    max-width: 860px;
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

const SectionTitle = styled.h3`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: ${colors.skyBlue};
  margin: 24px 0 16px;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const ChildRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding: 16px;
  background: ${colors.lightBg};
  border-radius: 12px;
  border: 1px solid ${colors.border};
`;
