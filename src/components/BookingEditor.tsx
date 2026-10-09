"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import toast from "react-hot-toast";
import styled from "styled-components";
import { colors } from "@/lib/theme";

interface ChildDraft {
  _id?: string;
  childRef?: string;
  name: string;
  age: number;
  gender: string;
  school: string;
  guardianNotes?: string;
  pickupLocation?: { lat: number; lng: number; label?: string };
  dropoffLocation?: { lat: number; lng: number; label?: string };
}

interface BookingEditorProps {
  booking: any;
  isAdmin: boolean;
  canEdit: boolean;
  onSaved: (booking: any) => void;
}

const DURATION_OPTIONS = ["semester", "month", "week", "one_off"];
const DIRECTIONS = ["morning", "evening", "both"];
const STATUSES = ["pending", "driver_assigned", "accepted", "in_progress", "completed", "canceled"];

function kenyaDateTime(value?: string) {
  if (!value) return { date: "", time: "07:00" };
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(value));
  return { date: `${part("year")}-${part("month")}-${part("day")}`, time };
}

export default function BookingEditor({ booking, isAdmin, canEdit, onSaved }: BookingEditorProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [children, setChildren] = useState<ChildDraft[]>([]);
  const [duration, setDuration] = useState("semester");
  const [direction, setDirection] = useState("morning");
  const [bookingStatus, setBookingStatus] = useState("pending");
  const [tripDate, setTripDate] = useState("");
  const [tripTime, setTripTime] = useState("07:00");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState("");
  const [amountIncurred, setAmountIncurred] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [driverId, setDriverId] = useState("");

  useEffect(() => {
    if (!open) return;
    setChildren((booking.children ?? []).map((child: any) => ({
      _id: child._id,
      childRef: child.childRef,
      name: child.name ?? "",
      age: child.age ?? 0,
      gender: child.gender ?? "",
      school: child.school ?? "",
      guardianNotes: child.guardianNotes ?? "",
      pickupLocation: child.pickupLocation,
      dropoffLocation: child.dropoffLocation,
    })));
    setDuration(booking.bookingDuration ?? (booking.bookingType === "recurring" ? "semester" : "one_off"));
    setDirection(booking.direction ?? "morning");
    setBookingStatus(booking.status ?? "pending");
    const dateTime = kenyaDateTime(booking.tripDate);
    setTripDate(dateTime.date);
    setTripTime(dateTime.time);
    setStartDate(booking.recurringMeta?.startDate ?? dateTime.date);
    setEndDate(booking.recurringMeta?.endDate ?? "");
    setRecurringDays(booking.recurringMeta?.days ?? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    setTotalAmount(booking.totalAmount == null ? "" : String(booking.totalAmount));
    setAmountIncurred(booking.amountIncurred == null ? "0" : String(booking.amountIncurred));
    setDueDate(booking.dueDate ? kenyaDateTime(booking.dueDate).date : "");
    setDriverId(booking.driver?._id ?? booking.driver ?? "");
  }, [booking, open]);

  const changeChild = (index: number, field: keyof ChildDraft, value: string) => {
    setChildren((previous) => previous.map((child, childIndex) =>
      childIndex === index ? { ...child, [field]: field === "age" ? Number(value) : value } : child,
    ));
  };

  const save = async () => {
    if (children.length === 0 || children.some((child) => !child.name.trim() || !child.school.trim() || !child.gender || child.age < 1)) {
      toast.error("Each child needs a name, age, gender, and school.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { children };
      if (isAdmin) {
        payload.bookingDuration = duration;
        payload.bookingType = duration === "one_off" ? "one_time" : "recurring";
        payload.direction = direction;
        payload.status = bookingStatus;
        payload.driverId = driverId;
        payload.totalAmount = Number(totalAmount || 0);
        payload.amountIncurred = Number(amountIncurred || 0);
        payload.dueDate = dueDate || null;
        if (duration === "one_off") {
          payload.tripDate = new Date(`${tripDate}T${tripTime}:00+03:00`).toISOString();
        } else {
          payload.tripDate = new Date(`${startDate}T${tripTime}:00+03:00`).toISOString();
          payload.recurringMeta = {
            ...(booking.recurringMeta ?? {}),
            days: recurringDays,
            startDate,
            endDate: endDate || null,
            morningTime: direction === "evening" ? (booking.recurringMeta?.morningTime ?? "07:00") : tripTime,
            eveningTime: direction === "evening" || direction === "both" ? tripTime : null,
          };
        }
      }
      const response = await axios.patch(`/api/bookings/${booking._id}`, payload, { withCredentials: true });
      onSaved(response.data.data);
      setOpen(false);
      toast.success("Booking updated.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Could not update booking.");
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) return null;

  return (
    <>
      <Button size="small" variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => setOpen(true)}>
        {isAdmin ? "Edit booking" : "Edit children"}
      </Button>
      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{isAdmin ? "Edit booking" : "Edit children"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "12px !important" }}>
          {children.map((child, index) => (
            <ChildEditor key={child._id ?? `new-${index}`}>
              <EditorHeader>
                <strong>{child.name || `Child ${index + 1}`}</strong>
                <IconButton aria-label={`Remove ${child.name || `child ${index + 1}`}`} size="small" onClick={() => setChildren((previous) => previous.filter((_, childIndex) => childIndex !== index))}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </EditorHeader>
              <EditorGrid>
                <TextField label="Name" value={child.name} onChange={(event) => changeChild(index, "name", event.target.value)} size="small" required />
                <TextField label="Age" type="number" value={child.age} onChange={(event) => changeChild(index, "age", event.target.value)} size="small" inputProps={{ min: 1, max: 20 }} required />
                <TextField select label="Gender" value={child.gender} onChange={(event) => changeChild(index, "gender", event.target.value)} size="small" required>
                  <MenuItem value="Girl">Girl</MenuItem>
                  <MenuItem value="Boy">Boy</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
                <TextField label="School" value={child.school} onChange={(event) => changeChild(index, "school", event.target.value)} size="small" required />
              </EditorGrid>
              <TextField label="Notes for the driver" value={child.guardianNotes ?? ""} onChange={(event) => changeChild(index, "guardianNotes", event.target.value)} size="small" multiline minRows={2} fullWidth />
            </ChildEditor>
          ))}
          <Button startIcon={<AddIcon />} onClick={() => setChildren((previous) => [...previous, { name: "", age: 1, gender: "", school: "", guardianNotes: "" }])}>
            Add child
          </Button>

          {isAdmin && (
            <AdminFields>
              <EditorGrid>
                <TextField select label="Duration" value={duration} onChange={(event) => setDuration(event.target.value)} size="small">
                  {DURATION_OPTIONS.map((option) => <MenuItem key={option} value={option}>{option.replace("_", " ")}</MenuItem>)}
                </TextField>
                <TextField select label="Direction" value={direction} onChange={(event) => setDirection(event.target.value)} size="small">
                  {DIRECTIONS.map((option) => <MenuItem key={option} value={option}>{option.replace("_", " ")}</MenuItem>)}
                </TextField>
                <TextField select label="Status" value={bookingStatus} onChange={(event) => setBookingStatus(event.target.value)} size="small">
                  {STATUSES.map((option) => <MenuItem key={option} value={option}>{option.replace("_", " ")}</MenuItem>)}
                </TextField>
                <TextField label="Assigned driver ID" value={driverId} onChange={(event) => setDriverId(event.target.value)} size="small" />
              </EditorGrid>
              {duration === "one_off" ? (
                <EditorGrid>
                  <TextField type="date" label="Trip date" value={tripDate} onChange={(event) => setTripDate(event.target.value)} size="small" InputLabelProps={{ shrink: true }} />
                  <TextField type="time" label="Trip time" value={tripTime} onChange={(event) => setTripTime(event.target.value)} size="small" InputLabelProps={{ shrink: true }} />
                </EditorGrid>
              ) : (
                <EditorGrid>
                  <TextField type="date" label="Start date" value={startDate} onChange={(event) => setStartDate(event.target.value)} size="small" InputLabelProps={{ shrink: true }} />
                  <TextField type="date" label="End date" value={endDate} onChange={(event) => setEndDate(event.target.value)} size="small" InputLabelProps={{ shrink: true }} />
                  <TextField type="time" label="Trip time" value={tripTime} onChange={(event) => setTripTime(event.target.value)} size="small" InputLabelProps={{ shrink: true }} />
                </EditorGrid>
              )}
              <EditorGrid>
                <TextField label="Booking total (KES)" type="number" value={totalAmount} onChange={(event) => setTotalAmount(event.target.value)} size="small" inputProps={{ min: 0 }} />
                <TextField label="Amount incurred (KES)" type="number" value={amountIncurred} onChange={(event) => setAmountIncurred(event.target.value)} size="small" inputProps={{ min: 0 }} />
                <TextField label="Due date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} size="small" InputLabelProps={{ shrink: true }} />
              </EditorGrid>
            </AdminFields>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const ChildEditor = styled.div`
  display: grid;
  gap: 12px;
  padding: 12px;
  border: 1px solid ${colors.border};
  background: #FFFCF4;
`;
const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: ${colors.deepNavy};
`;
const EditorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
`;
const AdminFields = styled.div`
  display: grid;
  gap: 14px;
  padding-top: 14px;
  border-top: 1px solid ${colors.border};
`;