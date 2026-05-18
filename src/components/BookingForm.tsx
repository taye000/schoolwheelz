"use client";

import React, { useState } from "react";
import {
  Button,
  FormControlLabel,
  Checkbox,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  Typography,
  Divider,
} from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import RepeatIcon from "@mui/icons-material/Repeat";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import NightlightIcon from "@mui/icons-material/Nightlight";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import axios from "axios";
import toast from "react-hot-toast";
import styled from "styled-components";
import { colors } from "@/lib/theme";

interface Child {
  _id: string;
  name: string;
  age: number;
  school: string;
  gender: string;
}

interface BookingFormProps {
  parent: {
    _id: string;
    fullName: string;
    children?: Child[];
  };
  driverId: string;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const WEEKDAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const BookingForm: React.FC<BookingFormProps> = ({ parent, driverId }) => {
  const [selectedChildren, setSelectedChildren] = useState<Child[]>([]);

  // Trip type: one_time | recurring
  const [bookingType, setBookingType] = useState<"one_time" | "recurring">("one_time");

  // one_time fields
  const [tripDate, setTripDate] = useState("");
  const [pickupTime, setPickupTime] = useState("07:00");

  // return trip (evening)
  const [includeReturn, setIncludeReturn] = useState(false);
  const [returnTime, setReturnTime] = useState("15:30");

  // recurring fields
  const [recurringDays, setRecurringDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [recurringStartDate, setRecurringStartDate] = useState("");
  const [recurringEndDate, setRecurringEndDate] = useState("");
  const [recurringMorningTime, setRecurringMorningTime] = useState("07:00");
  const [includeRecurringEvening, setIncludeRecurringEvening] = useState(false);
  const [recurringEveningTime, setRecurringEveningTime] = useState("15:30");

  const [loading, setLoading] = useState(false);

  const toggleChild = (child: Child) => {
    setSelectedChildren((prev) =>
      prev.find((c) => c._id === child._id)
        ? prev.filter((c) => c._id !== child._id)
        : [...prev, child]
    );
  };

  const toggleDay = (day: string) => {
    setRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const isValid = () => {
    if (!selectedChildren.length) return false;
    if (bookingType === "one_time") return !!tripDate && !!pickupTime;
    return !!recurringStartDate && !!recurringMorningTime && recurringDays.length > 0;
  };

  const handleSubmit = async () => {
    if (!isValid()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const direction =
        (bookingType === "one_time" && includeReturn) ||
        (bookingType === "recurring" && includeRecurringEvening)
          ? "both"
          : "morning";

      const payload: any = {
        driverId,
        children: selectedChildren,
        seatsBooked: selectedChildren.length,
        bookingType,
        direction,
      };

      if (bookingType === "one_time") {
        // Combine date + time into a single ISO datetime
        const dt = new Date(`${tripDate}T${pickupTime}:00`);
        payload.tripDate = dt.toISOString();
        if (includeReturn) payload.returnTime = returnTime;
      } else {
        payload.recurringDays = recurringDays;
        payload.startDate = recurringStartDate;
        payload.endDate = recurringEndDate || undefined;
        payload.morningTime = recurringMorningTime;
        if (includeRecurringEvening) payload.eveningTime = recurringEveningTime;
      }

      await axios.post("/api/bookings", payload, { withCredentials: true });

      toast.success(
        bookingType === "recurring"
          ? "Recurring schedule created! Pending driver approval."
          : "Booking request sent! Pending driver approval."
      );

      // Reset
      setSelectedChildren([]);
      setTripDate("");
      setIncludeReturn(false);
      setRecurringStartDate("");
      setRecurringEndDate("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to submit booking.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <FormWrap>
      {/* ── Children ── */}
      <FieldGroup>
        <FieldLabel>Children</FieldLabel>
        {parent.children?.length ? (
          parent.children.map((child) => (
            <ChildRow key={child._id}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={!!selectedChildren.find((c) => c._id === child._id)}
                    onChange={() => toggleChild(child)}
                    sx={{ color: colors.skyBlue, "&.Mui-checked": { color: colors.skyBlue } }}
                  />
                }
                label={
                  <ChildLabel>
                    <span>{child.name}</span>
                    <ChildMeta>{child.age}y · {child.gender} · {child.school}</ChildMeta>
                  </ChildLabel>
                }
              />
            </ChildRow>
          ))
        ) : (
          <NoChildren>
            No children on your profile yet. Add them in your{" "}
            <a href="/profile" style={{ color: colors.skyBlue }}>profile</a>.
          </NoChildren>
        )}
      </FieldGroup>

      <Divider sx={{ my: 0.5 }} />

      {/* ── Trip type toggle ── */}
      <FieldGroup>
        <FieldLabel>Trip Type</FieldLabel>
        <TypeToggle>
          <TypeBtn
            selected={bookingType === "one_time"}
            onClick={() => setBookingType("one_time")}
          >
            <DirectionsCarIcon sx={{ fontSize: 16 }} />
            One-time
          </TypeBtn>
          <TypeBtn
            selected={bookingType === "recurring"}
            onClick={() => setBookingType("recurring")}
          >
            <RepeatIcon sx={{ fontSize: 16 }} />
            Recurring
          </TypeBtn>
        </TypeToggle>
      </FieldGroup>

      {/* ── One-time fields ── */}
      {bookingType === "one_time" && (
        <>
          <FieldGroup>
            <FieldLabel>Pick-up Date & Time</FieldLabel>
            <Row>
              <TextField
                type="date"
                size="small"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                inputProps={{ min: today }}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
              <TimeField
                type="time"
                size="small"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 110 }}
              />
            </Row>
          </FieldGroup>

          <ReturnRow>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={includeReturn}
                  onChange={(e) => setIncludeReturn(e.target.checked)}
                  sx={{ color: colors.skyBlue, "&.Mui-checked": { color: colors.skyBlue } }}
                />
              }
              label={
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: colors.deepNavy }}>
                  <SwapHorizIcon sx={{ fontSize: 15, verticalAlign: "middle", mr: 0.5 }} />
                  Include return (evening drop-off)
                </span>
              }
            />
          </ReturnRow>

          <Collapse in={includeReturn}>
            <FieldGroup style={{ marginTop: 4 }}>
              <FieldLabel>Evening Drop-off Time</FieldLabel>
              <TimeField
                type="time"
                size="small"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 130 }}
              />
            </FieldGroup>
          </Collapse>
        </>
      )}

      {/* ── Recurring fields ── */}
      {bookingType === "recurring" && (
        <>
          <FieldGroup>
            <FieldLabel>Active Days</FieldLabel>
            <DayPicker>
              {WEEKDAYS.map((d, i) => (
                <DayBtn
                  key={d}
                  active={recurringDays.includes(WEEKDAY_FULL[i])}
                  onClick={() => toggleDay(WEEKDAY_FULL[i])}
                >
                  {d}
                </DayBtn>
              ))}
            </DayPicker>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>
              <WbSunnyIcon sx={{ fontSize: 14, color: "#F6AD55", mr: 0.5, verticalAlign: "middle" }} />
              Morning Pick-up Time
            </FieldLabel>
            <TimeField
              type="time"
              size="small"
              value={recurringMorningTime}
              onChange={(e) => setRecurringMorningTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 130 }}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Start Date</FieldLabel>
            <TextField
              type="date"
              size="small"
              value={recurringStartDate}
              onChange={(e) => setRecurringStartDate(e.target.value)}
              inputProps={{ min: today }}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>End Date <Optional>(optional)</Optional></FieldLabel>
            <TextField
              type="date"
              size="small"
              value={recurringEndDate}
              onChange={(e) => setRecurringEndDate(e.target.value)}
              inputProps={{ min: recurringStartDate || today }}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </FieldGroup>

          <ReturnRow>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={includeRecurringEvening}
                  onChange={(e) => setIncludeRecurringEvening(e.target.checked)}
                  sx={{ color: colors.skyBlue, "&.Mui-checked": { color: colors.skyBlue } }}
                />
              }
              label={
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: colors.deepNavy }}>
                  <NightlightIcon sx={{ fontSize: 15, verticalAlign: "middle", mr: 0.5, color: "#9F7AEA" }} />
                  Include evening drop-off
                </span>
              }
            />
          </ReturnRow>

          <Collapse in={includeRecurringEvening}>
            <FieldGroup style={{ marginTop: 4 }}>
              <FieldLabel>
                <NightlightIcon sx={{ fontSize: 14, color: "#9F7AEA", mr: 0.5, verticalAlign: "middle" }} />
                Evening Drop-off Time
              </FieldLabel>
              <TimeField
                type="time"
                size="small"
                value={recurringEveningTime}
                onChange={(e) => setRecurringEveningTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 130 }}
              />
            </FieldGroup>
          </Collapse>
        </>
      )}

      <SubmitBtn
        variant="contained"
        fullWidth
        onClick={handleSubmit}
        disabled={!isValid() || loading}
      >
        {loading
          ? "Submitting…"
          : bookingType === "recurring"
          ? "Set Up Recurring Schedule"
          : "Request Booking"}
      </SubmitBtn>
    </FormWrap>
  );
};

