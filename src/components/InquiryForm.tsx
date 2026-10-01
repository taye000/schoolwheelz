"use client";

import React, { useState } from "react";
import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import axios from "axios";
import styled from "styled-components";

const initialForm = { name: "", email: "", phone: "", school: "", message: "", website: "" };

export default function InquiryForm() {
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      await axios.post("/api/inquiries", form);
      setForm(initialForm);
      setSent(true);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? "We could not send that just now. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <FormShell>
      <Typography component="h3" variant="h5" sx={{ fontWeight: 800, color: "#20211E", mb: 0.5 }}>
        Ask about your school route
      </Typography>
      <Typography variant="body2" sx={{ color: "#646358", mb: 2.5 }}>
        Tell us what your family needs and our team will get back to you.
      </Typography>
      {sent && <Alert severity="success" sx={{ mb: 2 }}>Thanks. Your inquiry has been sent.</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 1.5 }}>
        <input
          name="website"
          value={form.website}
          onChange={(event) => setForm((previous) => ({ ...previous, website: event.target.value }))}
          aria-hidden="true"
          autoComplete="off"
          tabIndex={-1}
          style={{ display: "none" }}
        />
        <TextField
          label="Your name"
          value={form.name}
          onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
          required
          fullWidth
        />
        <TwoFields>
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Phone"
            value={form.phone}
            onChange={(event) => setForm((previous) => ({ ...previous, phone: event.target.value }))}
            fullWidth
          />
        </TwoFields>
        <Typography variant="caption" sx={{ color: "#646358", mt: -0.75 }}>
          Include an email address or phone number so we can reply.
        </Typography>
        <TextField
          label="School (optional)"
          value={form.school}
          onChange={(event) => setForm((previous) => ({ ...previous, school: event.target.value }))}
          fullWidth
        />
        <TextField
          label="How can we help?"
          value={form.message}
          onChange={(event) => setForm((previous) => ({ ...previous, message: event.target.value }))}
          inputProps={{ minLength: 10, maxLength: 1500 }}
          multiline
          minRows={4}
          required
          fullWidth
        />
        <Button type="submit" variant="contained" startIcon={<SendIcon />} disabled={sending} sx={{ justifySelf: "start" }}>
          {sending ? "Sending..." : "Send inquiry"}
        </Button>
      </Box>
    </FormShell>
  );
}

const FormShell = styled.div`
  width: 100%;
  padding: 24px;
  border: 1px solid #E6E0D0;
  border-radius: 6px;
  background: #FFFDF6;
`;
const TwoFields = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;