"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import styled from "styled-components";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import FlagIcon from "@mui/icons-material/Flag";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import axios from "axios";
import toast from "react-hot-toast";
import { colors } from "@/lib/theme";

interface IChild {
  _id: string;
  name: string;
  age: number;
  school: string;
  gender: string;
  pickedUp?: boolean;
  driverNote?: string;
  driverRating?: number;
}

interface IBooking {
  _id: string;
  status: string;
  arrivedAt?: string | null;
  children: IChild[];
}

interface Props {
  booking: IBooking;
  onBookingUpdate: (updated: Partial<IBooking>) => void;
}

function elapsed(since: Date): string {
  const secs = Math.floor((Date.now() - since.getTime()) / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TripJourneyPanel({ booking, onBookingUpdate }: Props) {
  const { _id: bookingId, status, arrivedAt, children } = booking;

  // Boarding state
  const [boardedIds, setBoardedIds] = useState<Set<string>>(
    new Set(children.filter((c) => c.pickedUp).map((c) => c._id)),
  );

  // Loading states
  const [arriving, setArriving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);

  // Timer
  const [tripStart] = useState(new Date());
  const [timerDisplay, setTimerDisplay] = useState("0:00");

  // Driver notes phase
  const [notesSaved, setNotesSaved] = useState(
    children.some((c) => c.driverNote !== undefined),
  );
  const [savingNotes, setSavingNotes] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(children.map((c) => [c._id, c.driverNote ?? ""])),
  );
  const [ratings, setRatings] = useState<Record<string, number>>(
    Object.fromEntries(children.map((c) => [c._id, c.driverRating ?? 0])),
  );

  // Timer tick when in_progress
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (status === "in_progress") {
      intervalRef.current = setInterval(
        () => setTimerDisplay(elapsed(tripStart)),
        1000,
      );
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [status, tripStart]);

  // GPS tracking when in_progress
  const trackRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (status !== "in_progress") return;
    const push = () => {
      navigator.geolocation?.getCurrentPosition((pos) => {
        axios
          .patch(`/api/bookings/${bookingId}/track`, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }, { withCredentials: true })
          .catch(() => {});
      });
    };
    push();
    trackRef.current = setInterval(push, 15_000);
    return () => { if (trackRef.current) clearInterval(trackRef.current); };
  }, [status, bookingId]);

  /* ── Handlers ── */

  const handleArrive = async () => {
    setArriving(true);
    try {
      const res = await axios.post(`/api/bookings/${bookingId}/arrive`, {}, { withCredentials: true });
      toast.success("Parent notified — you've arrived!");
      onBookingUpdate({ arrivedAt: res.data.data.arrivedAt });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to mark arrival.");
    } finally {
      setArriving(false);
    }
  };

  const toggleBoarded = (childId: string) => {
    setBoardedIds((prev) => {
      const next = new Set(prev);
      next.has(childId) ? next.delete(childId) : next.add(childId);
      return next;
    });
  };

  const handleStartTrip = async () => {
    setStarting(true);
    try {
      await axios.post(
        `/api/bookings/${bookingId}/start`,
        { boardedChildIds: Array.from(boardedIds) },
        { withCredentials: true },
      );
      toast.success("Trip started! Parent can now track you.");
      onBookingUpdate({ status: "in_progress" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to start trip.");
    } finally {
      setStarting(false);
    }
  };

  const handleEndTrip = async () => {
    setEnding(true);
    try {
      // Capture driver's current GPS position at the moment of trip completion
      let finalLocation: { lat: number; lng: number } | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 6000,
          })
        );
        finalLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch {
        // GPS unavailable — proceed without location, don't block trip completion
      }

      await axios.post(
        `/api/bookings/${bookingId}/complete`,
        finalLocation ? { lat: finalLocation.lat, lng: finalLocation.lng } : {},
        { withCredentials: true },
      );
      toast.success("Trip completed! Parent notified.");
      onBookingUpdate({ status: "completed" });
      setConfirmEnd(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to end trip.");
    } finally {
      setEnding(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const payload = children.map((c) => ({
        childId: c._id,
        note: notes[c._id] || undefined,
        rating: ratings[c._id] || undefined,
      }));
      await axios.patch(`/api/bookings/${bookingId}/driver-notes`, { notes: payload }, { withCredentials: true });
      toast.success("Notes saved.");
      setNotesSaved(true);
    } catch {
      toast.error("Failed to save notes.");
    } finally {
      setSavingNotes(false);
    }
  };

  /* ── Render phases ── */

  // Phase: completed + notes saved
  if (status === "completed" && notesSaved) {
    return (
      <Panel>
        <CompleteBadge>
          <CheckCircleIcon sx={{ fontSize: 28, color: colors.successGreen }} />
          <span>Trip Complete</span>
        </CompleteBadge>
      </Panel>
    );
  }

  // Phase: completed — optional driver notes
  if (status === "completed") {
    return (
      <Panel>
        <NotesSectionHeader>
          <PanelTitle style={{ margin: 0 }}>Post-Trip Notes</PanelTitle>
          <NotesSectionHint>Optional · helps future drivers &amp; keeps parents informed</NotesSectionHint>
        </NotesSectionHeader>
        {children.map((child) => (
          <ChildNoteCard key={child._id}>
            <ChildNoteHeader>
              <ChildNoteName>{child.name}</ChildNoteName>
              <StarGroup>
                <StarRowLabel>Rating</StarRowLabel>
                <StarRow aria-label={`Rate ${child.name}`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <StarBtn key={n} onClick={() => setRatings((r) => ({ ...r, [child._id]: n }))}>
                      {ratings[child._id] >= n
                        ? <StarIcon sx={{ fontSize: 22, color: "#F6AD55" }} />
                        : <StarBorderIcon sx={{ fontSize: 22, color: "#CBD5E0" }} />}
                    </StarBtn>
                  ))}
                  {ratings[child._id] > 0 && (
                    <RatingLabel>{ratings[child._id]}.0</RatingLabel>
                  )}
                </StarRow>
              </StarGroup>
            </ChildNoteHeader>
            <NoteInput
              placeholder="e.g. well-behaved, left water bottle in car…"
              value={notes[child._id] ?? ""}
              onChange={(e) => setNotes((n) => ({ ...n, [child._id]: e.target.value }))}
              maxLength={300}
            />
          </ChildNoteCard>
        ))}
        <NoteActions>
          <SkipBtn onClick={() => setNotesSaved(true)}>Skip</SkipBtn>
          <SaveNotesBtn onClick={handleSaveNotes} disabled={savingNotes}>
            {savingNotes ? "Saving…" : "Save"}
          </SaveNotesBtn>
        </NoteActions>
      </Panel>
    );
  }

  // Phase: in_progress — show timer + End Trip
  if (status === "in_progress") {
    return (
      <Panel accent>
        <PanelTitle style={{ color: "#fff" }}>Trip in Progress</PanelTitle>
        <TimerRow>
          <TimerIcon><DirectionsCarIcon sx={{ fontSize: 22 }} /></TimerIcon>
          <TimerDisplay>{timerDisplay}</TimerDisplay>
          <TimerLabel>elapsed</TimerLabel>
        </TimerRow>
        <EndTripBtn onClick={() => setConfirmEnd(true)}>
          <FlagIcon sx={{ fontSize: 18 }} />
          End Trip
        </EndTripBtn>

        <Dialog open={confirmEnd} onClose={() => setConfirmEnd(false)}>
          <DialogTitle sx={{ fontWeight: 700 }}>End the trip?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will mark all children as safely dropped off and notify the parent.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setConfirmEnd(false)} disabled={ending}>Not yet</Button>
            <Button
              onClick={handleEndTrip}
              variant="contained"
              disabled={ending}
              sx={{ borderRadius: "50px", fontWeight: 700, bgcolor: colors.successGreen }}
            >
              {ending ? "Ending…" : "Yes, End Trip"}
            </Button>
          </DialogActions>
        </Dialog>
      </Panel>
    );
  }

  // Phase: arrived — show boarding checklist + Start Trip
  if (arrivedAt) {
    return (
      <Panel>
        <PanelTitle>Mark children as they board</PanelTitle>
        <BoardingList>
          {children.map((child) => {
            const on = boardedIds.has(child._id);
            return (
              <BoardingRow key={child._id} active={on} onClick={() => toggleBoarded(child._id)}>
                {on
                  ? <CheckCircleIcon sx={{ fontSize: 22, color: colors.successGreen }} />
                  : <RadioButtonUncheckedIcon sx={{ fontSize: 22, color: colors.border }} />}
                <BoardingChild>
                  <BoardingName>{child.name}</BoardingName>
                  <BoardingMeta>{child.age}y · {child.school}</BoardingMeta>
                </BoardingChild>
              </BoardingRow>
            );
          })}
        </BoardingList>
        <StartTripBtn onClick={handleStartTrip} disabled={starting}>
          <DirectionsCarIcon sx={{ fontSize: 18 }} />
          {starting ? "Starting…" : "Start Trip →"}
        </StartTripBtn>
        <StartTripHint>You can start even if not all children have boarded.</StartTripHint>
      </Panel>
    );
  }

  // Phase: accepted, not arrived yet
  return (
    <Panel>
      <ArriveBtn onClick={handleArrive} disabled={arriving}>
        <DirectionsCarIcon sx={{ fontSize: 20 }} />
        {arriving ? "Notifying parent…" : "I've Arrived at Pickup"}
      </ArriveBtn>
      <ArriveHint>Parent receives an SMS when you tap this.</ArriveHint>
    </Panel>
  );
}

