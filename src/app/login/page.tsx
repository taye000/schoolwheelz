"use client";

import React, { useState } from "react";
import { TextField, Button, Typography, MenuItem, Box, Paper, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Stack } from "@mui/material";
import styled from "styled-components";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import SchoolIcon from "@mui/icons-material/School";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { colors } from "@/lib/theme";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userType: "parent",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotMode, setForgotMode] = useState<"email" | "verify">("email");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotUserType, setForgotUserType] = useState(formData.userType);
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotPhoneNumber, setForgotPhoneNumber] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("/api/auth/login", formData);
      if (response.status === 200) {
        toast.success("Welcome back!");
        const dest =
          formData.userType === "admin" ? "/admin" :
          formData.userType === "driver" ? "/bookings" :
          "/drivers";
        router.push(dest);
      }
    } catch (error) {
      toast.error("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openForgotPassword = () => {
    setForgotOpen(true);
    setForgotMode("email");
    setForgotEmail(formData.email);
    setForgotUserType(formData.userType);
    setForgotOtp("");
    setForgotPassword("");
    setForgotConfirmPassword("");
    setForgotPhoneNumber("");
    setForgotMessage("");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage("");

    try {
      if (forgotMode === "email") {
        const response = await axios.post("/api/auth/forgot-password", {
          email: forgotEmail,
          userType: forgotUserType,
        });
        if (response.data.success) {
          setForgotMode("verify");
          setForgotPhoneNumber(response.data.phoneNumber || "");
          setForgotMessage(response.data.message || "A verification code was sent to your phone.");
        } else {
          setForgotMessage(response.data.message || "Unable to send a reset code.");
        }
        return;
      }

      if (!forgotOtp || !forgotPassword || !forgotConfirmPassword) {
        setForgotMessage("Please complete the verification form.");
        return;
      }
      if (forgotPassword !== forgotConfirmPassword) {
        setForgotMessage("Passwords do not match.");
        return;
      }

      const response = await axios.patch("/api/auth/forgot-password", {
        email: forgotEmail,
        userType: forgotUserType,
        otp: forgotOtp,
        password: forgotPassword,
      });

      if (response.data.success) {
        toast.success("Password updated successfully.");
        setForgotOpen(false);
        setFormData((prev) => ({ ...prev, password: "" }));
      } else {
        setForgotMessage(response.data.message || "Unable to reset password.");
      }
    } catch {
      setForgotMessage("Unable to complete the request. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <PageWrapper>
      <Card elevation={0}>
        <LogoWrap>
          <SchoolIcon sx={{ fontSize: 40, color: colors.skyBlue }} />
        </LogoWrap>
        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.deepNavy, mb: 0.5 }}>
          Welcome back
        </Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, mb: 4 }}>
          Sign in to your School Wheelz account
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="I am a…"
            name="userType"
            value={formData.userType}
            onChange={handleChange}
            select
            fullWidth
            required
          >
            <MenuItem value="parent">Parent</MenuItem>
            <MenuItem value="driver">Driver</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>
          <TextField
            label="Email address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            required
            autoComplete="email"
          />
          <TextField
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            fullWidth
            required
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ mt: 1 }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </Button>
          <Button
            type="button"
            variant="text"
            size="small"
            onClick={openForgotPassword}
            sx={{ color: colors.skyBlue, alignSelf: "center" }}
          >
            Forgot password?
          </Button>
        </Box>
        <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Reset your password</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: colors.mutedText, mb: 2 }}>
              We’ll send a one-time code to your phone so you can verify your identity and set a new password.
            </Typography>
            <Box component="form" onSubmit={handleForgotPassword} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {forgotMode === "email" ? (
                <>
                  <TextField
                    label="I am a…"
                    value={forgotUserType}
                    onChange={(e) => setForgotUserType(e.target.value)}
                    select
                    fullWidth
                  >
                    <MenuItem value="parent">Parent</MenuItem>
                    <MenuItem value="driver">Driver</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </TextField>
                  <TextField
                    label="Email address"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    fullWidth
                    required
                  />
                </>
              ) : (
                <Stack spacing={2}>
                  <TextField
                    label="Phone number"
                    value={forgotPhoneNumber}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    helperText="A verification code will be sent to this number"
                  />
                  <TextField
                    label="Verification code"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    fullWidth
                    required
                  />
                  <TextField
                    label="New password"
                    type="password"
                    value={forgotPassword}
                    onChange={(e) => setForgotPassword(e.target.value)}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Confirm new password"
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    fullWidth
                    required
                  />
                </Stack>
              )}
              {forgotMessage && (
                <Typography variant="body2" sx={{ color: forgotMessage.includes("success") || forgotMessage.includes("sent") ? colors.skyBlue : colors.deepNavy }}>
                  {forgotMessage}
                </Typography>
              )}
              <DialogActions sx={{ px: 0, pb: 0 }}>
                <Button onClick={() => setForgotOpen(false)}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={forgotLoading}>
                  {forgotLoading ? "Please wait…" : forgotMode === "email" ? "Send code" : "Reset password"}
                </Button>
              </DialogActions>
            </Box>
          </DialogContent>
        </Dialog>
        <Footer>
          <span>Don&apos;t have an account?</span>
          <a href="/register">Register</a>
          <span>·</span>
          <a href="/driver-registration">Drive with us</a>
        </Footer>
      </Card>
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${colors.lightBg} 0%, #EBF8FF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const Card = styled(Paper)`
  && {
    width: 100%;
    max-width: 440px;
    padding: 48px 40px;
    border-radius: 20px;
    border: 1px solid ${colors.border};
    box-shadow: 0 20px 60px rgba(26, 54, 93, 0.1);
    text-align: center;
  }
`;

const LogoWrap = styled.div`
  width: 72px;
  height: 72px;
  background: ${colors.deepNavy};
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  font-size: 0.875rem;
  color: ${colors.mutedText};
  a {
    color: ${colors.skyBlue};
    font-weight: 600;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
`;
