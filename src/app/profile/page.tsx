"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import styled from "styled-components";
import {
  Box,
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
  Tooltip,
  MenuItem,
} from "@mui/material";
import { useRouter } from "next/navigation";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import RoomIcon from "@mui/icons-material/Room";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import VerifiedIcon from "@mui/icons-material/Verified";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CancelIcon from "@mui/icons-material/Cancel";
import PhoneInput from "@/components/PhoneInput";
import DriverSchoolsSection, { SchoolItem } from "@/components/DriverSchoolsSection";
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

interface Car {
  _id: string;
  make: string;
  model: string;
  regNumber: string;
  photo?: string;
  availableSeats: number;
  isActive: boolean;
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
  dob?: string;
  licenseNumber?: string;
  idNumber?: string;
  averageRating?: number;
  isValidated?: boolean;
  verificationStatus?: "pending" | "approved" | "rejected" | "suspended";
  isProfileActive?: boolean;
  cars?: Car[];
  schools?: SchoolItem[];
  children?: Child[];
  billingPreference?: { period: "weekly" | "monthly"; channel: "sms" | "email" | "both" };
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
  // Driver car add form
  const [showAddCar, setShowAddCar] = useState(false);
  const [newCar, setNewCar] = useState({ make: "", model: "", regNumber: "", photo: "", availableSeats: "" });
  const [addingCar, setAddingCar] = useState(false);

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
    setShowAddCar(false);
    setNewCar({ make: "", model: "", regNumber: "", photo: "", availableSeats: "" });
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

      const endpoint = user.userType === "driver" ? `/api/drivers/${user._id}` : `/api/parents/${user._id}`;
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setUser((prev) => prev ? { ...prev, ...data.data } : data.data);
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

