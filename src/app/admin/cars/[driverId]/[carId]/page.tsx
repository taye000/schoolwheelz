"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import styled from "styled-components";
import { Typography, CircularProgress, Chip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PersonIcon from "@mui/icons-material/Person";
import toast from "react-hot-toast";
import { colors } from "@/lib/theme";

interface ICarDoc {
  logbook?: string;
  insurance?: string;
  inspectionCert?: string;
  psvBadge?: string;
}

interface ICar {
  _id: string;
  vehicleType: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  regNumber: string;
  photo?: string;
  availableSeats: number;
  isActive: boolean;
  documents?: ICarDoc;
}

interface IDriver {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  verificationStatus: string;
  cars: ICar[];
}

export default function AdminCarDetailPage() {
  const { driverId, carId } = useParams<{ driverId: string; carId: string }>();
  const router = useRouter();
  const [driver, setDriver] = useState<IDriver | null>(null);
  const [car, setCar] = useState<ICar | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) return;
    axios
      .get(`/api/drivers/${driverId}`, { withCredentials: true })
      .then((res) => {
        if (res.data.success) {
          const d: IDriver = res.data.data;
          setDriver(d);
          const found = d.cars.find((c) => c._id === carId);
          setCar(found ?? null);
        }
      })
      .catch(() => toast.error("Could not load car details."))
      .finally(() => setLoading(false));
  }, [driverId, carId]);

  if (loading) return <Center><CircularProgress sx={{ color: colors.deepNavy }} /></Center>;
  if (!driver || !car) return <Center><Typography>Car not found.</Typography></Center>;

  const docs: { label: string; url?: string }[] = [
    { label: "Logbook", url: car.documents?.logbook },
    { label: "Insurance", url: car.documents?.insurance },
    { label: "Inspection Certificate", url: car.documents?.inspectionCert },
    { label: "PSV Badge", url: car.documents?.psvBadge },
  ];

  const allDocsUploaded = docs.every((d) => !!d.url);

  return (
    <PageWrapper>
      <BackBtn onClick={() => router.push(`/admin/drivers/${driverId}`)}>
        <ArrowBackIcon sx={{ fontSize: 17 }} /> Back to Driver
      </BackBtn>

      {/* Hero */}
      <HeroCard>
        <CarIcon>
          <DirectionsCarIcon sx={{ fontSize: 36, color: colors.skyBlue }} />
        </CarIcon>
        <HeroInfo>
          <Typography variant="h5" sx={{ fontWeight: 800, color: colors.deepNavy }}>
            {car.year} {car.make} {car.model}
            {car.color && <span style={{ color: colors.mutedText, fontWeight: 400, fontSize: "1rem" }}> · {car.color}</span>}
          </Typography>
          <Typography variant="body2" sx={{ color: colors.mutedText, fontFamily: "monospace", mt: 0.5 }}>
            {car.regNumber}
          </Typography>
          <ChipRow>
            <Chip size="small" label={car.vehicleType} variant="outlined" />
            <Chip size="small" label={`${car.availableSeats} seats`} variant="outlined" />
            {car.isActive
              ? <Chip size="small" label="Active Vehicle" color="success" />
              : <Chip size="small" label="Inactive" variant="outlined" />}
            {allDocsUploaded
              ? <Chip size="small" label="All Docs Uploaded" color="success" variant="outlined" />
              : <Chip size="small" label="Docs Incomplete" color="warning" variant="outlined" />}
          </ChipRow>
        </HeroInfo>
      </HeroCard>

      {/* Driver quick-link */}
      <Section>
        <SectionTitle>
          <PersonIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />
          Driver
        </SectionTitle>
        <DriverRow>
          <div>
            <Typography variant="body1" sx={{ fontWeight: 700, color: colors.deepNavy }}>{driver.fullName}</Typography>
            <Typography variant="caption" sx={{ color: colors.mutedText }}>{driver.email} · {driver.phoneNumber}</Typography>
          </div>
          <ViewBtn onClick={() => router.push(`/admin/drivers/${driverId}`)}>
            View Driver Profile
          </ViewBtn>
        </DriverRow>
      </Section>

      {/* Car photo */}
      {car.photo && (
        <Section>
          <SectionTitle>Vehicle Photo</SectionTitle>
          <CarPhoto src={car.photo} alt={`${car.make} ${car.model}`} />
        </Section>
      )}

      {/* Documents */}
      <Section>
        <SectionTitle>Vehicle Documents</SectionTitle>
        <DocList>
          {docs.map(({ label, url }) => (
            <DocRow key={label}>
              <DocLabel>{label}</DocLabel>
              {url ? (
                <DocLink href={url} target="_blank" rel="noopener noreferrer">
                  <OpenInNewIcon sx={{ fontSize: 13, mr: 0.5 }} />
                  View Document
                </DocLink>
              ) : (
                <DocMissing>Not uploaded</DocMissing>
              )}
            </DocRow>
          ))}
        </DocList>
      </Section>
    </PageWrapper>
  );
}

/* ─── Styled components ──────────────────────────────────────── */

const PageWrapper = styled.div`
  max-width: 760px; margin: 0 auto; padding: 36px 24px 80px;
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
  background: ${colors.pureWhite}; border: 1px solid ${colors.border};
  border-radius: 16px; padding: 28px; display: flex; align-items: center;
  gap: 20px; margin-bottom: 20px; flex-wrap: wrap;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const CarIcon = styled.div`
  width: 64px; height: 64px; border-radius: 14px;
  background: ${colors.skyBlue}12; display: flex; align-items: center; justify-content: center;
`;

const HeroInfo = styled.div`
  flex: 1; min-width: 0;
`;

const ChipRow = styled.div`
  display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;
`;

const Section = styled.div`
  background: ${colors.pureWhite}; border: 1px solid ${colors.border};
  border-radius: 14px; padding: 22px; margin-bottom: 18px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
`;

const SectionTitle = styled.p`
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em;
  text-transform: uppercase; color: ${colors.mutedText};
  margin: 0 0 14px; display: flex; align-items: center;
`;

const DriverRow = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
`;

const ViewBtn = styled.button`
  background: none; border: 1px solid ${colors.border};
  border-radius: 50px; padding: 6px 16px;
  font-size: 0.82rem; font-weight: 600; color: ${colors.deepNavy};
  cursor: pointer; transition: all 0.15s;
  &:hover { background: ${colors.deepNavy}; color: #fff; border-color: ${colors.deepNavy}; }
`;

const CarPhoto = styled.img`
  width: 100%; max-height: 280px; object-fit: cover;
  border-radius: 10px; border: 1px solid ${colors.border};
`;

const DocList = styled.div`
  display: flex; flex-direction: column; gap: 12px;
`;

const DocRow = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border: 1px solid ${colors.border};
  border-radius: 10px; background: ${colors.lightBg};
`;

const DocLabel = styled.span`
  font-size: 0.88rem; font-weight: 600; color: ${colors.slateCharcoal};
`;

const DocLink = styled.a`
  display: inline-flex; align-items: center;
  font-size: 0.82rem; color: ${colors.skyBlue}; font-weight: 600;
  text-decoration: none; padding: 5px 12px;
  border: 1px solid ${colors.skyBlue}40; border-radius: 8px;
  background: ${colors.skyBlue}0a; transition: background 0.15s;
  &:hover { background: ${colors.skyBlue}18; }
`;

const DocMissing = styled.span`
  font-size: 0.82rem; color: ${colors.errorRed}; font-style: italic;
`;
