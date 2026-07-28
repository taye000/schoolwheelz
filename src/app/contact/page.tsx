"use client";

import React, { useState } from "react";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import styled from "styled-components";
import axios from "axios";
import toast from "react-hot-toast";
import { colors } from "@/lib/theme";

const isValidEmail = (value: string) => /.+@.+\..+/.test(value.trim());
const isValidPhone = (value: string) => /^\+?[0-9]{7,15}$/.test(value.trim());

export default function ContactPage() {
  const [form, setForm] = useState({ fullName: "", email: "", phoneNumber: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = form.email.trim();
    const phoneNumber = form.phoneNumber.trim();

    if (!form.message.trim()) {
      toast.error("Please provide a message.");
      return;
    }

    if (!email && !phoneNumber) {
      toast.error("Please provide at least one contact method.");
      return;
    }

    if (email && !isValidEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (phoneNumber && !isValidPhone(phoneNumber)) {
      toast.error("Please enter a valid phone number with digits only.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post("/api/contact", form);
      if (data.success) {
        toast.success(data.message || "Message sent.");
        setForm({ fullName: "", email: "", phoneNumber: "", message: "" });
      } else {
        toast.error(data.message || "Unable to send your message.");
      }
    } catch {
      toast.error("Unable to send your message right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <Card elevation={0}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.deepNavy, mb: 1 }}>
          Contact us
        </Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, mb: 3 }}>
          Share your questions or feedback. We will get back to you as soon as possible.
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Full name" name="fullName" value={form.fullName} onChange={handleChange} fullWidth />
          <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth />
          <TextField label="Phone number" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} fullWidth />
          <TextField label="Message" name="message" value={form.message} onChange={handleChange} fullWidth multiline minRows={6} required />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Sending…" : "Send message"}
          </Button>
          <Typography variant="caption" sx={{ color: colors.mutedText }}>
            At least one of email or phone is required so we can reach you back.
          </Typography>
        </Box>
      </Card>
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  min-height: 100vh;
  padding: 48px 20px;
  background: linear-gradient(135deg, ${colors.lightBg} 0%, #f8fbff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Card = styled(Paper)`
  width: 100%;
  max-width: 640px;
  padding: 32px;
  border-radius: 20px;
  border: 1px solid ${colors.border};
`;
