"use client";

import React, { useState } from "react";
import { TextField } from "@mui/material";
import styled from "styled-components";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import axios from "axios";
import toast from "react-hot-toast";
import { colors } from "@/lib/theme";

interface Props {
  bookingId: string;
  driverId: string;
  driverName: string;
  onDone: () => void;
}

const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export default function RateDriverPanel({ bookingId, driverId, driverName, onDone }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const display = hover || rating;

  const handleSubmit = async () => {
    if (!rating) { toast.error("Please select a star rating."); return; }
    setSubmitting(true);
    try {
      await axios.post(
        "/api/reviews",
        { driverId, bookingId, rating, comment: comment || undefined },
        { withCredentials: true },
      );
      toast.success("Thanks for your review!");
      onDone();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Panel>
      <PanelTitle>Rate Your Driver</PanelTitle>
      <DriverName>{driverName}</DriverName>

      <Stars>
        {[1, 2, 3, 4, 5].map((n) => (
          <StarBtn
            key={n}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
          >
            {display >= n
              ? <StarIcon sx={{ fontSize: 36, color: "#F6AD55" }} />
              : <StarBorderIcon sx={{ fontSize: 36, color: colors.border }} />}
          </StarBtn>
        ))}
      </Stars>
      {display > 0 && <RatingLabel>{LABELS[display]}</RatingLabel>}

      <TextField
        label="Comment (optional)"
        placeholder="How was the trip?"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        multiline
        rows={2}
        size="small"
        fullWidth
      />

      <SubmitRow>
        <SkipBtn onClick={onDone} disabled={submitting}>Skip</SkipBtn>
        <SubmitBtn onClick={handleSubmit} disabled={submitting || !rating}>
          {submitting ? "Submitting…" : "Submit Review"}
        </SubmitBtn>
      </SubmitRow>
    </Panel>
  );
}

const Panel = styled.div`
  border: 1px solid ${colors.border}; border-radius: 16px; padding: 22px 24px;
  display: flex; flex-direction: column; gap: 14px; background: ${colors.pureWhite};
`;

const PanelTitle = styled.p`
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1px; color: ${colors.mutedText}; margin: 0;
`;

const DriverName = styled.p`
  font-size: 1.05rem; font-weight: 700; color: ${colors.deepNavy}; margin: 0;
`;

const Stars = styled.div`
  display: flex; gap: 4px;
`;

const StarBtn = styled.button`
  background: none; border: none; cursor: pointer; padding: 0;
  transition: transform 0.1s;
  &:hover { transform: scale(1.1); }
`;

const RatingLabel = styled.p`
  font-size: 0.85rem; font-weight: 700; color: #F6AD55; margin: -6px 0 0;
`;

const SubmitRow = styled.div`
  display: flex; gap: 10px; justify-content: flex-end;
`;

const SkipBtn = styled.button`
  padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.875rem;
  cursor: pointer; background: none; border: 1px solid ${colors.border}; color: ${colors.mutedText};
  &:hover { border-color: ${colors.deepNavy}; color: ${colors.deepNavy}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SubmitBtn = styled.button`
  padding: 10px 24px; border-radius: 50px; font-weight: 700; font-size: 0.875rem;
  cursor: pointer; background: ${colors.deepNavy}; color: #fff; border: none;
  &:hover:not(:disabled) { background: #0f2340; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
