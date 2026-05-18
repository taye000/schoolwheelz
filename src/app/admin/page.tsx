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
import { colors } from "@/lib/theme";

interface Stats {
  totalDrivers: number;
  validatedDrivers: number;
  activeDrivers: number;
  totalParents: number;
  totalChildren: number;
  totalBookings: number;
}

type TabView = "overview" | "drivers" | "validation-queue" | "active-drivers" | "parents" | "children" | "bookings" | "cars";

const TABS: { label: string; value: TabView }[] = [
  { label: "Overview", value: "overview" },
  { label: "All Drivers", value: "drivers" },
  { label: "Validation Queue", value: "validation-queue" },
  { label: "Active Drivers", value: "active-drivers" },
  { label: "Parents", value: "parents" },
  { label: "Children", value: "children" },
  { label: "Bookings", value: "bookings" },
  { label: "Cars", value: "cars" },
];

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabView>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/admin?view=stats");
      if (data.success) setStats(data.data);
    } catch {
      // not admin — redirect
      router.push("/");
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
      const { data } = await axios.get(`/api/admin?view=${view}`);
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

  const handleValidate = async (driverId: string, validate: boolean) => {
    try {
      await axios.patch(`/api/admin/drivers/${driverId}/validate`, { validate });
      toast.success(validate ? "Driver validated!" : "Validation revoked.");
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
  onValidate: (id: string, v: boolean) => void;
  showValidateOnly?: boolean;
}) {
  if (!rows.length) return <Empty>No drivers found.</Empty>;
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
                    label={d.isValidated ? "Validated" : "Pending"}
                    color={d.isValidated ? "success" : "warning"}
                    variant="outlined"
                  />
                  {d.isProfileActive && (
                    <Chip size="small" label="Active" color="success" />
                  )}
                </Box>
              </TableCell>
              <TableCell align="right">
                {!d.isValidated ? (
                  <Tooltip title="Validate driver">
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => onValidate(d._id, true)}
                      sx={{ borderRadius: "50px", fontSize: "0.7rem" }}
                    >
                      Validate
                    </Button>
                  </Tooltip>
                ) : (
                  !showValidateOnly && (
                    <Tooltip title="Revoke validation">
                      <IconButton size="small" color="error" onClick={() => onValidate(d._id, false)}>
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )
                )}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </StyledTable>
  );
}

/* ─── Cars table ─── */

function CarsTable({ rows }: { rows: any[] }) {
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </StyledTable>
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
