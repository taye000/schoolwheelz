"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import styled from "styled-components";
import {
  Typography,
  CircularProgress,
  Chip,
  Divider,
  Avatar,
  Button,
  TextField,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import toast from "react-hot-toast";
import { colors } from "@/lib/theme";

/* ─── Types ─────────────────────────────────────────────────── */

interface ICar {
  _id: string;
  vehicleType: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  regNumber: string;
  availableSeats: number;
  isActive: boolean;
  photo?: string;
  documents?: {
    logbook?: string;
    insurance?: string;
    inspectionCert?: string;
    psvBadge?: string;
  };
}

interface IDriver {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  photo?: string;
  sex: string;
  dob: string;
  address?: string;
  city?: string;
  county?: string;
  idNumber: string;
  licenseNumber: string;
  licenseExpiry?: string;
  verificationStatus: string;
  verificationNotes?: string;
  isValidated: boolean;
  isProfileActive: boolean;
  liveStatus: string;
  cars: ICar[];
  totalTrips: number;
  completedTrips: number;
  cancellations: number;
  averageRating: number;
  ratingCount: number;
  documents?: {
    idFront?: string;
    idBack?: string;
    licenseFront?: string;
    selfie?: string;
    goodConductCert?: string;
  };
  emergencyContact?: { name: string; relationship: string; phone: string };
  availability?: { days: string[]; morning: boolean; evening: boolean; areasServed: string[]; schoolsServed: string[] };
  createdAt: string;
}

/* ─── Page ───────────────────────────────────────────────────── */

export default function AdminDriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [driver, setDriver] = useState<IDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!id) return;
    axios
      .get(`/api/drivers/${id}`, { withCredentials: true })
      .then((res) => {
        if (res.data.success) {
          setDriver(res.data.data);
          setNotes(res.data.data.verificationNotes ?? "");
        }
      })
      .catch(() => toast.error("Could not load driver."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleValidate = async (status: "approved" | "rejected" | "suspended") => {
    setValidating(true);
    try {
      await axios.patch(
        `/api/admin/drivers/${id}/validate`,
        { status, notes: notes.trim() || undefined },
        { withCredentials: true }
      );
      toast.success(
        status === "approved" ? "Driver approved!" :
        status === "rejected" ? "Driver rejected." :
        "Driver suspended."
      );
      // Refresh
      const res = await axios.get(`/api/drivers/${id}`, { withCredentials: true });
      if (res.data.success) setDriver(res.data.data);
    } catch {
      toast.error("Action failed.");
    } finally {
      setValidating(false);
    }
  };

  if (loading) return <Center><CircularProgress sx={{ color: colors.deepNavy }} /></Center>;
  if (!driver) return <Center><Typography>Driver not found.</Typography></Center>;

  const statusColor = (s: string) =>
    s === "approved" ? colors.successGreen :
    s === "rejected" ? colors.errorRed :
    s === "suspended" ? colors.warningAmber :
    colors.mutedText;

  return (
    <PageWrapper>
      <BackBtn onClick={() => router.push("/admin")}>
        <ArrowBackIcon sx={{ fontSize: 17 }} /> Back to Admin
      </BackBtn>

      {/* ── Hero ── */}
      <HeroCard>
        <Avatar sx={{ width: 72, height: 72, bgcolor: colors.deepNavy, fontSize: 28 }}>
          {driver.photo
            ? <img src={driver.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            : driver.fullName[0]}
        </Avatar>
        <HeroInfo>
          <Typography variant="h5" sx={{ fontWeight: 800, color: colors.deepNavy }}>{driver.fullName}</Typography>
          <Typography variant="body2" sx={{ color: colors.mutedText }}>{driver.email} · {driver.phoneNumber}</Typography>
          <ChipRow>
            <Chip
              size="small"
              label={driver.verificationStatus}
              sx={{ bgcolor: `${statusColor(driver.verificationStatus)}18`, color: statusColor(driver.verificationStatus), fontWeight: 700, textTransform: "capitalize" }}
            />
            {driver.isProfileActive && <Chip size="small" label="Profile Active" color="success" />}
            <Chip size="small" label={driver.liveStatus} variant="outlined" sx={{ textTransform: "capitalize" }} />
          </ChipRow>
        </HeroInfo>
        <StatBadges>
          <StatBadge><StatNum>{driver.completedTrips}</StatNum><StatLabel>Trips</StatLabel></StatBadge>
          <StatBadge><StatNum>{driver.averageRating > 0 ? driver.averageRating.toFixed(1) : "—"}</StatNum><StatLabel>Rating</StatLabel></StatBadge>
          <StatBadge><StatNum>{driver.cancellations}</StatNum><StatLabel>Cancelled</StatLabel></StatBadge>
        </StatBadges>
      </HeroCard>

      <TwoCol>
        {/* ── Left column ── */}
        <div>
          {/* Personal info */}
          <Section>
            <SectionTitle>Personal Information</SectionTitle>
            <InfoGrid>
              <InfoRow label="Date of Birth" value={driver.dob ? new Date(driver.dob).toLocaleDateString("en-GB") : "—"} />
              <InfoRow label="Sex" value={driver.sex} />
              <InfoRow label="Address" value={[driver.address, driver.city, driver.county].filter(Boolean).join(", ") || "—"} />
              <InfoRow label="Registered" value={new Date(driver.createdAt).toLocaleDateString("en-GB")} />
            </InfoGrid>
          </Section>

          {/* Identity */}
          <Section>
            <SectionTitle>Identity & Licence</SectionTitle>
            <InfoGrid>
              <InfoRow label="ID Number" value={driver.idNumber} mono />
              <InfoRow label="Licence Number" value={driver.licenseNumber} mono />
              <InfoRow label="Licence Expiry" value={driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString("en-GB") : "—"} />
            </InfoGrid>
          </Section>

          {/* Emergency contact */}
          {driver.emergencyContact && (
            <Section>
              <SectionTitle>Emergency Contact</SectionTitle>
              <InfoGrid>
                <InfoRow label="Name" value={driver.emergencyContact.name} />
                <InfoRow label="Relationship" value={driver.emergencyContact.relationship} />
                <InfoRow label="Phone" value={driver.emergencyContact.phone} />
              </InfoGrid>
            </Section>
          )}

          {/* Availability */}
          {driver.availability && (
            <Section>
              <SectionTitle>Availability</SectionTitle>
              <InfoGrid>
                <InfoRow label="Days" value={driver.availability.days.join(", ") || "—"} />
                <InfoRow label="Morning" value={driver.availability.morning ? "Yes" : "No"} />
                <InfoRow label="Evening" value={driver.availability.evening ? "Yes" : "No"} />
                <InfoRow label="Areas Served" value={driver.availability.areasServed.join(", ") || "—"} />
                <InfoRow label="Schools Served" value={driver.availability.schoolsServed.join(", ") || "—"} />
              </InfoGrid>
            </Section>
          )}
        </div>

        {/* ── Right column ── */}
        <div>
          {/* Documents */}
          <Section>
            <SectionTitle>Uploaded Documents</SectionTitle>
            {driver.documents ? (
              <DocGrid>
                <DocItem label="ID Front" url={driver.documents.idFront} />
                <DocItem label="ID Back" url={driver.documents.idBack} />
                <DocItem label="Licence" url={driver.documents.licenseFront} />
                <DocItem label="Selfie" url={driver.documents.selfie} />
                <DocItem label="Good Conduct" url={driver.documents.goodConductCert} />
              </DocGrid>
            ) : (
              <NoDoc>No documents uploaded yet.</NoDoc>
            )}
          </Section>

          {/* Cars */}
          <Section>
            <SectionTitle>Vehicles ({driver.cars.length})</SectionTitle>
            {driver.cars.length === 0 ? (
              <NoDoc>No vehicles added.</NoDoc>
            ) : (
              driver.cars.map((car) => (
                <CarCard key={car._id}>
                  <CarTop>
                    <DirectionsCarIcon sx={{ color: colors.skyBlue, mr: 1.5 }} />
                    <div>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: colors.deepNavy }}>
                        {car.year} {car.make} {car.model}
                        {car.color && <span style={{ color: colors.mutedText, fontWeight: 400 }}> · {car.color}</span>}
                      </Typography>
                      <Typography variant="caption" sx={{ color: colors.mutedText, fontFamily: "monospace" }}>
                        {car.regNumber} · {car.availableSeats} seats · {car.vehicleType}
                      </Typography>
                    </div>
                    {car.isActive
                      ? <Chip size="small" label="Active" color="success" sx={{ ml: "auto" }} />
                      : <Chip size="small" label="Inactive" variant="outlined" sx={{ ml: "auto" }} />}
                  </CarTop>
                  {car.documents && (
                    <CarDocs>
                      <DocItem label="Logbook" url={car.documents.logbook} />
                      <DocItem label="Insurance" url={car.documents.insurance} />
                      <DocItem label="Inspection" url={car.documents.inspectionCert} />
                      <DocItem label="PSV Badge" url={car.documents.psvBadge} />
                    </CarDocs>
                  )}
                </CarCard>
              ))
            )}
          </Section>

          {/* Validation panel */}
          <Section>
            <SectionTitle>Verification Decision</SectionTitle>
            <TextField
              label="Notes / Reason (shown to driver on rejection)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              rows={3}
              size="small"
              sx={{ mb: 2 }}
            />
            <ActionRow>
              <Tooltip title="Approve this driver">
                <span>
                  <ActionBtn
                    color="approve"
                    disabled={validating || driver.verificationStatus === "approved"}
                    onClick={() => handleValidate("approved")}
                  >
                    {validating ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <><CheckCircleIcon sx={{ fontSize: 16, mr: 0.75 }} />Approve</>}
                  </ActionBtn>
                </span>
              </Tooltip>
              <Tooltip title="Reject this driver">
                <span>
                  <ActionBtn
                    color="reject"
                    disabled={validating || driver.verificationStatus === "rejected"}
                    onClick={() => handleValidate("rejected")}
                  >
                    {validating ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <><CancelIcon sx={{ fontSize: 16, mr: 0.75 }} />Reject</>}
                  </ActionBtn>
                </span>
              </Tooltip>
              <Tooltip title="Suspend this driver">
                <span>
                  <ActionBtn
                    color="suspend"
                    disabled={validating || driver.verificationStatus === "suspended"}
                    onClick={() => handleValidate("suspended")}
                  >
                    {validating ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <><PauseCircleIcon sx={{ fontSize: 16, mr: 0.75 }} />Suspend</>}
                  </ActionBtn>
                </span>
              </Tooltip>
            </ActionRow>
            {driver.verificationNotes && (
              <NotesBanner>{driver.verificationNotes}</NotesBanner>
            )}
          </Section>
        </div>
      </TwoCol>
    </PageWrapper>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <InfoRowWrap>
      <InfoLabel>{label}</InfoLabel>
      <InfoValue style={{ fontFamily: mono ? "monospace" : undefined }}>{value}</InfoValue>
    </InfoRowWrap>
  );
}

