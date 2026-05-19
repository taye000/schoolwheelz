"use client";

import React, { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Avatar,
  IconButton,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PeopleIcon from "@mui/icons-material/People";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import EventNoteIcon from "@mui/icons-material/EventNote";
import VerifiedIcon from "@mui/icons-material/Verified";
import SchoolIcon from "@mui/icons-material/School";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { colors } from "@/lib/theme";

interface Stats {
  totalDrivers: number;
  validatedDrivers: number;
  activeDrivers: number;
  totalParents: number;
  totalChildren: number;
  totalBookings: number;
}

type TabView = "overview" | "drivers" | "validation-queue" | "active-drivers" | "parents" | "children" | "bookings" | "cars" | "schools" | "billing" | "logs";

const TABS: { label: string; value: TabView }[] = [
  { label: "Overview", value: "overview" },
  { label: "All Drivers", value: "drivers" },
  { label: "Validation Queue", value: "validation-queue" },
  { label: "Active Drivers", value: "active-drivers" },
  { label: "Parents", value: "parents" },
  { label: "Children", value: "children" },
  { label: "Bookings", value: "bookings" },
  { label: "Cars", value: "cars" },
  { label: "Schools", value: "schools" },
  { label: "Billing", value: "billing" },
  { label: "Audit Logs", value: "logs" },
];

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabView>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/admin?view=stats", { withCredentials: true });
      if (data.success) setStats(data.data);
      else router.push("/login");
    } catch (err: any) {
      // not admin or unauthenticated — redirect
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        router.push("/login");
      }
    }
  }, [router]);

  const fetchView = useCallback(async (view: TabView) => {
    if (view === "overview") {
      fetchStats();
      return;
    }
    setLoading(true);
    setRows([]);
    try {
      const { data } = await axios.get(`/api/admin?view=${view}`, { withCredentials: true });
      if (data.success) setRows(data.data);
    } catch (err: any) {
      if (err?.response?.status === 403) router.push("/");
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [fetchStats, router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchView(activeTab);
  }, [activeTab, fetchView]);

  const handleValidate = async (driverId: string, status: "approved" | "rejected" | "suspended") => {
    try {
      await axios.patch(`/api/admin/drivers/${driverId}/validate`, { status });
      toast.success(
        status === "approved" ? "Driver approved!" :
        status === "rejected" ? "Driver rejected." :
        "Driver suspended."
      );
      fetchView(activeTab);
      fetchStats();
    } catch {
      toast.error("Action failed.");
    }
  };

  return (
    <PageWrap>
      <Header>
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.deepNavy }}>
          Admin Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText }}>
          School Wheelz — operator view
        </Typography>
      </Header>

      <StyledTabs value={activeTab} onChange={(_e, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
        {TABS.map((t) => (
          <Tab key={t.value} label={t.label} value={t.value} />
        ))}
      </StyledTabs>

      <TabBody>
        {activeTab === "overview" && stats && <OverviewGrid stats={stats} />}

        {activeTab !== "overview" && loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {activeTab === "drivers" && !loading && (
          <DriversTable rows={rows} onValidate={handleValidate} />
        )}

        {activeTab === "validation-queue" && !loading && (
          <DriversTable rows={rows} onValidate={handleValidate} showValidateOnly />
        )}

        {activeTab === "active-drivers" && !loading && (
          <DriversTable rows={rows} onValidate={handleValidate} />
        )}

        {activeTab === "parents" && !loading && <ParentsTable rows={rows} />}

        {activeTab === "children" && !loading && <ChildrenTable rows={rows} />}

        {activeTab === "bookings" && !loading && <BookingsTable rows={rows} />}

        {activeTab === "cars" && !loading && <CarsTable rows={rows} />}

        {activeTab === "schools" && <SchoolsTab />}
        {activeTab === "billing" && <BillingTab />}
        {activeTab === "logs" && <LogsTab />}
      </TabBody>
    </PageWrap>
  );
}

/* ─── Overview cards ─── */

function OverviewGrid({ stats }: { stats: Stats }) {
  const cards = [
    { label: "Total Drivers", value: stats.totalDrivers, icon: <DirectionsCarIcon />, color: colors.skyBlue },
    { label: "Validated Drivers", value: stats.validatedDrivers, icon: <VerifiedIcon />, color: "#48BB78" },
    { label: "Active Drivers", value: stats.activeDrivers, icon: <CheckCircleIcon />, color: "#38A169" },
    { label: "Total Parents", value: stats.totalParents, icon: <PeopleIcon />, color: colors.deepNavy },
    { label: "Total Children", value: stats.totalChildren, icon: <ChildCareIcon />, color: "#ED8936" },
    { label: "Total Bookings", value: stats.totalBookings, icon: <EventNoteIcon />, color: "#9F7AEA" },
  ];

  return (
    <StatsGrid>
      {cards.map((c) => (
        <StatCard key={c.label} elevation={0}>
          <StatIcon style={{ background: `${c.color}18`, color: c.color }}>{c.icon}</StatIcon>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: colors.deepNavy, lineHeight: 1 }}>
              {c.value}
            </Typography>
            <Typography variant="body2" sx={{ color: colors.mutedText, mt: 0.5 }}>
              {c.label}
            </Typography>
          </Box>
        </StatCard>
      ))}
    </StatsGrid>
  );
}

