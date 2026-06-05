"use client";

import React, { useState } from "react";
import { TextField, Button, Typography, MenuItem, Box, Paper, InputAdornment, IconButton } from "@mui/material";
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
          formData.userType === "driver" ? "/profile" :
          "/drivers";
        router.push(dest);
      }
    } catch (error) {
      toast.error("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
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
        </Box>
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