function DocItem({ label, url }: { label: string; url?: string }) {
  return (
    <DocItemWrap>
      {url ? (
        <DocLink href={url} target="_blank" rel="noopener noreferrer">
          <OpenInNewIcon sx={{ fontSize: 13, mr: 0.5 }} />
          {label}
        </DocLink>
      ) : (
        <DocMissing>{label}: not uploaded</DocMissing>
      )}
    </DocItemWrap>
  );
}

/* ─── Styled components ──────────────────────────────────────── */

const PageWrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 36px 24px 80px;
`;

const Center = styled.div`
  display: flex; align-items: center; justify-content: center; min-height: 60vh;
`;

const BackBtn = styled.button`
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: 1px solid ${colors.border};
  padding: 7px 16px; border-radius: 50px;
  color: ${colors.deepNavy}; font-weight: 600; font-size: 0.85rem;
  cursor: pointer; margin-bottom: 28px; transition: all 0.2s;
  &:hover { background: ${colors.deepNavy}; color: #fff; border-color: ${colors.deepNavy}; }
`;

const HeroCard = styled.div`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 16px;
  padding: 28px;
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 28px;
  flex-wrap: wrap;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const HeroInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ChipRow = styled.div`
  display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;
`;

const StatBadges = styled.div`
  display: flex; gap: 24px;
`;

const StatBadge = styled.div`
  text-align: center;
`;

const StatNum = styled.div`
  font-size: 1.4rem;
  font-weight: 800;
  color: ${colors.deepNavy};
  line-height: 1;
`;

const StatLabel = styled.div`
  font-size: 0.72rem;
  color: ${colors.mutedText};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 3px;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  @media (max-width: 800px) { grid-template-columns: 1fr; }
`;

const Section = styled.div`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 14px;
  padding: 22px;
  margin-bottom: 18px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
`;

const SectionTitle = styled.p`
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${colors.mutedText};
  margin: 0 0 14px;
`;

const InfoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const InfoRowWrap = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
`;

const InfoLabel = styled.span`
  font-size: 0.8rem;
  color: ${colors.mutedText};
  white-space: nowrap;
`;

const InfoValue = styled.span`
  font-size: 0.88rem;
  font-weight: 600;
  color: ${colors.slateCharcoal};
  text-align: right;
`;

const DocGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DocItemWrap = styled.div``;

const DocLink = styled.a`
  display: inline-flex;
  align-items: center;
  font-size: 0.83rem;
  color: ${colors.skyBlue};
  font-weight: 600;
  text-decoration: none;
  padding: 5px 12px;
  border: 1px solid ${colors.skyBlue}40;
  border-radius: 8px;
  background: ${colors.skyBlue}0a;
  transition: background 0.15s;
  &:hover { background: ${colors.skyBlue}18; }
`;

const DocMissing = styled.span`
  font-size: 0.8rem;
  color: ${colors.mutedText};
  font-style: italic;
`;

const NoDoc = styled.p`
  font-size: 0.85rem;
  color: ${colors.mutedText};
  font-style: italic;
  margin: 0;
`;

const CarCard = styled.div`
  border: 1px solid ${colors.border};
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;
`;

const CarTop = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const CarDocs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid ${colors.border};
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const ActionBtn = styled.button<{ color: "approve" | "reject" | "suspend"; disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  border: none;
  border-radius: 50px;
  padding: 9px 20px;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
  transition: opacity 0.2s;
  background: ${({ color }) =>
    color === "approve" ? colors.successGreen :
    color === "reject" ? colors.errorRed :
    colors.warningAmber};
  color: #fff;
  &:hover:not(:disabled) { opacity: 0.88; }
`;

const NotesBanner = styled.div`
  margin-top: 14px;
  background: ${colors.lightBg};
  border: 1px solid ${colors.border};
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 0.83rem;
  color: ${colors.slateCharcoal};
  font-style: italic;
`;