/* ── Styled components ── */

const FormWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FieldLabel = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${colors.mutedText};
`;

const Optional = styled.span`
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.7rem;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const TimeField = styled(TextField)``;

const ChildRow = styled.div`
  padding: 2px 0;
`;

const ChildLabel = styled.div`
  display: flex;
  flex-direction: column;
  span { font-size: 0.875rem; font-weight: 600; color: ${colors.deepNavy}; }
`;

const ChildMeta = styled.span`
  font-size: 0.75rem !important;
  font-weight: 400 !important;
  color: ${colors.mutedText} !important;
`;

const NoChildren = styled.p`
  font-size: 0.85rem;
  color: ${colors.mutedText};
  margin: 0;
`;

const TypeToggle = styled.div`
  display: flex;
  gap: 8px;
`;

const TypeBtn = styled.button<{ selected: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 0.83rem;
  font-weight: 600;
  cursor: pointer;
  border: 2px solid ${({ selected }) => selected ? colors.skyBlue : colors.border};
  background: ${({ selected }) => selected ? colors.skyBlue + "18" : "transparent"};
  color: ${({ selected }) => selected ? colors.skyBlue : colors.mutedText};
  transition: all 0.15s;
  &:hover { border-color: ${colors.skyBlue}; color: ${colors.skyBlue}; }
`;

const ReturnRow = styled.div`
  margin: -4px 0;
`;

const DayPicker = styled.div`
  display: flex;
  gap: 6px;
`;

const DayBtn = styled.button<{ active: boolean }>`
  width: 38px; height: 38px;
  border-radius: 50%;
  border: 2px solid ${({ active }) => active ? colors.deepNavy : colors.border};
  background: ${({ active }) => active ? colors.deepNavy : "transparent"};
  color: ${({ active }) => active ? "#fff" : colors.mutedText};
  font-size: 0.72rem; font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: ${colors.deepNavy}; }
`;

const SubmitBtn = styled(Button)`
  && {
    border-radius: 50px;
    padding: 11px;
    font-weight: 700;
    font-size: 0.9rem;
    margin-top: 4px;
  }
` as typeof Button;

export default BookingForm;