  const handleAddCar = async () => {
    if (!user) return;
    if (!newCar.make || !newCar.model || !newCar.regNumber || !newCar.availableSeats) {
      toast.error("Please fill in make, model, reg number and seats.");
      return;
    }
    setAddingCar(true);
    try {
      const res = await fetch(`/api/drivers/${user._id}/cars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...newCar, availableSeats: Number(newCar.availableSeats) }),
      });
      const data = await res.json();
      if (data.success) {
        setUser((prev) => prev ? { ...prev, cars: data.data.cars, isProfileActive: data.data.isProfileActive } : prev);
        setNewCar({ make: "", model: "", regNumber: "", photo: "", availableSeats: "" });
        setShowAddCar(false);
        toast.success("Car added!");
      } else {
        toast.error(data.error ?? "Failed to add car.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setAddingCar(false);
    }
  };

  const handleSetActiveCar = async (carId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/drivers/${user._id}/cars/${carId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setUser((prev) => prev ? { ...prev, cars: data.data.cars, isProfileActive: data.data.isProfileActive } : prev);
        toast.success("Active car updated!");
      } else {
        toast.error(data.error ?? "Failed to update.");
      }
    } catch {
      toast.error("Network error.");
    }
  };

  const handleRemoveCar = async (carId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/drivers/${user._id}/cars/${carId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setUser((prev) => prev ? { ...prev, cars: data.data.cars, isProfileActive: data.data.isProfileActive } : prev);
        toast.success("Car removed.");
      } else {
        toast.error(data.error ?? "Failed to remove car.");
      }
    } catch {
      toast.error("Network error.");
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
          {!editing && (
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
        </HeaderActions>
      </PageHeader>

      <ContentGrid singleCol={user.userType === "parent" && !editing ? true : user.userType === "driver" ? false : true}>
        <LeftPane>
          {user.userType === "driver" && !editing ? (
            <DriverViewCard user={user} onSchoolsUpdate={(schools) => setUser((prev) => prev ? { ...prev, schools } : prev)} />
          ) : user.userType === "driver" && editing ? (
            <DriverEditCard
              user={user}
              editData={editData}
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              showNewPw={showNewPw}
              showConfirmPw={showConfirmPw}
              passwordMismatch={passwordMismatch}
              phoneError={phoneError}
              showAddCar={showAddCar}
              newCar={newCar}
              addingCar={addingCar}
              onFieldChange={handleFieldChange}
              onPasswordChange={handlePasswordChange}
              onPhoneChange={(v) => { handleFieldChange("phoneNumber", v); setPhoneError(v.replace(/\D/g, "").length < 7); }}
              onToggleNewPw={() => setShowNewPw((x) => !x)}
              onToggleConfirmPw={() => setShowConfirmPw((x) => !x)}
              onSetActiveCar={handleSetActiveCar}
              onRemoveCar={handleRemoveCar}
              onToggleAddCar={() => setShowAddCar((x) => !x)}
              onNewCarChange={(field, val) => setNewCar((p) => ({ ...p, [field]: val }))}
              onAddCar={handleAddCar}
              onSchoolsUpdate={(schools) => setUser((prev) => prev ? { ...prev, schools } : prev)}
            />
          ) : editing ? (
            /* ── EDIT MODE ── */
            <>
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

            {/* Billing Preferences */}
            <BillingPrefCard user={user} onSaved={(prefs) => setUser((p) => p ? { ...p, billingPreference: prefs } : p)} />
            </>
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

/* ─── Driver sub-components ─── */

function DriverViewCard({ user, onSchoolsUpdate }: { user: User; onSchoolsUpdate: (schools: SchoolItem[]) => void }) {
  const activeCar = user.cars?.find((c) => c.isActive);
  return (
    <DriverCard>
      {/* Avatar + name */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 3 }}>
        <LargeAvatar src={user.photo || "/avatar.jpg"} alt={user.fullName} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: colors.deepNavy, lineHeight: 1.2 }}>
            {user.fullName}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mt: 0.75, flexWrap: "wrap" }}>
            <Chip label="Driver" size="small" sx={{ bgcolor: colors.skyBlue, color: "#fff", fontWeight: 600 }} />
            {user.verificationStatus === "approved" || user.isValidated ? (
              <Chip icon={<VerifiedIcon sx={{ fontSize: "14px !important" }} />} label="Validated" size="small" color="success" sx={{ fontWeight: 600 }} />
            ) : user.verificationStatus === "rejected" ? (
              <Chip label="Rejected" size="small" color="error" sx={{ fontWeight: 600 }} />
            ) : user.verificationStatus === "suspended" ? (
              <Chip label="Suspended" size="small" color="error" sx={{ fontWeight: 600 }} />
            ) : (
              <Chip icon={<HourglassEmptyIcon sx={{ fontSize: "14px !important" }} />} label="Pending Validation" size="small" color="warning" sx={{ fontWeight: 600 }} />
            )}
            {user.isProfileActive && (
              <Chip label="Active" size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
            )}
          </Box>
        </Box>
        {user.averageRating !== undefined && user.averageRating > 0 && (
          <RatingPill>
            <StarFill>★</StarFill>
            {user.averageRating.toFixed(1)}
          </RatingPill>
        )}
      </Box>

      <InfoRow><Label>Email</Label><Value>{user.email}</Value></InfoRow>
      <InfoRow><Label>Phone</Label><Value>{user.phoneNumber}</Value></InfoRow>
      {user.sex && <InfoRow><Label>Sex</Label><Value>{user.sex}</Value></InfoRow>}
      {user.licenseNumber && <InfoRow><Label>License</Label><Value>{user.licenseNumber}</Value></InfoRow>}

      {(!user.verificationStatus || user.verificationStatus === "pending") && (
        <ValidationNotice>
          <HourglassEmptyIcon sx={{ fontSize: 18 }} />
          <span>Your profile is under review. You'll be visible to parents once validated by an admin.</span>
        </ValidationNotice>
      )}
      {user.verificationStatus === "rejected" && (
        <ValidationNotice style={{ background: "#fff5f5", borderColor: "#fc8181", color: "#742a2a" }}>
          <CancelIcon sx={{ fontSize: 18 }} />
          <span>Your application was not approved. Contact support for details.</span>
        </ValidationNotice>
      )}
      {user.verificationStatus === "suspended" && (
        <ValidationNotice style={{ background: "#fff5f5", borderColor: "#fc8181", color: "#742a2a" }}>
          <CancelIcon sx={{ fontSize: 18 }} />
          <span>Your account is suspended. Contact support.</span>
        </ValidationNotice>
      )}

      {/* Cars */}
      <Divider sx={{ my: 3 }} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <DirectionsCarIcon sx={{ color: colors.skyBlue }} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: colors.deepNavy }}>
          My Vehicles ({user.cars?.length ?? 0})
        </Typography>
      </Box>

      {!user.cars || user.cars.length === 0 ? (
        <EmptyCarNotice>No vehicles added yet. Edit your profile to add one.</EmptyCarNotice>
      ) : (
        user.cars.map((car) => (
          <CarViewItem key={car._id} active={car.isActive}>
            {car.photo && <CarThumb src={car.photo} alt={car.model} />}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.deepNavy }}>
                  {car.make} {car.model}
                </Typography>
                {car.isActive && (
                  <Chip label="Active" size="small" color="success" sx={{ fontWeight: 600 }} />
                )}
              </Box>
              <Typography variant="body2" sx={{ color: colors.mutedText, fontFamily: "monospace" }}>{car.regNumber}</Typography>
              <Typography variant="caption" sx={{ color: colors.mutedText }}>{car.availableSeats} seats available</Typography>
            </Box>
          </CarViewItem>
        ))
      )}

      {/* Schools */}
      <Divider sx={{ my: 3 }} />
      <DriverSchoolsSection
        driverId={user._id}
        initialSchools={user.schools ?? []}
        editable={false}
        isOwner
        onUpdate={onSchoolsUpdate}
      />
    </DriverCard>
  );
}

interface DriverEditCardProps {
  user: User;
  editData: any;
  newPassword: string;
  confirmPassword: string;
  showNewPw: boolean;
  showConfirmPw: boolean;
  passwordMismatch: boolean;
  phoneError: boolean;
  showAddCar: boolean;
  newCar: { make: string; model: string; regNumber: string; photo: string; availableSeats: string };
  addingCar: boolean;
  onFieldChange: (field: string, value: string) => void;
  onPasswordChange: (field: "new" | "confirm", value: string) => void;
  onPhoneChange: (value: string) => void;
  onToggleNewPw: () => void;
  onToggleConfirmPw: () => void;
  onSetActiveCar: (carId: string) => void;
  onRemoveCar: (carId: string) => void;
  onToggleAddCar: () => void;
  onNewCarChange: (field: string, value: string) => void;
  onAddCar: () => void;
  onSchoolsUpdate: (schools: SchoolItem[]) => void;
}

function DriverEditCard({
  user, editData, newPassword, confirmPassword, showNewPw, showConfirmPw,
  passwordMismatch, phoneError, showAddCar, newCar, addingCar,
  onFieldChange, onPasswordChange, onPhoneChange, onToggleNewPw, onToggleConfirmPw,
  onSetActiveCar, onRemoveCar, onToggleAddCar, onNewCarChange, onAddCar, onSchoolsUpdate,
}: DriverEditCardProps) {
  return (
    <EditCard>
      <SectionTitle>Personal Info</SectionTitle>
      <TextField label="Full Name" value={editData.fullName ?? ""} onChange={(e) => onFieldChange("fullName", e.target.value)} fullWidth size="small" sx={{ mb: 1.75 }} />
      <PhoneInput
        label="Phone Number"
        value={editData.phoneNumber ?? ""}
        onChange={onPhoneChange}
        size="small"
        error={phoneError}
        helperText={phoneError ? "Enter a valid phone number" : undefined}
      />

      <SectionTitle>Change Password <OptionalTag>(optional)</OptionalTag></SectionTitle>
      <TwoCol>
        <TextField
          label="New Password"
          type={showNewPw ? "text" : "password"}
          value={newPassword}
          onChange={(e) => onPasswordChange("new", e.target.value)}
          fullWidth size="small" autoComplete="new-password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={onToggleNewPw} edge="end" size="small">
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
          onChange={(e) => onPasswordChange("confirm", e.target.value)}
          fullWidth size="small" error={passwordMismatch} autoComplete="new-password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={onToggleConfirmPw} edge="end" size="small">
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

      {/* Cars section */}
      <SectionTitle style={{ marginTop: 8 }}>
        <DirectionsCarIcon sx={{ fontSize: 16, color: colors.skyBlue }} />
        Vehicles
      </SectionTitle>

      {(!user.cars || user.cars.length === 0) && (
        <EmptyCarNotice>No vehicles yet — add one below.</EmptyCarNotice>
      )}

      {(user.cars ?? []).map((car) => (
        <CarEditRow key={car._id}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: colors.deepNavy }}>
              {car.make} {car.model}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.mutedText, fontFamily: "monospace" }}>
              {car.regNumber} · {car.availableSeats} seats
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip title={car.isActive ? "Currently active" : "Set as active car"}>
              <IconButton
                size="small"
                onClick={() => !car.isActive && onSetActiveCar(car._id)}
                sx={{ color: car.isActive ? "#38A169" : colors.mutedText }}
              >
                {car.isActive ? <RadioButtonCheckedIcon /> : <RadioButtonUncheckedIcon />}
              </IconButton>
            </Tooltip>
            {!car.isActive && (
              <Tooltip title="Remove vehicle">
                <IconButton size="small" color="error" onClick={() => onRemoveCar(car._id)}>
                  <RemoveCircleOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </CarEditRow>
      ))}

      {/* Add car toggle */}
      <AddCarToggle onClick={onToggleAddCar}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AddCircleOutlineIcon sx={{ fontSize: 18, color: colors.skyBlue }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: colors.deepNavy }}>
            {showAddCar ? "Cancel" : "Add a Vehicle"}
          </Typography>
        </Box>
      </AddCarToggle>

      <Collapse in={showAddCar} unmountOnExit>
        <AddCarForm>
          <TwoCol>
            <TextField label="Make" value={newCar.make} onChange={(e) => onNewCarChange("make", e.target.value)} size="small" fullWidth placeholder="e.g. Toyota" />
            <TextField label="Model" value={newCar.model} onChange={(e) => onNewCarChange("model", e.target.value)} size="small" fullWidth placeholder="e.g. Probox" />
          </TwoCol>
          <TwoCol>
            <TextField label="Reg Number" value={newCar.regNumber} onChange={(e) => onNewCarChange("regNumber", e.target.value)} size="small" fullWidth placeholder="KDA 123A" />
            <TextField
              label="Available Seats" type="number"
              value={newCar.availableSeats}
              onChange={(e) => onNewCarChange("availableSeats", e.target.value)}
              size="small" fullWidth inputProps={{ min: 1, max: 20 }}
            />
          </TwoCol>
          <TextField label="Car Photo URL (optional)" value={newCar.photo} onChange={(e) => onNewCarChange("photo", e.target.value)} size="small" fullWidth sx={{ mb: 1.5 }} />
          <Button variant="contained" size="small" onClick={onAddCar} disabled={addingCar} sx={{ borderRadius: "50px" }}>
            {addingCar ? "Adding…" : "Add Vehicle"}
          </Button>
        </AddCarForm>
      </Collapse>

      {/* Schools section */}
      <Divider sx={{ my: 3 }} />
      <DriverSchoolsSection
        driverId={user._id}
        initialSchools={user.schools ?? []}
        editable
        onUpdate={onSchoolsUpdate}
      />
    </EditCard>
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

/* ── Driver-specific ── */

const DriverCard = styled.div`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(26, 54, 93, 0.06);
`;

const LargeAvatar = styled.img`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid ${colors.border};
  flex-shrink: 0;
`;

const RatingPill = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background: ${colors.deepNavy};
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 50px;
  white-space: nowrap;
`;

const StarFill = styled.span`
  color: #f6c90e;
  font-size: 1rem;
  line-height: 1;
`;

const ValidationNotice = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fffbeb;
  border: 1px solid #f6e05e;
  border-radius: 10px;
  padding: 12px 16px;
  margin-top: 16px;
  font-size: 0.85rem;
  color: #744210;
  line-height: 1.5;
`;

const CarViewItem = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: ${(p) => (p.active ? "rgba(56,161,105,0.06)" : colors.lightBg)};
  border: 1.5px solid ${(p) => (p.active ? "#38A169" : colors.border)};
  border-radius: 12px;
  margin-bottom: 10px;
`;

const CarThumb = styled.img`
  width: 64px;
  height: 48px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid ${colors.border};
  flex-shrink: 0;
`;

const EmptyCarNotice = styled.p`
  font-size: 0.85rem;
  color: ${colors.mutedText};
  font-style: italic;
  margin: 8px 0 16px;
`;

const CarEditRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: ${colors.lightBg};
  border: 1px solid ${colors.border};
  border-radius: 10px;
  margin-bottom: 8px;
`;

const AddCarToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: 1.5px dashed ${colors.border};
  border-radius: 10px;
  cursor: pointer;
  margin: 12px 0 0;
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    border-color: ${colors.skyBlue};
    background: rgba(66, 153, 225, 0.04);
  }
`;

const AddCarForm = styled.div`
  background: ${colors.lightBg};
  border: 1px solid ${colors.border};
  border-radius: 10px;
  padding: 16px;
  margin-top: 10px;
`;

/* ── Billing Preference Card ── */

interface BillingPrefCardProps {
  user: User;
  onSaved: (prefs: { period: "weekly" | "monthly"; channel: "sms" | "email" | "both" }) => void;
}

function BillingPrefCard({ user, onSaved }: BillingPrefCardProps) {
  const [period, setPeriod] = useState<"weekly" | "monthly">(
    user.billingPreference?.period ?? "monthly"
  );
  const [channel, setChannel] = useState<"sms" | "email" | "both">(
    user.billingPreference?.channel ?? "email"
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/parents/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ billingPreference: { period, channel } }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved({ period, channel });
        toast.success("Billing preference saved!");
      } else {
        toast.error(data.error ?? "Failed to save");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BillingPrefWrap>
      <Typography variant="h6" sx={{ fontWeight: 700, color: colors.deepNavy, mb: 2 }}>
        📋 Billing Preferences
      </Typography>
      <Typography variant="body2" sx={{ color: colors.mutedText, mb: 2 }}>
        Choose how and when you receive billing summaries for your children&apos;s trips.
      </Typography>
      <BillingRow>
        <TextField
          select
          label="Billing Period"
          value={period}
          onChange={(e) => setPeriod(e.target.value as "weekly" | "monthly")}
          size="small"
          sx={{ flex: 1 }}
        >
          <MenuItem value="weekly">Weekly</MenuItem>
          <MenuItem value="monthly">Monthly</MenuItem>
        </TextField>
        <TextField
          select
          label="Delivery Channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value as "sms" | "email" | "both")}
          size="small"
          sx={{ flex: 1 }}
        >
          <MenuItem value="email">Email</MenuItem>
          <MenuItem value="sms">SMS</MenuItem>
          <MenuItem value="both">Email + SMS</MenuItem>
        </TextField>
      </BillingRow>
      <Button
        variant="contained"
        size="small"
        onClick={handleSave}
        disabled={saving}
        sx={{ mt: 2, borderRadius: "50px" }}
      >
        {saving ? "Saving…" : "Save Preference"}
      </Button>
    </BillingPrefWrap>
  );
}

const BillingPrefWrap = styled.div`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 16px;
  padding: 24px;
  margin-top: 16px;
`;

const BillingRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