/* ── Styled ── */

const Panel = styled.div<{ accent?: boolean }>`
  border-radius: 16px;
  padding: 22px 24px;
  border: 1px solid ${({ accent }) => accent ? "transparent" : colors.border};
  background: ${({ accent }) => accent
    ? `linear-gradient(135deg, ${colors.deepNavy} 0%, #2a4a7f 100%)`
    : colors.pureWhite};
  display: flex; flex-direction: column; gap: 14px;
`;

const PanelTitle = styled.p`
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1px; color: ${colors.mutedText}; margin: 0;
`;

/* Arrive */
const ArriveBtn = styled.button`
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 16px; border-radius: 14px; font-weight: 700; font-size: 1rem;
  cursor: pointer; border: none; width: 100%; transition: all 0.2s;
  background: ${colors.deepNavy}; color: #fff;
  &:hover:not(:disabled) { background: #0f2340; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const ArriveHint = styled.p`
  font-size: 0.78rem; color: ${colors.mutedText}; margin: 0; text-align: center;
`;

/* Boarding */
const BoardingList = styled.div`
  display: flex; flex-direction: column; gap: 8px;
`;

const BoardingRow = styled.div<{ active: boolean }>`
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: 12px; cursor: pointer;
  border: 1.5px solid ${({ active }) => active ? colors.successGreen : colors.border};
  background: ${({ active }) => active ? colors.successGreen + "10" : colors.lightBg};
  transition: all 0.15s;
  &:hover { border-color: ${colors.successGreen}; }
`;

const BoardingChild = styled.div`flex: 1;`;
const BoardingName = styled.p`font-size: 0.9rem; font-weight: 700; color: ${colors.deepNavy}; margin: 0;`;
const BoardingMeta = styled.p`font-size: 0.76rem; color: ${colors.mutedText}; margin: 0;`;

const StartTripBtn = styled.button`
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px; border-radius: 50px; font-weight: 700; font-size: 0.95rem;
  cursor: pointer; border: none; width: 100%; transition: all 0.2s;
  background: ${colors.successGreen}; color: #fff;
  &:hover:not(:disabled) { background: #276749; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const StartTripHint = styled.p`
  font-size: 0.76rem; color: ${colors.mutedText}; margin: 0; text-align: center;
`;

/* Timer */
const TimerRow = styled.div`
  display: flex; align-items: center; gap: 12px;
`;

const TimerIcon = styled.div`
  width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center; color: #fff;
`;

const TimerDisplay = styled.span`
  font-size: 2rem; font-weight: 800; color: #fff; font-variant-numeric: tabular-nums;
`;

const TimerLabel = styled.span`
  font-size: 0.8rem; color: rgba(255,255,255,0.65); font-weight: 600;
`;

const EndTripBtn = styled.button`
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px; border-radius: 50px; font-weight: 700; font-size: 0.95rem;
  cursor: pointer; border: none; width: 100%; transition: all 0.2s;
  background: rgba(255,255,255,0.15); color: #fff;
  &:hover { background: rgba(255,255,255,0.25); }
`;

/* Completed */
const CompleteBadge = styled.div`
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 16px; border-radius: 12px;
  background: ${colors.successGreen}10; border: 1px solid ${colors.successGreen}40;
  font-size: 1rem; font-weight: 700; color: ${colors.successGreen};
`;

/* Notes */
const NotesSectionHeader = styled.div`
  display: flex; flex-direction: column; gap: 2px;
`;
const NotesSectionHint = styled.p`
  font-size: 0.73rem; color: ${colors.mutedText}; margin: 0; font-style: italic;
`;

const ChildNoteCard = styled.div`
  background: ${colors.lightBg}; border: 1px solid ${colors.border};
  border-radius: 12px; padding: 14px;
  display: flex; flex-direction: column; gap: 10px;
`;

const ChildNoteHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;
`;
const ChildNoteName = styled.p`font-size: 0.92rem; font-weight: 700; color: ${colors.deepNavy}; margin: 0;`;

const StarGroup = styled.div`display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0;`;
const StarRowLabel = styled.span`font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.mutedText};`;
const StarRow = styled.div`display: flex; gap: 1px; align-items: center;`;
const StarBtn = styled.button`background: none; border: none; cursor: pointer; padding: 1px; line-height: 0;`;
const RatingLabel = styled.span`
  font-size: 0.75rem; font-weight: 700; color: #B7791F; margin-left: 5px;
`;

const NoteInput = styled.textarea`
  width: 100%; box-sizing: border-box;
  border: 1px solid ${colors.border}; border-radius: 8px;
  padding: 8px 10px; font-size: 0.82rem; color: ${colors.deepNavy};
  resize: none; font-family: inherit; background: ${colors.pureWhite};
  min-height: 60px; line-height: 1.5;
  &:focus { outline: none; border-color: ${colors.skyBlue}; }
  &::placeholder { color: ${colors.mutedText}; }
`;

const NoteActions = styled.div`display: flex; gap: 10px; justify-content: flex-end;`;

const SkipBtn = styled.button`
  padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 0.875rem;
  cursor: pointer; background: none; border: 1px solid ${colors.border}; color: ${colors.mutedText};
  &:hover { border-color: ${colors.deepNavy}; color: ${colors.deepNavy}; }
`;

const SaveNotesBtn = styled.button`
  padding: 10px 24px; border-radius: 50px; font-weight: 700; font-size: 0.875rem;
  cursor: pointer; background: ${colors.deepNavy}; color: #fff; border: none;
  &:hover:not(:disabled) { background: #0f2340; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;