/* ─── Drivers table ─── */

function DriversTable({
  rows,
  onValidate,
  showValidateOnly,
}: {
  rows: any[];
  onValidate: (id: string, status: "approved" | "rejected" | "suspended") => void;
  showValidateOnly?: boolean;
}) {
  const router = useRouter();
  if (!rows.length) return <Empty>No drivers found.</Empty>;

  const statusColor = (s: string) =>
    s === "approved" ? "success" : s === "rejected" ? "error" : s === "suspended" ? "error" : "warning";

  return (
    <StyledTable>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Cars</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((d) => (
            <TableRow key={d._id} hover>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: colors.deepNavy, fontSize: 13 }}>
                    {d.fullName?.[0]}
                  </Avatar>
                  {d.fullName}
                </Box>
              </TableCell>
              <TableCell sx={{ color: colors.mutedText }}>{d.email}</TableCell>
              <TableCell sx={{ color: colors.mutedText }}>{d.phoneNumber}</TableCell>
              <TableCell>{d.cars?.length ?? 0}</TableCell>
              <TableCell>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  <Chip
                    size="small"
                    label={d.verificationStatus ?? (d.isValidated ? "approved" : "pending")}
                    color={statusColor(d.verificationStatus ?? (d.isValidated ? "approved" : "pending")) as any}
                    variant="outlined"
                  />
                  {d.isProfileActive && (
                    <Chip size="small" label="Active" color="success" />
                  )}
                </Box>
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                  <Tooltip title="View driver detail">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => router.push(`/admin/drivers/${d._id}`)}
                      sx={{ borderRadius: "50px", fontSize: "0.7rem", minWidth: 0 }}
                    >
                      View
                    </Button>
                  </Tooltip>
                  {d.verificationStatus !== "approved" && (
                    <Tooltip title="Approve driver">
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => onValidate(d._id, "approved")}
                        sx={{ borderRadius: "50px", fontSize: "0.7rem" }}
                      >
                        Approve
                      </Button>
                    </Tooltip>
                  )}
                  {!showValidateOnly && d.verificationStatus !== "rejected" && (
                    <Tooltip title="Reject driver">
                      <IconButton size="small" color="error" onClick={() => onValidate(d._id, "rejected")}>
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {!showValidateOnly && d.verificationStatus === "approved" && (
                    <Tooltip title="Suspend driver">
                      <IconButton size="small" sx={{ color: "#DD6B20" }} onClick={() => onValidate(d._id, "suspended")}>
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </StyledTable>
  );
}

/* ─── Parents table ─── */

function ParentsTable({ rows }: { rows: any[] }) {
  const router = useRouter();
  if (!rows.length) return <Empty>No parents found.</Empty>;
  return (
    <StyledTable>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Children</TableCell>
            <TableCell>Address</TableCell>
            <TableCell align="right">Detail</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p._id} hover>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: colors.skyBlue, fontSize: 13 }}>
                    {p.fullName?.[0]}
                  </Avatar>
                  {p.fullName}
                </Box>
              </TableCell>
              <TableCell sx={{ color: colors.mutedText }}>{p.email}</TableCell>
              <TableCell sx={{ color: colors.mutedText }}>{p.phoneNumber}</TableCell>
              <TableCell>{p.children?.length ?? 0}</TableCell>
              <TableCell sx={{ color: colors.mutedText, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.address}
              </TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => router.push(`/admin/parents/${p._id}`)}
                  sx={{ borderRadius: "50px", fontSize: "0.7rem" }}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </StyledTable>
  );
}

/* ─── Children table ─── */

