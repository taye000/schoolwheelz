"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import styled from "styled-components";
import ProfileCard from "@/components/Profilecard";
import { Button, CircularProgress, Chip, Divider, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import LogoutIcon from "@mui/icons-material/Logout";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import { colors } from "@/lib/theme";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

interface User {
  _id: string;
  userType: "parent" | "driver";
  fullName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  photo?: string;
  sex?: string;
  carModel?: string;
  carRegNumber?: string;
  carPhoto?: string;
  children?: Array<{
    _id: string;
    name: string;
    age: number;
    grade: string;
    school: string;
    gender: string;
  }>;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [driverLocation, setDriverLocation] = useState({ lat: -3.745, lng: -38.523 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        if (data.success) setUser(data.user);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      /* ignore */
    }
  };

  if (loading)
    return (
      <LoadingWrap>
        <CircularProgress sx={{ color: colors.deepNavy }} />
        <LoadingText>Loading your profile…</LoadingText>
      </LoadingWrap>
    );

  if (error)
    return (
      <LoadingWrap>
        <EmptyEmoji>🚧</EmptyEmoji>
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.deepNavy }}>
          Something went wrong
        </Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, mb: 2 }}>
          We couldn’t load your profile. Check your connection and try again.
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </LoadingWrap>
    );

  if (!user)
    return (
      <LoadingWrap>
        <EmptyEmoji>🔑</EmptyEmoji>
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.deepNavy }}>
          You’re not signed in
        </Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, mb: 2 }}>
          Sign in to view and manage your profile.
        </Typography>
        <Button variant="contained" onClick={() => router.push("/login")}>
          Sign In
        </Button>
      </LoadingWrap>
    );

  return (
    <PageWrapper>
      <PageHeader>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.deepNavy }}>
            My Profile
          </Typography>
          <Typography variant="body2" sx={{ color: colors.mutedText }}>
            Manage your account details
          </Typography>
        </div>
        <Button
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ borderRadius: "50px", borderColor: colors.border, color: colors.mutedText }}
        >
          Sign Out
        </Button>
      </PageHeader>

      <ContentGrid>
        <LeftPane>
          {user.userType === "driver" ? (
            <ProfileCard
              _id={user._id}
              photo={user.photo || "/avatar.jpg"}
              fullName={user.fullName}
              phoneNumber={user.phoneNumber}
              sex={user.sex || ""}
              carModel={user.carModel || ""}
              carRegNumber={user.carRegNumber || ""}
              carPhoto={user.carPhoto || ""}
              rating={4.5}
              dob={""}
            />
          ) : (
            <ParentCard>
              <Typography variant="h5" sx={{ fontWeight: 700, color: colors.deepNavy, mb: 0.5 }}>
                {user.fullName}
              </Typography>
              <Chip label="Parent" size="small" sx={{ bgcolor: colors.mintCream, color: colors.deepNavy, fontWeight: 600, mb: 2 }} />
              <InfoRow><Label>Email</Label><Value>{user.email}</Value></InfoRow>
              <InfoRow><Label>Phone</Label><Value>{user.phoneNumber}</Value></InfoRow>
              {user.address && <InfoRow><Label>Address</Label><Value>{user.address}</Value></InfoRow>}

              {user.children && user.children.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <ChildrenHeader>
                    <ChildCareIcon sx={{ color: colors.mintCream, mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: colors.deepNavy }}>
                      Children ({user.children.length})
                    </Typography>
                  </ChildrenHeader>
                  {user.children.map((child, idx) => (
                    <ChildItem key={idx}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {child.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colors.mutedText }}>
                        {child.age} yrs · {child.gender} · {child.school}
                      </Typography>
                    </ChildItem>
                  ))}
                </>
              )}
            </ParentCard>
          )}
        </LeftPane>

        {user.userType === "driver" && (
          <RightPane>
            <MapWrap>
              <Map mode="profile" driverLocation={driverLocation} />
            </MapWrap>
          </RightPane>
        )}
      </ContentGrid>
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 24px;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 36px;
  flex-wrap: wrap;
  gap: 16px;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 28px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const LeftPane = styled.div``;
const RightPane = styled.div``;

const MapWrap = styled.div`
  height: 500px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid ${colors.border};
`;

const ParentCard = styled.div`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(26, 54, 93, 0.06);
`;

const InfoRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
`;

const Label = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${colors.mutedText};
  min-width: 70px;
  padding-top: 2px;
`;

const Value = styled.span`
  color: ${colors.slateCharcoal};
  font-weight: 500;
`;

const ChildrenHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const ChildItem = styled.div`
  padding: 12px 16px;
  background: ${colors.lightBg};
  border-radius: 10px;
  border: 1px solid ${colors.border};
  margin-bottom: 10px;
`;

const LoadingWrap = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  text-align: center;
  gap: 8px;
`;

const LoadingText = styled.p`
  font-size: 0.925rem;
  color: ${colors.mutedText};
  font-style: italic;
  margin-top: 8px;
`;

const EmptyEmoji = styled.div`
  font-size: 3.5rem;
  margin-bottom: 8px;
`;
