"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import styled from "styled-components";
import { Typography, CircularProgress, Avatar, Chip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import PersonPinCircleIcon from "@mui/icons-material/PersonPinCircle";
import SchoolIcon from "@mui/icons-material/School";
import FavoriteIcon from "@mui/icons-material/Favorite";
import toast from "react-hot-toast";
import { colors } from "@/lib/theme";

interface IChild {
  _id: string;
  name: string;
  age: number;
  school: string;
  gender: string;
  pickupLocation?: { lat: number; lng: number };
  dropoffLocation?: { lat: number; lng: number };
}

interface IParent {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  userType: string;
  children: IChild[];
  favoriteDrivers?: string[];
  createdAt: string;
}

export default function AdminParentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [parent, setParent] = useState<IParent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    axios
      .get(`/api/parents/${id}`, { withCredentials: true })
      .then((res) => { if (res.data.success) setParent(res.data.data); })
      .catch(() => toast.error("Could not load parent."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Center><CircularProgress sx={{ color: colors.deepNavy }} /></Center>;
  if (!parent) return <Center><Typography>Parent not found.</Typography></Center>;

  return (
    <PageWrapper>
      <BackBtn onClick={() => router.push("/admin")}>
        <ArrowBackIcon sx={{ fontSize: 17 }} /> Back to Admin
      </BackBtn>

      {/* Hero */}
      <HeroCard>
        <Avatar sx={{ width: 64, height: 64, bgcolor: colors.skyBlue, fontSize: 24 }}>
          {parent.fullName[0]}
        </Avatar>
        <HeroInfo>
          <Typography variant="h5" sx={{ fontWeight: 800, color: colors.deepNavy }}>{parent.fullName}</Typography>
          <Typography variant="body2" sx={{ color: colors.mutedText }}>{parent.email} · {parent.phoneNumber}</Typography>
          {parent.address && (
            <Typography variant="body2" sx={{ color: colors.mutedText, mt: 0.5 }}>{parent.address}</Typography>
          )}
          <ChipRow>
            <Chip size="small" label="Parent" sx={{ bgcolor: `${colors.skyBlue}18`, color: colors.skyBlue, fontWeight: 700 }} />
            <Chip size="small" label={`${parent.children.length} child${parent.children.length !== 1 ? "ren" : ""}`} variant="outlined" />
            {parent.favoriteDrivers && parent.favoriteDrivers.length > 0 && (
              <Chip
                size="small"
                icon={<FavoriteIcon sx={{ fontSize: 13 }} />}
                label={`${parent.favoriteDrivers.length} favourite driver${parent.favoriteDrivers.length !== 1 ? "s" : ""}`}
                variant="outlined"
                color="error"
              />
            )}
          </ChipRow>
        </HeroInfo>
        <RegDate>
          <Label>Registered</Label>
          <Value>{new Date(parent.createdAt).toLocaleDateString("en-GB")}</Value>
        </RegDate>
      </HeroCard>

      {/* Children */}
      <Section>
        <SectionTitle>
          <ChildCareIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />
          Children ({parent.children.length})
        </SectionTitle>

        {parent.children.length === 0 ? (
          <NoData>No children added yet.</NoData>
        ) : (
          <ChildGrid>
            {parent.children.map((child, idx) => (
              <ChildCard key={child._id}>
                <ChildHeader>
                  <ChildNum>{idx + 1}</ChildNum>
                  <div>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: colors.deepNavy }}>
                      {child.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.mutedText }}>
                      {child.age} yrs · {child.gender}
                    </Typography>
                  </div>
                  <SchoolBadge>
                    <SchoolIcon sx={{ fontSize: 13, mr: 0.4 }} />
                    {child.school}
                  </SchoolBadge>
                </ChildHeader>

                {(child.pickupLocation || child.dropoffLocation) && (
                  <LocRow>
                    {child.pickupLocation && (
                      <LocTag>
                        <PersonPinCircleIcon sx={{ fontSize: 13, color: colors.skyBlue }} />
                        Pickup: {child.pickupLocation.lat.toFixed(5)}, {child.pickupLocation.lng.toFixed(5)}
                      </LocTag>
                    )}
                    {child.dropoffLocation && (
                      <LocTag>
                        <SchoolIcon sx={{ fontSize: 13, color: colors.mintCream }} />
                        Drop-off: {child.dropoffLocation.lat.toFixed(5)}, {child.dropoffLocation.lng.toFixed(5)}
                      </LocTag>
                    )}
                  </LocRow>
                )}
              </ChildCard>
            ))}
          </ChildGrid>
        )}
      </Section>
    </PageWrapper>
  );
}

/* ─── Styled components ──────────────────────────────────────── */

const PageWrapper = styled.div`
  max-width: 900px; margin: 0 auto; padding: 36px 24px 80px;
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
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const HeroInfo = styled.div`
  flex: 1; min-width: 0;
`;

const ChipRow = styled.div`
  display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;
`;

const RegDate = styled.div`
  text-align: right;
`;

const Label = styled.div`
  font-size: 0.72rem; color: ${colors.mutedText}; text-transform: uppercase; letter-spacing: 0.06em;
`;

const Value = styled.div`
  font-size: 0.9rem; font-weight: 700; color: ${colors.deepNavy};
`;

const Section = styled.div`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
`;

const SectionTitle = styled.p`
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em;
  text-transform: uppercase; color: ${colors.mutedText};
  margin: 0 0 16px; display: flex; align-items: center;
`;

const NoData = styled.p`
  font-size: 0.85rem; color: ${colors.mutedText}; font-style: italic; margin: 0;
`;

const ChildGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
`;

const ChildCard = styled.div`
  border: 1px solid ${colors.border};
  border-radius: 10px;
  padding: 14px;
  background: ${colors.lightBg};
`;

const ChildHeader = styled.div`
  display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px;
`;

const ChildNum = styled.div`
  width: 26px; height: 26px; min-width: 26px;
  border-radius: 50%; background: ${colors.deepNavy}; color: #fff;
  font-size: 0.78rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  margin-top: 2px;
`;

const SchoolBadge = styled.span`
  display: inline-flex; align-items: center;
  font-size: 0.75rem; color: ${colors.mutedText};
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 6px; padding: 3px 8px; margin-left: auto;
  white-space: nowrap;
`;

const LocRow = styled.div`
  display: flex; flex-direction: column; gap: 5px;
`;

const LocTag = styled.span`
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.72rem; color: ${colors.mutedText};
`;
