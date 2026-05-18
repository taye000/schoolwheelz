"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import {
  Autocomplete,
  TextField,
  Chip,
  CircularProgress,
  Collapse,
  Alert,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import SendIcon from "@mui/icons-material/Send";
import toast from "react-hot-toast";
import axios from "axios";
import { colors } from "@/lib/theme";

export interface SchoolItem {
  _id: string;
  name: string;
  estate: string;
}

interface Props {
  driverId: string;
  /** Current schools already on the driver's profile */
  initialSchools?: SchoolItem[];
  /** Set to false to show read-only view (no add/remove) */
  editable?: boolean;
  /** When read-only, show driver-facing nudge instead of public message */
  isOwner?: boolean;
  onUpdate?: (schools: SchoolItem[]) => void;
}

export default function DriverSchoolsSection({
  driverId,
  initialSchools = [],
  editable = true,
  isOwner = false,
  onUpdate,
}: Props) {
  const [driverSchools, setDriverSchools] = useState<SchoolItem[]>(initialSchools);
  const [approvedSchools, setApprovedSchools] = useState<SchoolItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selected, setSelected] = useState<SchoolItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  // Request form
  const [showRequest, setShowRequest] = useState(false);
  const [reqName, setReqName] = useState("");
  const [reqEstate, setReqEstate] = useState("");
  const [reqNote, setReqNote] = useState("");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!editable) return;
    setLoadingList(true);
    axios
      .get<{ success: boolean; data: SchoolItem[] }>("/api/schools")
      .then((r) => setApprovedSchools(r.data.data))
      .catch(() => toast.error("Couldn't load schools list"))
      .finally(() => setLoadingList(false));
  }, [editable]);

  const handleAdd = async () => {
    if (!selected) return;
    if (driverSchools.some((s) => s._id === selected._id)) {
      toast.error("Already added");
      return;
    }
    setAdding(true);
    try {
      const res = await axios.post(
        `/api/drivers/${driverId}/schools`,
        { schoolId: selected._id },
        { withCredentials: true },
      );
      const updated: SchoolItem[] = res.data.data;
      setDriverSchools(updated);
      onUpdate?.(updated);
      setSelected(null);
      toast.success(`${selected.name} added!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to add school");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (schoolId: string) => {
    setRemoving(schoolId);
    try {
      const res = await axios.delete(
        `/api/drivers/${driverId}/schools/${schoolId}`,
        { withCredentials: true },
      );
      const updated: SchoolItem[] = res.data.data;
      setDriverSchools(updated);
      onUpdate?.(updated);
      toast.success("School removed");
    } catch {
      toast.error("Failed to remove school");
    } finally {
      setRemoving(null);
    }
  };

  const handleRequest = async () => {
    if (!reqName.trim() || !reqEstate.trim()) {
      toast.error("School name and estate are required");
      return;
    }
    setRequesting(true);
    try {
      await axios.post(
        "/api/schools/request",
        { name: reqName.trim(), estate: reqEstate.trim(), requestNote: reqNote.trim() },
        { withCredentials: true },
      );
      toast.success("Request sent! Admin will review it shortly.");
      setShowRequest(false);
      setReqName("");
      setReqEstate("");
      setReqNote("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to send request");
    } finally {
      setRequesting(false);
    }
  };

  // Read-only view
  if (!editable) {
    return (
      <Section>
        <SectionHeader>
          <SchoolIcon sx={{ color: colors.skyBlue }} />
          <SectionTitle>Schools Served{driverSchools.length > 0 ? ` (${driverSchools.length})` : ""}</SectionTitle>
        </SectionHeader>
        {driverSchools.length === 0 ? (
          <EmptyNotice>
            {isOwner
              ? "No schools added yet. Edit your profile to add the schools you serve — parents search by school!"
              : "This driver hasn't listed any schools yet."}
          </EmptyNotice>
        ) : (
          <ChipRow>
            {driverSchools.map((s) => (
              <SchoolChip key={s._id} label={`${s.name} · ${s.estate}`} />
            ))}
          </ChipRow>
        )}
      </Section>
    );
  }

  return (
    <Section>
      <SectionHeader>
        <SchoolIcon sx={{ color: colors.skyBlue }} />
        <SectionTitle>Schools Served</SectionTitle>
      </SectionHeader>

      {/* Current schools */}
      {driverSchools.length === 0 ? (
        <EmptyNotice>No schools added yet — add from the list below.</EmptyNotice>
      ) : (
        <SchoolList>
          {driverSchools.map((s) => (
            <SchoolRow key={s._id}>
              <SchoolInfo>
                <SchoolName>{s.name}</SchoolName>
                <SchoolEstate>{s.estate}</SchoolEstate>
              </SchoolInfo>
              <RemoveBtn
                onClick={() => handleRemove(s._id)}
                disabled={removing === s._id}
                title="Remove"
              >
                {removing === s._id ? (
                  <CircularProgress size={14} />
                ) : (
                  <RemoveCircleOutlineIcon fontSize="small" />
                )}
              </RemoveBtn>
            </SchoolRow>
          ))}
        </SchoolList>
      )}

      {/* Add from approved list */}
      <AddRow>
        <Autocomplete
          options={approvedSchools.filter((s) => !driverSchools.some((d) => d._id === s._id))}
          getOptionLabel={(o) => `${o.name} — ${o.estate}`}
          value={selected}
          onChange={(_, v) => setSelected(v)}
          loading={loadingList}
          size="small"
          sx={{ flex: 1, minWidth: 0 }}
          renderInput={(p) => (
            <TextField {...p} label="Add a school" placeholder="Search approved schools…" size="small" />
          )}
          noOptionsText="No more schools — request one below"
        />
        <AddBtn onClick={handleAdd} disabled={!selected || adding}>
          {adding ? <CircularProgress size={14} color="inherit" /> : (
            <><AddCircleOutlineIcon sx={{ fontSize: 15, mr: 0.5 }} /> Add</>
          )}
        </AddBtn>
      </AddRow>

      {/* Request a new school */}
      <RequestToggle onClick={() => setShowRequest((x) => !x)}>
        <SendIcon sx={{ fontSize: 14, color: colors.skyBlue, mr: 0.75 }} />
        {showRequest ? "Cancel request" : "School not in list? Request it"}
      </RequestToggle>

      <Collapse in={showRequest} unmountOnExit>
        <RequestForm>
          <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2, fontSize: "0.8rem" }}>
            Admin will review your request. Once approved it will appear in the dropdown.
          </Alert>
          <TwoCol>
            <TextField
              label="School Name"
              value={reqName}
              onChange={(e) => setReqName(e.target.value)}
              size="small"
              fullWidth
              placeholder="e.g. Nairobi Primary"
            />
            <TextField
              label="Estate / Area"
              value={reqEstate}
              onChange={(e) => setReqEstate(e.target.value)}
              size="small"
              fullWidth
              placeholder="e.g. Westlands"
            />
          </TwoCol>
          <TextField
            label="Additional note (optional)"
            value={reqNote}
            onChange={(e) => setReqNote(e.target.value)}
            size="small"
            fullWidth
            multiline
            rows={2}
            sx={{ mt: 1 }}
          />
          <RequestBtn onClick={handleRequest} disabled={requesting}>
            {requesting ? "Sending…" : "Send Request"}
          </RequestBtn>
        </RequestForm>
      </Collapse>
    </Section>
  );
}

/* ── Styles ── */

const Section = styled.div`
  margin-top: 4px;
`;

const SectionHeader = styled.div`
  display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
`;

const SectionTitle = styled.p`
  font-size: 0.95rem; font-weight: 700; color: ${colors.deepNavy}; margin: 0;
`;

const EmptyNotice = styled.p`
  font-size: 0.82rem; color: ${colors.mutedText}; font-style: italic; margin: 0 0 12px;
`;

const SchoolList = styled.div`
  display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;
`;

const SchoolRow = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border: 1px solid ${colors.border}; border-radius: 10px;
  background: ${colors.lightBg};
`;

const SchoolInfo = styled.div`flex: 1;`;
const SchoolName = styled.p`font-size: 0.875rem; font-weight: 600; color: ${colors.deepNavy}; margin: 0;`;
const SchoolEstate = styled.p`font-size: 0.75rem; color: ${colors.mutedText}; margin: 0;`;

const RemoveBtn = styled.button`
  background: none; border: none; cursor: pointer; padding: 2px;
  color: ${colors.mutedText};
  &:hover { color: ${colors.errorRed}; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const AddRow = styled.div`
  display: flex; gap: 10px; align-items: center; margin-bottom: 8px;
`;

const AddBtn = styled.button`
  display: flex; align-items: center; white-space: nowrap;
  padding: 7px 16px; border-radius: 50px; font-weight: 700; font-size: 0.8rem;
  cursor: pointer; background: ${colors.deepNavy}; color: #fff; border: none;
  &:hover:not(:disabled) { background: #0f2340; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const RequestToggle = styled.button`
  display: flex; align-items: center;
  background: none; border: none; cursor: pointer;
  font-size: 0.8rem; color: ${colors.skyBlue}; font-weight: 600;
  padding: 4px 0; margin-bottom: 4px;
  &:hover { text-decoration: underline; }
`;

const RequestForm = styled.div`
  padding: 14px 16px; border: 1px dashed ${colors.border}; border-radius: 12px;
  background: ${colors.lightBg}; display: flex; flex-direction: column; gap: 0;
`;

const TwoCol = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const RequestBtn = styled.button`
  align-self: flex-end; margin-top: 10px;
  padding: 8px 20px; border-radius: 50px; font-weight: 700; font-size: 0.82rem;
  cursor: pointer; background: ${colors.skyBlue}; color: #fff; border: none;
  &:hover:not(:disabled) { background: #2b87d1; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ChipRow = styled.div`
  display: flex; flex-wrap: wrap; gap: 8px;
`;

const SchoolChip = styled(Chip)`
  && {
    background: ${colors.lightBg};
    border: 1px solid ${colors.border};
    font-size: 0.8rem;
    font-weight: 600;
    color: ${colors.deepNavy};
  }
`;
