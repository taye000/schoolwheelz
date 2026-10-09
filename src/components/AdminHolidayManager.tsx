"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import toast from "react-hot-toast";
import { colors } from "@/lib/theme";

interface School {
  _id: string;
  name: string;
  estate: string;
}

interface Holiday {
  _id: string;
  name: string;
  date: string;
  school?: { _id: string; name: string } | null;
}

export default function AdminHolidayManager() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [holidayResponse, schoolResponse] = await Promise.all([
        axios.get("/api/holidays?from=2000-01-01&to=2100-12-31", { withCredentials: true }),
        axios.get("/api/schools", { withCredentials: true }),
      ]);
      setHolidays(holidayResponse.data.data ?? []);
      setSchools(schoolResponse.data.data ?? []);
    } catch {
      toast.error("Could not load public holidays.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const addHoliday = async () => {
    if (!name.trim() || !date) return;
    setSaving(true);
    try {
      await axios.post("/api/holidays", { name: name.trim(), date, schoolId: schoolId || null }, { withCredentials: true });
      setName("");
      setDate("");
      setSchoolId("");
      await load();
      toast.success("Holiday added.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Could not add holiday.");
    } finally {
      setSaving(false);
    }
  };

  const removeHoliday = async (holiday: Holiday) => {
    try {
      await axios.delete(`/api/holidays?id=${holiday._id}`, { withCredentials: true });
      setHolidays((previous) => previous.filter((item) => item._id !== holiday._id));
      toast.success("Holiday removed.");
    } catch {
      toast.error("Could not remove holiday.");
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ color: colors.deepNavy, fontWeight: 750, mb: 0.5 }}>
        Public holidays
      </Typography>
      <Typography variant="body2" sx={{ color: colors.mutedText, mb: 2 }}>
        Add a holiday for every school or limit it to one school.
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "minmax(180px, 1.2fr) minmax(150px, 0.8fr) minmax(180px, 1fr) auto", gap: 1.25, alignItems: "start", mb: 3, "@media (max-width: 760px)": { gridTemplateColumns: "1fr 1fr" }, "@media (max-width: 480px)": { gridTemplateColumns: "1fr" } }}>
        <TextField label="Holiday name" value={name} onChange={(event) => setName(event.target.value)} size="small" fullWidth />
        <TextField label="Date" type="date" value={date} onChange={(event) => setDate(event.target.value)} size="small" fullWidth InputLabelProps={{ shrink: true }} />
        <TextField select label="Applies to" value={schoolId} onChange={(event) => setSchoolId(event.target.value)} size="small" fullWidth>
          <MenuItem value="">All schools</MenuItem>
          {schools.map((school) => <MenuItem key={school._id} value={school._id}>{school.name} · {school.estate}</MenuItem>)}
        </TextField>
        <Button variant="contained" onClick={addHoliday} disabled={saving || !name.trim() || !date} sx={{ minHeight: 40 }}>
          {saving ? "Adding..." : "Add holiday"}
        </Button>
      </Box>

      {loading ? <CircularProgress size={22} /> : holidays.length === 0 ? (
        <Typography variant="body2" sx={{ color: colors.mutedText }}>No holidays added.</Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Holiday</TableCell>
              <TableCell>School</TableCell>
              <TableCell align="right">Remove</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {holidays.map((holiday) => (
              <TableRow key={holiday._id} hover>
                <TableCell>{new Date(`${holiday.date}T12:00:00`).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                <TableCell>{holiday.name}</TableCell>
                <TableCell>{holiday.school?.name ?? "All schools"}</TableCell>
                <TableCell align="right">
                  <IconButton aria-label={`Remove ${holiday.name}`} size="small" onClick={() => removeHoliday(holiday)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}