function ChildrenTable({ rows }: { rows: any[] }) {
  if (!rows.length) return <Empty>No children found.</Empty>;
  return (
    <StyledTable>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Age</TableCell>
            <TableCell>Gender</TableCell>
            <TableCell>School</TableCell>
            <TableCell>Parent</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((c, i) => (
            <TableRow key={i} hover>
              <TableCell>{c.name}</TableCell>
              <TableCell>{c.age}</TableCell>
              <TableCell>{c.gender}</TableCell>
              <TableCell>{c.school}</TableCell>
              <TableCell sx={{ color: colors.mutedText }}>{c.parentName}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </StyledTable>
  );
}

/* ─── Bookings table ─── */

const STATUS_COLORS: Record<string, "default" | "warning" | "success" | "error"> = {
  pending: "warning",
  accepted: "success",
  completed: "default",
  canceled: "error",
};

function BookingsTable({ rows }: { rows: any[] }) {
  const router = useRouter();
  if (!rows.length) return <Empty>No bookings found.</Empty>;
  return (
    <StyledTable>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Booking ID</TableCell>
            <TableCell>Parent</TableCell>
            <TableCell>Driver</TableCell>
            <TableCell>Seats</TableCell>
            <TableCell>Trip Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Detail</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((b) => (
            <TableRow key={b._id} hover>
              <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{b.bookingId}</TableCell>
              <TableCell>{b.parent?.fullName ?? "—"}</TableCell>
              <TableCell>{b.driver?.fullName ?? "—"}</TableCell>
              <TableCell>{b.seatsBooked}</TableCell>
              <TableCell sx={{ color: colors.mutedText }}>{new Date(b.tripDate).toLocaleDateString()}</TableCell>
              <TableCell>
                <Chip size="small" label={b.status} color={STATUS_COLORS[b.status] ?? "default"} variant="outlined" />
              </TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => router.push(`/admin/bookings/${b._id}`)}
                  sx={{ borderRadius: "50px", fontSize: "0.7rem" }}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </StyledTable>
  );
}

/* ─── Cars table ─── */

function CarsTable({ rows }: { rows: any[] }) {
  const router = useRouter();
  if (!rows.length) return <Empty>No cars found.</Empty>;
  return (
    <StyledTable>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Make</TableCell>
            <TableCell>Model</TableCell>
            <TableCell>Reg Number</TableCell>
            <TableCell>Seats</TableCell>
            <TableCell>Driver</TableCell>
            <TableCell>Active</TableCell>
            <TableCell align="right">Detail</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((c, i) => (
            <TableRow key={i} hover>
              <TableCell>{c.make}</TableCell>
              <TableCell>{c.model}</TableCell>
              <TableCell sx={{ fontFamily: "monospace" }}>{c.regNumber}</TableCell>
              <TableCell>{c.availableSeats}</TableCell>
              <TableCell sx={{ color: colors.mutedText }}>{c.driverName}</TableCell>
              <TableCell>
                {c.isActive ? (
                  <Chip size="small" label="Active" color="success" />
                ) : (
                  <Chip size="small" label="Inactive" variant="outlined" />
                )}
              </TableCell>
              <TableCell align="right">
                {c.driverId && c._id && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => router.push(`/admin/cars/${c.driverId}/${c._id}`)}
                    sx={{ borderRadius: "50px", fontSize: "0.7rem" }}
                  >
                    View
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </StyledTable>
  );
}

/* ─── Schools tab ─── */

function SchoolsTab() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"approved" | "pending" | "rejected" | "all">("all");
  // Add school dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEstate, setAddEstate] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  // Approve dialog (edit before approving)
  const [approveSchool, setApproveSchool] = useState<any | null>(null);
  const [approveName, setApproveName] = useState("");
  const [approveEstate, setApproveEstate] = useState("");
  const [approveNote, setApproveNote] = useState("");
  const [approveSaving, setApproveSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/schools?status=all", { withCredentials: true });
      setSchools(data.data);
    } catch {
      toast.error("Failed to load schools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? schools : schools.filter((s) => s.status === filter);
  const pending = schools.filter((s) => s.status === "pending").length;

  const handleAdd = async () => {
    if (!addName.trim() || !addEstate.trim()) { toast.error("Name and estate required"); return; }
    setAddSaving(true);
    try {
      await axios.post("/api/schools", { name: addName.trim(), estate: addEstate.trim() }, { withCredentials: true });
      toast.success("School added!");
      setAddOpen(false); setAddName(""); setAddEstate("");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed");
    } finally { setAddSaving(false); }
  };

  const openApprove = (s: any) => {
    setApproveSchool(s); setApproveName(s.name); setApproveEstate(s.estate); setApproveNote("");
  };

  const handleApprove = async () => {
    if (!approveSchool) return;
    setApproveSaving(true);
    try {
      await axios.patch(`/api/schools/${approveSchool._id}/approve`, { name: approveName, estate: approveEstate, adminNote: approveNote }, { withCredentials: true });
      toast.success("School approved!");
      setApproveSchool(null);
      load();
    } catch { toast.error("Failed to approve"); }
    finally { setApproveSaving(false); }
  };

  const handleReject = async (id: string) => {
    try {
      await axios.patch(`/api/schools/${id}/reject`, {}, { withCredentials: true });
      toast.success("School rejected.");
      load();
    } catch { toast.error("Failed to reject"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this school permanently?")) return;
    try {
      await axios.delete(`/api/schools/${id}/reject`, { withCredentials: true });
      toast.success("Deleted.");
      load();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {(["all", "approved", "pending", "rejected"] as const).map((s) => (
            <Chip
              key={s}
              label={s === "all" ? `All (${schools.length})` : s === "pending" ? `Pending (${pending})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${schools.filter(x => x.status === s).length})`}
              onClick={() => setFilter(s)}
              color={filter === s ? "primary" : "default"}
              variant={filter === s ? "filled" : "outlined"}
              sx={{ fontWeight: 600, textTransform: "capitalize" }}
            />
          ))}
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)} sx={{ borderRadius: "50px" }}>
          Add School
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${colors.border}`, borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: colors.lightBg }}>
                <TableCell sx={{ fontWeight: 700 }}>School</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estate</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Requested By</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Note</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "right" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: colors.mutedText, py: 4 }}>No schools found</TableCell>
                </TableRow>
              )}
              {filtered.map((s) => (
                <TableRow key={s._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                  <TableCell>{s.estate}</TableCell>
                  <TableCell>
                    <Chip
                      label={s.status}
                      size="small"
                      sx={{
                        fontWeight: 700, textTransform: "capitalize",
                        bgcolor: s.status === "approved" ? "#C6F6D5" : s.status === "pending" ? "#FEFCBF" : "#FED7D7",
                        color: s.status === "approved" ? "#22543D" : s.status === "pending" ? "#744210" : "#742A2A",
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: colors.mutedText, fontSize: "0.8rem" }}>
                    {s.requestedBy ? `${s.requestedBy.fullName}` : "Admin"}
                  </TableCell>
                  <TableCell sx={{ color: colors.mutedText, fontSize: "0.78rem", maxWidth: 160 }}>
                    {s.requestNote || s.adminNote || "—"}
                  </TableCell>
                  <TableCell align="right">
                    {s.status === "pending" && (
                      <>
                        <Tooltip title="Review & Approve">
                          <IconButton size="small" color="success" onClick={() => openApprove(s)}>
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton size="small" color="error" onClick={() => handleReject(s._id)}>
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {s.status === "approved" && (
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openApprove(s)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete permanently">
                      <IconButton size="small" color="error" onClick={() => handleDelete(s._id)}>
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add school dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add School</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          <TextField label="School Name" value={addName} onChange={(e) => setAddName(e.target.value)} size="small" fullWidth />
          <TextField label="Estate / Area" value={addEstate} onChange={(e) => setAddEstate(e.target.value)} size="small" fullWidth />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={addSaving} sx={{ borderRadius: "50px" }}>
            {addSaving ? "Saving…" : "Add School"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve/edit dialog */}
      <Dialog open={!!approveSchool} onClose={() => setApproveSchool(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {approveSchool?.status === "pending" ? "Review & Approve School" : "Edit School"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          <TextField label="School Name" value={approveName} onChange={(e) => setApproveName(e.target.value)} size="small" fullWidth />
          <TextField label="Estate / Area" value={approveEstate} onChange={(e) => setApproveEstate(e.target.value)} size="small" fullWidth />
          <TextField label="Admin note (optional)" value={approveNote} onChange={(e) => setApproveNote(e.target.value)} size="small" fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setApproveSchool(null)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleApprove} disabled={approveSaving} sx={{ borderRadius: "50px" }}>
            {approveSaving ? "Saving…" : approveSchool?.status === "pending" ? "Approve" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* ─── Styled components ─── */

const PageWrap = styled.div`
  background: ${colors.lightBg};
  min-height: 100vh;
  padding: 0 0 48px;
`;

const Header = styled.div`
  background: ${colors.pureWhite};
  padding: 28px 32px 20px;
  border-bottom: 1px solid ${colors.border};
`;

const StyledTabs = styled(Tabs)`
  && {
    background: ${colors.pureWhite};
    border-bottom: 1px solid ${colors.border};
    padding: 0 24px;

    .MuiTab-root {
      font-size: 0.82rem;
      font-weight: 600;
      text-transform: none;
      min-height: 48px;
    }
  }
`;

const TabBody = styled.div`
  padding: 28px 24px;
  max-width: 1280px;
  margin: 0 auto;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
`;

const StatCard = styled(Paper)`
  && {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px 24px;
    border-radius: 16px;
    border: 1px solid ${colors.border};
  }
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
`;

const StyledTable = styled(TableContainer)`
  && {
    border-radius: 12px;
    border: 1px solid ${colors.border};
    background: ${colors.pureWhite};

    .MuiTableHead-root .MuiTableCell-root {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: ${colors.mutedText};
      background: ${colors.lightBg};
    }
  }
`;

const Empty = styled.div`
  text-align: center;
  padding: 60px 24px;
  color: ${colors.mutedText};
  font-size: 0.95rem;
`;

/* ─── Billing Tab ─── */

const STATUS_COLORS: Record<string, "default" | "warning" | "success" | "error"> = {
  pending: "warning",
  paid: "success",
  overdue: "error",
  waived: "default",
};

function BillingTab() {
  const [bills, setBills] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  // Generate dialog
  const [genOpen, setGenOpen] = useState(false);
  const [genParentId, setGenParentId] = useState("");
  const [genFrom, setGenFrom] = useState("");
  const [genTo, setGenTo] = useState("");
  const [genPeriod, setGenPeriod] = useState("monthly");
  const [generating, setGenerating] = useState(false);
  // Edit dialog
  const [editBill, setEditBill] = useState<any | null>(null);
  const [editTotal, setEditTotal] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const url = statusFilter !== "all" ? `/api/billing?status=${statusFilter}` : "/api/billing";
      const { data } = await axios.get(url, { withCredentials: true });
      if (data.success) setBills(data.data);
    } catch { toast.error("Failed to load bills"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchBills();
    axios.get("/api/admin?view=parents", { withCredentials: true }).then((r) => {
      if (r.data.success) setParents(r.data.data);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleGenerate = async () => {
    if (!genParentId || !genFrom || !genTo) { toast.error("Fill all fields"); return; }
    setGenerating(true);
    try {
      await axios.post("/api/billing", {
        parentId: genParentId, periodStart: genFrom, periodEnd: genTo, period: genPeriod,
      }, { withCredentials: true });
      toast.success("Bill generated!");
      setGenOpen(false);
      fetchBills();
    } catch (e: any) { toast.error(e?.response?.data?.message ?? "Failed"); }
    finally { setGenerating(false); }
  };

  const openEdit = (bill: any) => {
    setEditBill(bill);
    setEditTotal(String(bill.total));
    setEditNote(bill.adminNote ?? "");
    setEditStatus(bill.status);
  };

  const handleSave = async () => {
    if (!editBill) return;
    setSaving(true);
    try {
      await axios.patch(`/api/billing/${editBill._id}`, {
        total: Number(editTotal), adminNote: editNote, status: editStatus,
      }, { withCredentials: true });
      toast.success("Bill updated!");
      setEditBill(null);
      fetchBills();
    } catch { toast.error("Failed to update"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bill permanently?")) return;
    try {
      await axios.delete(`/api/billing/${id}`, { withCredentials: true });
      toast.success("Deleted");
      fetchBills();
    } catch { toast.error("Failed"); }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: colors.deepNavy }}>Billing</Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              {["all","pending","paid","overdue","waived"].map((s) => <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" size="small" onClick={() => setGenOpen(true)} sx={{ borderRadius: "50px" }}>
            + Generate Bill
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
      ) : bills.length === 0 ? (
        <Empty>No bills found.</Empty>
      ) : (
        <StyledTable component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["Ref","Parent","Period","Items","Subtotal","Total","Status","Actions"].map((h) => <TableCell key={h}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {bills.map((b) => (
                <TableRow key={b._id}>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{b.billRef}</TableCell>
                  <TableCell>{b.parentName}</TableCell>
                  <TableCell sx={{ fontSize: "0.75rem" }}>
                    {new Date(b.periodStart).toLocaleDateString("en-KE", { month:"short", day:"numeric" })}
                    {" – "}
                    {new Date(b.periodEnd).toLocaleDateString("en-KE", { month:"short", day:"numeric", year:"numeric" })}
                  </TableCell>
                  <TableCell>{b.lineItems?.length ?? 0}</TableCell>
                  <TableCell>KES {b.subtotal?.toLocaleString()}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>KES {b.total?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip label={b.status} color={STATUS_COLORS[b.status] ?? "default"} size="small" />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit / Mark Paid">
                      <IconButton size="small" onClick={() => openEdit(b)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(b._id)}><CancelIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </StyledTable>
      )}

      {/* Generate Dialog */}
      <Dialog open={genOpen} onClose={() => setGenOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Generate Bill</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Parent</InputLabel>
            <Select value={genParentId} label="Parent" onChange={(e) => setGenParentId(e.target.value)}>
              {parents.map((p: any) => <MenuItem key={p._id} value={p._id}>{p.fullName}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="From" type="date" size="small" value={genFrom} onChange={(e) => setGenFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="To" type="date" size="small" value={genTo} onChange={(e) => setGenTo(e.target.value)} InputLabelProps={{ shrink: true }} />
          <FormControl size="small" fullWidth>
            <InputLabel>Period</InputLabel>
            <Select value={genPeriod} label="Period" onChange={(e) => setGenPeriod(e.target.value)}>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleGenerate} disabled={generating}>
            {generating ? "Generating…" : "Generate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editBill} onClose={() => setEditBill(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Bill — {editBill?.billRef}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <TextField label="Total (KES)" type="number" size="small" value={editTotal} onChange={(e) => setEditTotal(e.target.value)} />
          <FormControl size="small" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select value={editStatus} label="Status" onChange={(e) => setEditStatus(e.target.value)}>
              {["pending","paid","overdue","waived"].map((s) => <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Admin Note" size="small" multiline rows={2} value={editNote} onChange={(e) => setEditNote(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditBill(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* ─── Logs Tab ─── */

const ACTION_COLORS: Record<string, "default" | "primary" | "warning" | "error" | "success" | "info"> = {
  create: "success",
  update: "info",
  delete: "error",
  status_change: "warning",
  payment_update: "primary",
  login: "default",
  logout: "default",
};

function LogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resourceFilter, setResourceFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (resourceFilter) params.set("resource", resourceFilter);
      if (actionFilter) params.set("action", actionFilter);
      const { data } = await axios.get(`/api/admin/logs?${params}`, { withCredentials: true });
      if (data.success) {
        setLogs(data.data);
        setTotalPages(data.pagination?.pages ?? 1);
      }
    } catch { toast.error("Failed to load logs"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, resourceFilter, actionFilter]);

  const RESOURCES = ["Booking","Driver","School","Bill","Parent"];
  const ACTIONS = ["create","update","delete","status_change","payment_update","login","logout"];

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: colors.deepNavy, flex: 1 }}>Audit Logs</Typography>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Resource</InputLabel>
          <Select value={resourceFilter} label="Resource" onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">All</MenuItem>
            {RESOURCES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Action</InputLabel>
          <Select value={actionFilter} label="Action" onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">All</MenuItem>
            {ACTIONS.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
      ) : logs.length === 0 ? (
        <Empty>No audit logs yet.</Empty>
      ) : (
        <StyledTable component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["Time","Actor","Type","Action","Resource","Detail"].map((h) => <TableCell key={h}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l._id}>
                  <TableCell sx={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                    {new Date(l.createdAt).toLocaleString("en-KE", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{l.actorName}</TableCell>
                  <TableCell>
                    <Chip label={l.actorType} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={l.action} color={ACTION_COLORS[l.action] ?? "default"} size="small" />
                  </TableCell>
                  <TableCell>{l.resource} <span style={{ color: colors.mutedText, fontSize: "0.72rem" }}>{l.resourceId?.slice(-6)}</span></TableCell>
                  <TableCell sx={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.8rem" }}>
                    {l.detail}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </StyledTable>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 2 }}>
          <Button size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <Typography variant="body2" sx={{ alignSelf: "center" }}>{page} / {totalPages}</Typography>
          <Button size="small" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </Box>
      )}
    </Box>
  );
}

