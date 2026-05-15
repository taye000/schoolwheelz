"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import styled from "styled-components";
import ProfileCard from "@/components/Profilecard";
import {
  Button,
  CircularProgress,
  Chip,
  Divider,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  Collapse,
  Alert,
} from "@mui/material";
import { useRouter } from "next/navigation";
import LogoutIcon from "@mui/icons-material/Logout";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import RoomIcon from "@mui/icons-material/Room";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import PhoneInput from "@/components/PhoneInput";
import toast from "react-hot-toast";
import { colors } from "@/lib/theme";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

interface ChildLocation {
  lat: number;
  lng: number;
}

interface Child {
  _id?: string;
  name: string;
  age: number;
  school: string;
  gender: string;
  pickupLocation?: ChildLocation;
  dropoffLocation?: ChildLocation;
}

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
  children?: Child[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [driverLocation, setDriverLocation] = useState({ lat: -1.2921, lng: 36.8219 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<User> & { children?: Child[] }>({});
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  // Per-child map visibility
  const [childMapOpen, setChildMapOpen] = useState<boolean[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          setChildMapOpen(Array(data.user.children?.length ?? 0).fill(false));
        } else {
          setError(true);
        }
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
        (pos) => setDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const startEditing = () => {
    if (!user) return;
    setEditData({
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      address: user.address ?? "",
      children: user.children ? JSON.parse(JSON.stringify(user.children)) : [],
    });
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMismatch(false);
    setChildMapOpen(Array(user.children?.length ?? 0).fill(false));
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditData({});
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: "new" | "confirm", value: string) => {
    if (field === "new") setNewPassword(value);
    if (field === "confirm") setConfirmPassword(value);
    const pw = field === "new" ? value : newPassword;
    const cpw = field === "confirm" ? value : confirmPassword;
    setPasswordMismatch(cpw.length > 0 && pw !== cpw);
  };

  const handleChildFieldChange = (idx: number, field: keyof Child, value: string) => {
    setEditData((prev) => {
      const children = [...(prev.children ?? [])];
      children[idx] = { ...children[idx], [field]: field === "age" ? Number(value) : value };
      return { ...prev, children };
    });
  };

  const handleChildMapChange = (
    idx: number,
    locs: { pickupLocation: ChildLocation; dropoffLocation: ChildLocation }
  ) => {
    setEditData((prev) => {
      const children = [...(prev.children ?? [])];
      children[idx] = { ...children[idx], ...locs };
      return { ...prev, children };
    });
  };

  const toggleChildMap = (idx: number) => {
    setChildMapOpen((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const handleAddChild = () => {
    setEditData((prev) => ({
      ...prev,
      children: [
        ...(prev.children ?? []),
        { name: "", age: 0, school: "", gender: "Boy", pickupLocation: { lat: 0, lng: 0 }, dropoffLocation: { lat: 0, lng: 0 } },
      ],
    }));
    setChildMapOpen((prev) => [...prev, false]);
  };

  const handleRemoveChild = (idx: number) => {
    setEditData((prev) => ({
      ...prev,
      children: (prev.children ?? []).filter((_, i) => i !== idx),
    }));
    setChildMapOpen((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!user) return;
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = { ...editData };
      if (newPassword) body.password = newPassword;

      const res = await fetch(`/api/parents/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        setEditing(false);
        toast.success("Profile updated!");
      } else {
        toast.error(data.error ?? "Update failed.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      /* ignore */
    }
  };

  /* ── Loading / error / unauthenticated states ── */
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
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.deepNavy }}>Something went wrong</Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, mb: 2 }}>We couldn't load your profile.</Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>Reload</Button>
      </LoadingWrap>
    );

  if (!user)
    return (
      <LoadingWrap>
        <EmptyEmoji>🔑</EmptyEmoji>
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.deepNavy }}>You're not signed in</Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, mb: 2 }}>Sign in to view and manage your profile.</Typography>
        <Button variant="contained" onClick={() => router.push("/login")}>Sign In</Button>
      </LoadingWrap>
    );

  /* ── Main render ── */
  return (
    <PageWrapper>
      <PageHeader>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.deepNavy }}>My Profile</Typography>
          <Typography variant="body2" sx={{ color: colors.mutedText }}>Manage your account details</Typography>
        </div>
        <HeaderActions>
          {user.userType === "parent" && !editing && (
            <Button variant="contained" startIcon={<EditIcon />} onClick={startEditing} sx={{ borderRadius: "50px" }}>
              Edit Profile
            </Button>
          )}
          {editing && (
            <>
              <Button variant="outlined" startIcon={<CloseIcon />} onClick={cancelEditing} sx={{ borderRadius: "50px", borderColor: colors.border, color: colors.mutedText }}>
                Cancel
              </Button>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving || passwordMismatch} sx={{ borderRadius: "50px" }}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </>
          )}
          <Button variant="outlined" startIcon={<LogoutIcon />} onClick={handleLogout} sx={{ borderRadius: "50px", borderColor: colors.border, color: colors.mutedText }}>
            Sign Out
          </Button>
        </HeaderActions>
      </PageHeader>

      <ContentGrid singleCol={user.userType === "parent"}>
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
          ) : editing ? (
            /* ── EDIT MODE ── */
            <EditCard>
              <SectionTitle>Personal Info</SectionTitle>
              <TwoCol>
                <TextField label="Full Name" value={editData.fullName ?? ""} onChange={(e) => handleFieldChange("fullName", e.target.value)} fullWidth size="small" />
                <PhoneInput
                  label="Phone Number"
                  value={editData.phoneNumber ?? ""}
                  onChange={(value) => {
                    handleFieldChange("phoneNumber", value);
                    setPhoneError(value.replace(/\D/g, "").length < 7);
                  }}
                  size="small"
                  error={phoneError}
                  helperText={phoneError ? "Enter a valid phone number" : undefined}
                />
              </TwoCol>
              <TextField label="Home Address" value={editData.address ?? ""} onChange={(e) => handleFieldChange("address", e.target.value)} fullWidth size="small" sx={{ mb: 2 }} />

              <SectionTitle>Change Password <OptionalTag>(optional)</OptionalTag></SectionTitle>
              <TwoCol>
                <TextField
                  label="New Password"
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => handlePasswordChange("new", e.target.value)}
                  fullWidth
                  size="small"
                  autoComplete="new-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowNewPw((v) => !v)} edge="end" size="small">
                          {showNewPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Confirm New Password"
                  type={showConfirmPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => handlePasswordChange("confirm", e.target.value)}
                  fullWidth
                  size="small"
                  error={passwordMismatch}
                  autoComplete="new-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPw((v) => !v)} edge="end" size="small">
                          {showConfirmPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </TwoCol>
              <Collapse in={passwordMismatch}>
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>Passwords do not match.</Alert>
              </Collapse>

              <>
                <SectionTitle>Children</SectionTitle>
                {(editData.children ?? []).map((child, idx) => (
                    <ChildEditCard key={idx}>
                      <ChildEditCardHeader>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.deepNavy }}>
                          {child.name || `Child ${idx + 1}`}
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveChild(idx)}
                          disabled={(editData.children?.length ?? 0) <= 1}
                          title="Remove child"
                        >
                          <RemoveCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </ChildEditCardHeader>
                      <TwoCol>
                        <TextField label="Name" value={child.name} onChange={(e) => handleChildFieldChange(idx, "name", e.target.value)} fullWidth size="small" />
                        <TextField label="Age" type="number" value={child.age} onChange={(e) => handleChildFieldChange(idx, "age", e.target.value)} fullWidth size="small" inputProps={{ min: 1, max: 20 }} />
                      </TwoCol>
                      <TwoCol>
                        <TextField
                          select
                          label="Gender"
                          value={child.gender}
                          onChange={(e) => handleChildFieldChange(idx, "gender", e.target.value)}
                          fullWidth
                          size="small"
                          SelectProps={{ native: true }}
                        >
                          <option value="Boy">Boy</option>
                          <option value="Girl">Girl</option>
                        </TextField>
                        <TextField label="School" value={child.school} onChange={(e) => handleChildFieldChange(idx, "school", e.target.value)} fullWidth size="small" />
                      </TwoCol>

                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<RoomIcon />}
                        onClick={() => toggleChildMap(idx)}
                        sx={{ mt: 1.5, borderRadius: "50px", fontSize: "0.75rem" }}
                      >
                        {childMapOpen[idx] ? "Hide Map" : "Update Pick-Up & Drop-Off"}
                      </Button>

                      <Collapse in={childMapOpen[idx]}>
                        <MapHint>
                          Click once to set pick-up (green), again for drop-off (blue). Drag to adjust.
                          {child.pickupLocation && child.pickupLocation.lat !== 0 && <LocBadge>Pickup set ✓</LocBadge>}
                          {child.dropoffLocation && child.dropoffLocation.lat !== 0 && <LocBadge blue>Drop-off set ✓</LocBadge>}
                        </MapHint>
                        <MapContainer>
                          <Map
                            mode="register"
                            onLocationsChange={(locs) => handleChildMapChange(idx, locs)}
                          />
                        </MapContainer>
                      </Collapse>
                    </ChildEditCard>
                  ))}
                  <Button
                    variant="outlined"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={handleAddChild}
                    sx={{ borderRadius: "50px", mb: 1 }}
                  >
                    Add Another Child
                  </Button>
              </>
            </EditCard>
          ) : (
            /* ── VIEW MODE ── */
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
                    <ChildViewItem key={idx}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{child.name}</Typography>
                      <Typography variant="body2" sx={{ color: colors.mutedText }}>
                        {child.age} yrs · {child.gender} · {child.school}
                      </Typography>
                      <LocRow>
                        {child.pickupLocation && child.pickupLocation.lat !== 0 ? (
                          <LocBadge>Pickup set ✓</LocBadge>
                        ) : (
                          <LocBadge muted>No pickup set</LocBadge>
                        )}
                        {child.dropoffLocation && child.dropoffLocation.lat !== 0 ? (
                          <LocBadge blue>Drop-off set ✓</LocBadge>
                        ) : (
                          <LocBadge muted>No drop-off set</LocBadge>
                        )}
                      </LocRow>
                    </ChildViewItem>
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

/* ── Styles ── */

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

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const ContentGrid = styled.div<{ singleCol?: boolean }>`
  display: grid;
  grid-template-columns: ${(p) => (p.singleCol ? "1fr" : "1fr 1.5fr")};
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

const EditCard = styled.div`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(26, 54, 93, 0.06);
`;

const SectionTitle = styled.h3`
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: ${colors.skyBlue};
  margin: 0 0 14px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const OptionalTag = styled.span`
  font-size: 0.65rem;
  font-weight: 400;
  text-transform: none;
  color: ${colors.mutedText};
  letter-spacing: 0;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 14px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const ChildEditCard = styled.div`
  background: ${colors.lightBg};
  border: 1px solid ${colors.border};
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 14px;
`;

const ChildEditCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
`;

const MapHint = styled.p`
  font-size: 0.78rem;
  color: ${colors.mutedText};
  margin: 12px 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const MapContainer = styled.div`
  height: 340px;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 8px;
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

const ChildViewItem = styled.div`
  padding: 14px 16px;
  background: ${colors.lightBg};
  border-radius: 12px;
  border: 1px solid ${colors.border};
  margin-bottom: 10px;
`;

const LocRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const LocBadge = styled.span<{ blue?: boolean; muted?: boolean }>`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 600;
  background: ${(p) =>
    p.muted ? colors.border : p.blue ? colors.skyBlue : colors.mintCream};
  color: ${(p) => (p.muted ? colors.mutedText : colors.deepNavy)};
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
