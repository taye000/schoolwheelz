"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import styled from "styled-components";
import ProfileCard, { DriverProfile } from "@/components/Profilecard";
import { Typography, CircularProgress, MenuItem, Select, FormControl, InputLabel, InputAdornment, TextField, IconButton as MuiIconButton } from "@mui/material";
import { colors } from "@/lib/theme";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import SchoolIcon from "@mui/icons-material/School";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const [schools, setSchools] = useState<{ _id: string; name: string; estate: string }[]>([]);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageSize = 12;

  // Debounce the search input 350 ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
      setPage(1);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchText]);

  useEffect(() => {
    axios.get("/api/schools").then((r) => { if (r.data.success) setSchools(r.data.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchDrivers = async () => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
        });
        if (selectedSchool) params.set("school", selectedSchool);
        if (debouncedSearch) params.set("q", debouncedSearch);
        const response = await axios.get(`/api/drivers?${params.toString()}`);
        if (response.data.success) {
          setDrivers(response.data.data);
          setTotalPages(response.data.pagination.pages ?? 1);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, [page, fetchKey, selectedSchool, debouncedSearch]);

  return (
    <PageWrapper>
      <PageHeader>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.deepNavy, mb: 0.5 }}>
            Find a Driver
          </Typography>
          <Typography variant="body2" sx={{ color: colors.mutedText }}>
            All drivers are background-checked and rated by parents.
            Pick one that serves your child&apos;s school.
          </Typography>
        </div>
        <SearchBadge>
          <SearchIcon sx={{ fontSize: 18, mr: 1, color: colors.mutedText }} />
          <span>{loading ? "Searching…" : drivers.length > 0 ? `${drivers.length} driver${drivers.length !== 1 ? "s" : ""} found` : "No matches"}</span>
        </SearchBadge>
      </PageHeader>

      <FilterBar>
          <TextField
            placeholder="Search by driver name or estate…"
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: colors.mutedText }} />
                </InputAdornment>
              ),
              endAdornment: searchText ? (
                <InputAdornment position="end">
                  <MuiIconButton size="small" onClick={() => setSearchText("")}>
                    <ClearIcon sx={{ fontSize: 16 }} />
                  </MuiIconButton>
                </InputAdornment>
              ) : null,
              sx: { borderRadius: "50px", fontSize: "0.875rem" },
            }}
            sx={{ minWidth: 280 }}
          />
          {schools.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="school-filter-label">
                <SchoolIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />
                Filter by School
              </InputLabel>
              <Select
                labelId="school-filter-label"
                value={selectedSchool}
                label="Filter by School"
                onChange={(e) => { setSelectedSchool(e.target.value); setPage(1); }}
                sx={{ borderRadius: "50px" }}
              >
                <MenuItem value="">All Schools</MenuItem>
                {schools.map((s) => (
                  <MenuItem key={s._id} value={s._id}>{s.name} — {s.estate}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {(selectedSchool || debouncedSearch) && (
            <ClearFilter onClick={() => { setSelectedSchool(""); setSearchText(""); setPage(1); }}>
              Clear all ×
            </ClearFilter>
          )}
        </FilterBar>

      {loading ? (
        <LoadingWrap>
          <CircularProgress sx={{ color: colors.deepNavy }} />
          <LoadingText>Rounding up drivers…</LoadingText>
        </LoadingWrap>
      ) : error ? (
        <EmptyState>
          <EmptyEmoji>🚧</EmptyEmoji>
          <EmptyTitle>Oops, hit a speed bump</EmptyTitle>
          <EmptyBody>Couldn’t reach the server. Check your connection and try again.</EmptyBody>
          <RetryBtn onClick={() => setFetchKey((k) => k + 1)}>Retry</RetryBtn>
        </EmptyState>
      ) : drivers.length === 0 ? (
        <EmptyState>
          <EmptyEmoji>🚌</EmptyEmoji>
          <EmptyTitle>The roads are empty… for now</EmptyTitle>
          <EmptyBody>
            No drivers have signed up yet — but good things come to those who wait (or spread the word).
            <br /><br />
            Know a driver? Send them to the{" "}
            <a href="/driver-registration" style={{ color: colors.skyBlue, fontWeight: 600 }}>
              driver registration page
            </a>.
          </EmptyBody>
        </EmptyState>
      ) : (
        <DriversGrid>
          {drivers.map((driver) => (
            <ProfileCard key={driver._id} {...driver} />
          ))}
        </DriversGrid>
      )}

      {totalPages > 1 && (
        <Pagination>
          <PaginationBtn onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
            <ArrowBackIosIcon sx={{ fontSize: 16 }} /> Prev
          </PaginationBtn>
          <PageInfo>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </PageInfo>
          <PaginationBtn onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages}>
            Next <ArrowForwardIosIcon sx={{ fontSize: 16 }} />
          </PaginationBtn>
        </Pagination>
      )}
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 40px;
`;

const SearchBadge = styled.div`
  display: flex;
  align-items: center;
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 50px;
  padding: 10px 20px;
  font-size: 0.875rem;
  color: ${colors.mutedText};
  font-weight: 500;
`;

const FilterBar = styled.div`
  display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;
`;

const ClearFilter = styled.button`
  background: none; border: none; cursor: pointer;
  font-size: 0.8rem; font-weight: 600; color: ${colors.errorRed};
  padding: 4px 0;
  &:hover { text-decoration: underline; }
`;

const DriversGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 10px;
`;

const LoadingWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 0;
`;

const LoadingText = styled.p`
  font-size: 0.925rem;
  color: ${colors.mutedText};
  font-style: italic;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 24px;
  max-width: 480px;
  margin: 0 auto;
`;

const EmptyEmoji = styled.div`
  font-size: 4rem;
  margin-bottom: 16px;
`;

const EmptyTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${colors.deepNavy};
  margin: 0 0 12px;
`;

const EmptyBody = styled.p`
  font-size: 0.925rem;
  color: ${colors.mutedText};
  line-height: 1.7;
  margin: 0 0 24px;
`;

const RetryBtn = styled.button`
  padding: 10px 28px;
  border-radius: 50px;
  border: 2px solid ${colors.deepNavy};
  background: transparent;
  color: ${colors.deepNavy};
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: ${colors.deepNavy}; color: #fff; }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 52px;
`;

const PaginationBtn = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 22px;
  border-radius: 50px;
  border: 1px solid ${colors.border};
  background: ${(p) => (p.disabled ? colors.lightBg : colors.pureWhite)};
  color: ${(p) => (p.disabled ? colors.mutedText : colors.deepNavy)};
  font-weight: 600;
  font-size: 0.875rem;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s;
  &:hover:not(:disabled) {
    background: ${colors.deepNavy};
    color: #fff;
    border-color: ${colors.deepNavy};
  }
`;

const PageInfo = styled.span`
  font-size: 0.875rem;
  color: ${colors.mutedText};
`;
