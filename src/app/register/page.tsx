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
  InputAdornment,
  Collapse,
  Alert,
} from "@mui/material";
import styled from "styled-components";
import dynamic from "next/dynamic";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import RoomIcon from "@mui/icons-material/Room";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import PhoneInput from "@/components/PhoneInput";
import { colors } from "@/lib/theme";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

interface ChildFormData {
  childName: string;
  school: string;
  gender: string;
  age: string;
  pickupLocation: { lat: number; lng: number };
  dropoffLocation: { lat: number; lng: number };
  showMap: boolean;
}

const defaultChild = (): ChildFormData => ({
  childName: "",
  school: "",
  gender: "",
  age: "",
  pickupLocation: { lat: 0, lng: 0 },
  dropoffLocation: { lat: 0, lng: 0 },
  showMap: false,
});

export default function RegisterPage() {
  const router = useRouter();

  const [parentData, setParentData] = useState({
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    parentLocation: "",
    password: "",
    confirmPassword: "",
    recurring: false,
  });

  const [children, setChildren] = useState<ChildFormData[]>([defaultChild()]);
  const [showChildren, setShowChildren] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [phoneError, setPhoneError] = useState(false);

  const handleParentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const updated = { ...parentData, [name]: type === "checkbox" ? checked : value };
    setParentData(updated);
    if (name === "confirmPassword" || name === "password") {
      const pw = name === "password" ? value : updated.password;
      const cpw = name === "confirmPassword" ? value : updated.confirmPassword;
      setPasswordMismatch(cpw.length > 0 && pw !== cpw);
    }
  };

  const handleChildChange = (index: number, field: keyof ChildFormData, value: string) => {
    setChildren((prev) =>
      prev.map((child, i) => (i === index ? { ...child, [field]: value } : child))
    );
  };

  const handleChildMapChange = (
    index: number,
    locations: { pickupLocation: { lat: number; lng: number }; dropoffLocation: { lat: number; lng: number } }
  ) => {
    setChildren((prev) =>
      prev.map((child, i) => (i === index ? { ...child, ...locations } : child))
    );
  };

  const toggleChildMap = (index: number) => {
    setChildren((prev) =>
      prev.map((child, i) => (i === index ? { ...child, showMap: !child.showMap } : child))
    );
  };

  const handleAddChild = () => setChildren((prev) => [...prev, defaultChild()]);

  const handleRemoveChild = (index: number) =>
    setChildren((prev) => prev.filter((_, i) => i !== index));

  const handlePhoneChange = (value: string) => {
    setParentData((prev) => ({ ...prev, parentPhone: value }));
    setPhoneError(value.replace(/\D/g, "").length < 7);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parentData.password !== parentData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (parentData.parentPhone.replace(/\D/g, "").length < 7) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    const payload = {
      fullName: parentData.parentName,
      email: parentData.parentEmail,
      phoneNumber: parentData.parentPhone,
      address: parentData.parentLocation,
      password: parentData.password,
      userType: "parent",
      children: showChildren ? children.map((child) => ({
        name: child.childName,
        school: child.school,
        gender: child.gender,
        age: Number(child.age),
        pickupLocation: child.pickupLocation,
        dropoffLocation: child.dropoffLocation,
      })) : [],
    };

    try {
      const response = await axios.post("/api/parents-registration", payload);
      if (response.status === 201) {
        toast.success("Welcome to School Wheelz! 🎉");
        router.push("/profile");
      }
    } catch (error: any) {
      const msg = error?.response?.data?.error || "Registration failed. Please try again.";
      toast.error(msg);
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
          {/* Parent Details */}
          <SectionTitle>Parent Details</SectionTitle>
          <TwoCol>
            <TextField label="Full Name" name="parentName" value={parentData.parentName} onChange={handleParentChange} fullWidth required />
            <PhoneInput
              label="Phone Number"
              value={parentData.parentPhone}
              onChange={handlePhoneChange}
              required
              error={phoneError}
              helperText={phoneError ? "Enter a valid phone number" : undefined}
            />
          </TwoCol>
          <TwoCol>
            <TextField label="Email" name="parentEmail" type="email" value={parentData.parentEmail} onChange={handleParentChange} fullWidth required />
            <TextField label="Home Address" name="parentLocation" value={parentData.parentLocation} onChange={handleParentChange} fullWidth required />
          </TwoCol>

          {/* Password */}
          <SectionTitle>Password</SectionTitle>
          <TwoCol>
            <TextField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={parentData.password}
              onChange={handleParentChange}
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
              value={parentData.confirmPassword}
              onChange={handleParentChange}
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
          </TwoCol>
          <Collapse in={passwordMismatch}>
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              Passwords do not match.
            </Alert>
          </Collapse>

          {/* Children — optional */}
          <ChildrenToggle
            onClick={() => setShowChildren((v) => !v)}
            role="button"
            aria-expanded={showChildren}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <ChildCareIcon sx={{ color: colors.skyBlue }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.deepNavy }}>
                  Add Children
                  <OptionalBadge>optional</OptionalBadge>
                </Typography>
                <Typography variant="caption" sx={{ color: colors.mutedText }}>
                  {showChildren ? "Collapse section" : "You can add children now or later from your profile"}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" sx={{ color: colors.skyBlue, pointerEvents: "none" }}>
              {showChildren ? <RemoveCircleOutlineIcon /> : <AddCircleOutlineIcon />}
            </IconButton>
          </ChildrenToggle>

          <Collapse in={showChildren} unmountOnExit>
          {children.map((child, idx) => (
            <ChildCard key={idx}>
              <ChildCardHeader>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.deepNavy }}>
                  Child {idx + 1}
                </Typography>
                {children.length > 1 && (
                  <IconButton onClick={() => handleRemoveChild(idx)} color="error" size="small">
                    <RemoveCircleOutlineIcon />
                  </IconButton>
                )}
              </ChildCardHeader>

              <ChildFields>
                <TextField label="Child's Name" fullWidth value={child.childName} onChange={(e) => handleChildChange(idx, "childName", e.target.value)} required size="small" />
                <TextField label="Age" type="number" fullWidth value={child.age} onChange={(e) => handleChildChange(idx, "age", e.target.value)} required size="small" inputProps={{ min: 1, max: 20 }} />
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
              </ChildFields>

              <Button
                variant="outlined"
                size="small"
                startIcon={<RoomIcon />}
                onClick={() => toggleChildMap(idx)}
                sx={{ mt: 1.5, borderRadius: "50px", fontSize: "0.75rem" }}
              >
                {child.showMap ? "Hide Map" : "Set Pick-Up & Drop-Off for This Child"}
              </Button>

              <Collapse in={child.showMap}>
                <MapHint>
                  Click once to set pick-up (green), click again for drop-off (blue). Drag to adjust.
                  {child.pickupLocation.lat !== 0 && <LocBadge>Pickup ✓</LocBadge>}
                  {child.dropoffLocation.lat !== 0 && <LocBadge blue>Drop-off ✓</LocBadge>}
                </MapHint>
                <MapContainer>
                  <Map mode="register" onLocationsChange={(locs) => handleChildMapChange(idx, locs)} />
                </MapContainer>
              </Collapse>
            </ChildCard>
          ))}

          <Button
            variant="outlined"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleAddChild}
            sx={{ mb: 2, borderRadius: "50px" }}
          >
            Add Another Child
          </Button>
          </Collapse>

          <FormControlLabel
            control={<Checkbox name="recurring" checked={parentData.recurring} onChange={handleParentChange} />}
            label="Set all routes as recurring weekly pick-ups"
            sx={{ mt: 3, mb: 3, display: "block" }}
          />

          <Button type="submit" variant="contained" size="large" fullWidth disabled={passwordMismatch}>
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

/* ── Styles ── */

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

const ChildCard = styled.div`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
`;

const ChildCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
`;

const ChildFields = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const MapHint = styled.p`
  font-size: 0.8rem;
  color: ${colors.mutedText};
  margin: 12px 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const LocBadge = styled.span<{ blue?: boolean }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 600;
  background: ${(p) => (p.blue ? colors.skyBlue : colors.mintCream)};
  color: ${colors.deepNavy};
`;

const MapContainer = styled.div`
  height: 360px;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 8px;
`;

const ChildrenToggle = styled.div`
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
