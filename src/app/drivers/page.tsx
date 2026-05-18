"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";
import ProfileCard, { DriverProfile } from "@/components/Profilecard";
import { Typography, CircularProgress } from "@mui/material";
import { colors } from "@/lib/theme";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const pageSize = 12;

  useEffect(() => {
    const fetchDrivers = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await axios.get(`/api/drivers?page=${page}&limit=${pageSize}`);
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
  }, [page, fetchKey]);

  return (
    <PageWrapper>
      <PageHeader>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.deepNavy, mb: 0.5 }}>
            Available Drivers
          </Typography>
          <Typography variant="body2" sx={{ color: colors.mutedText }}>
            Choose a verified driver for your child&apos;s school commute
          </Typography>
        </div>
        <SearchBadge>
          <SearchIcon sx={{ fontSize: 18, mr: 1, color: colors.mutedText }} />
          <span>{loading ? "Looking…" : drivers.length > 0 ? `${drivers.length} driver${drivers.length !== 1 ? "s" : ""} found` : "No drivers yet"}</span>
        </SearchBadge>
      </PageHeader>

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
            <ProfileCard key={driver._id} {...driver} rating={4.5} />
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
