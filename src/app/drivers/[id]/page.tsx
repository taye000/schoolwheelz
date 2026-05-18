"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import styled from "styled-components";
import StarIcon from "@mui/icons-material/Star";
import StarHalfIcon from "@mui/icons-material/StarHalf";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import PhoneIcon from "@mui/icons-material/Phone";
import WcIcon from "@mui/icons-material/Wc";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import RouteIcon from "@mui/icons-material/Route";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import VerifiedIcon from "@mui/icons-material/Verified";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import { Avatar, Button, CircularProgress, Typography, Chip, LinearProgress } from "@mui/material";
import BookingForm from "@/components/BookingForm";
import { colors } from "@/lib/theme";

interface Car {
  _id: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  regNumber: string;
  vehicleType: string;
  availableSeats: number;
  isActive: boolean;
  photo?: string;
}

interface Availability {
  days?: string[];
  morning?: boolean;
  evening?: boolean;
  areasServed?: string[];
  schoolsServed?: string[];
}

interface Driver {
  _id: string;
  fullName: string;
  photo?: string;
  phoneNumber: string;
  sex: string;
  dob: string;
  city?: string;
  county?: string;
  verificationStatus: string;
  averageRating: number;
  ratingCount: number;
  totalTrips: number;
  completedTrips: number;
  cars: Car[];
  availability?: Availability;
  // legacy flat fields (old docs)
  carModel?: string;
  carMake?: string;
  carRegNumber?: string;
  carPhoto?: string;
  availableSeats?: number;
}

interface Review {
  _id: string;
  rating: number;
  comment?: string;
  complaints?: string[];
  createdAt: string;
  parent?: { _id: string; fullName: string; photo?: string };
}

interface User {
  _id: string;
  userType: "parent" | "driver" | "admin";
  fullName: string;
  email: string;
  phoneNumber: string;
  children?: Array<{ _id: string; name: string; age: number; grade: string; school: string; gender: string }>;
}

function StarRow({ rating, size = 18 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      {Array.from({ length: full }).map((_, i) => <StarIcon key={`f${i}`} sx={{ fontSize: size, color: "#F6AD55" }} />)}
      {half && <StarHalfIcon sx={{ fontSize: size, color: "#F6AD55" }} />}
      {Array.from({ length: empty }).map((_, i) => <StarOutlineIcon key={`e${i}`} sx={{ fontSize: size, color: "#F6AD55" }} />)}
    </span>
  );
}

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      axios.get(`/api/drivers/${id}`),
      axios.get(`/api/reviews?driverId=${id}&limit=10`),
      fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([driverRes, reviewsRes, meData]) => {
        if (driverRes.data.success) setDriver(driverRes.data.data);
        else setError(true);
        if (reviewsRes.data.success) {
          setReviews(reviewsRes.data.data);
          setReviewTotal(reviewsRes.data.total ?? 0);
        }
        if (meData.success) setUser(meData.user);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <LoadingWrap>
        <CircularProgress sx={{ color: colors.deepNavy }} />
        <LoadingText>Loading driver profile…</LoadingText>
      </LoadingWrap>
    );

  if (error || !driver)
    return (
      <LoadingWrap>
        <span style={{ fontSize: "3rem" }}>🚧</span>
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.deepNavy }}>
          {error ? "Hit a speed bump" : "Driver not found"}
        </Typography>
        <Typography variant="body2" sx={{ color: colors.mutedText, mb: 2 }}>
          {error ? "Couldn't load this profile. Check your connection." : "This link might be wrong."}
        </Typography>
        <Button variant="contained" onClick={() => router.push("/drivers")}>Back to Drivers</Button>
      </LoadingWrap>
    );

  const age = driver.dob
    ? Math.floor((Date.now() - new Date(driver.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  const activeCars = driver.cars?.filter((c) => c.isActive) ?? [];
  const allCars = driver.cars ?? [];
  const isVerified = driver.verificationStatus === "approved";

  // Rating distribution
  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  return (
    <PageWrapper>
      <BackBtn onClick={() => router.push("/drivers")}>
        <ArrowBackIcon sx={{ fontSize: 16 }} /> Back to Drivers
      </BackBtn>

      <ContentGrid>
        {/* ── LEFT COLUMN ── */}
        <LeftCol>

          {/* Hero */}
          <HeroCard>
            <Avatar
              src={driver.photo}
              alt={driver.fullName}
              sx={{ width: 88, height: 88, bgcolor: colors.deepNavy, fontSize: "2rem", flexShrink: 0, border: `3px solid ${colors.skyBlue}` }}
            >
              {driver.fullName?.[0]}
            </Avatar>
            <HeroInfo>
              <HeroName>
                {driver.fullName}
                {isVerified && (
                  <VerifiedIcon sx={{ fontSize: 20, color: colors.successGreen, ml: 0.5, verticalAlign: "middle" }} />
                )}
              </HeroName>
              {(driver.city || driver.county) && (
                <MetaLine>
                  <LocationOnIcon sx={{ fontSize: 14, color: colors.mutedText }} />
                  <span>{[driver.city, driver.county].filter(Boolean).join(", ")}</span>
                </MetaLine>
              )}
              <RatingLine>
                <StarRow rating={driver.averageRating ?? 0} />
                <strong style={{ fontSize: "0.9rem", color: colors.deepNavy }}>
                  {driver.averageRating > 0 ? driver.averageRating.toFixed(1) : "No ratings yet"}
                </strong>
                {driver.ratingCount > 0 && (
                  <span style={{ fontSize: "0.8rem", color: colors.mutedText }}>
                    ({driver.ratingCount} review{driver.ratingCount !== 1 ? "s" : ""})
                  </span>
                )}
              </RatingLine>
              <ChipRow>
                {isVerified && <Chip size="small" label="Verified" color="success" />}
                {driver.totalTrips > 0 && (
                  <Chip size="small" icon={<RouteIcon sx={{ fontSize: "14px !important" }} />}
                    label={`${driver.completedTrips} trips`}
                    sx={{ bgcolor: colors.lightBg, color: colors.deepNavy }} />
                )}
              </ChipRow>
            </HeroInfo>
          </HeroCard>

          {/* Personal */}
          <Section>
            <SectionLabel>About</SectionLabel>
            <TileGrid>
              <Tile><PhoneIcon sx={{ color: colors.skyBlue, fontSize: 18 }} /><span>{driver.phoneNumber}</span></Tile>
              <Tile><WcIcon sx={{ color: colors.skyBlue, fontSize: 18 }} /><span>{driver.sex}</span></Tile>
              {age && <Tile><CalendarTodayIcon sx={{ color: colors.skyBlue, fontSize: 18 }} /><span>{age} years old</span></Tile>}
            </TileGrid>
          </Section>

          {/* Availability */}
          {driver.availability && (
            <Section>
              <SectionLabel>Availability</SectionLabel>
              {driver.availability.days && driver.availability.days.length > 0 && (
                <DayChips>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => {
                    const full = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][i];
                    const active = driver.availability!.days!.some(
                      (day) => day.toLowerCase() === full.toLowerCase() || day.toLowerCase().startsWith(d.toLowerCase())
                    );
                    return <DayChip key={d} active={active}>{d}</DayChip>;
                  })}
                </DayChips>
              )}
              <ShiftRow>
                <ShiftBadge active={!!driver.availability.morning}>Morning</ShiftBadge>
                <ShiftBadge active={!!driver.availability.evening}>Evening</ShiftBadge>
              </ShiftRow>
              {driver.availability.areasServed && driver.availability.areasServed.length > 0 && (
                <TagGroup label="Areas" items={driver.availability.areasServed} />
              )}
              {driver.availability.schoolsServed && driver.availability.schoolsServed.length > 0 && (
                <TagGroup label="Schools" items={driver.availability.schoolsServed} />
              )}
            </Section>
          )}

          {/* Vehicles */}
          {allCars.length > 0 ? (
            <Section>
              <SectionLabel>Vehicles ({allCars.length})</SectionLabel>
              <CarsStack>
                {allCars.map((car) => (
                  <CarCard key={car._id} inactive={!car.isActive}>
                    <CarHeader>
                      <DirectionsCarIcon sx={{ color: car.isActive ? colors.skyBlue : colors.mutedText, fontSize: 20 }} />
                      <CarName>{car.make} {car.model}{car.year ? ` (${car.year})` : ""}</CarName>
                      {car.color && <ColorDot color={car.color} title={car.color} />}
                      {!car.isActive && <Chip size="small" label="Inactive" variant="outlined" sx={{ ml: "auto", fontSize: "0.7rem" }} />}
                    </CarHeader>
                    <CarMeta>
                      <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{car.regNumber}</span>
                      <Bullet />
                      <span>{car.vehicleType}</span>
                      <Bullet />
                      <EventSeatIcon sx={{ fontSize: 13, color: colors.mutedText }} />
                      <span>{car.availableSeats} seats</span>
                    </CarMeta>
                    {car.photo && <CarPhoto src={car.photo} alt={`${car.make} ${car.model}`} />}
                  </CarCard>
                ))}
              </CarsStack>
            </Section>
          ) : driver.carModel ? (
            // Fallback for legacy flat-field docs
            <Section>
              <SectionLabel>Vehicle</SectionLabel>
              <CarCard inactive={false}>
                <CarHeader>
                  <DirectionsCarIcon sx={{ color: colors.skyBlue, fontSize: 20 }} />
                  <CarName>{driver.carMake ? `${driver.carMake} ` : ""}{driver.carModel}</CarName>
                </CarHeader>
                <CarMeta>
                  <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{driver.carRegNumber}</span>
                  {driver.availableSeats && (<><Bullet /><EventSeatIcon sx={{ fontSize: 13 }} /><span>{driver.availableSeats} seats</span></>)}
                </CarMeta>
                {driver.carPhoto && <CarPhoto src={driver.carPhoto} alt="Vehicle" />}
              </CarCard>
            </Section>
          ) : null}

          {/* Reviews */}
          <Section>
            <SectionLabel>
              Reviews
              {reviewTotal > 0 && <ReviewCount>{reviewTotal}</ReviewCount>}
            </SectionLabel>

            {reviews.length === 0 ? (
              <EmptyReviews>No reviews yet — be the first after a completed trip.</EmptyReviews>
            ) : (
              <>
                {/* Rating bar chart */}
                {reviewTotal >= 3 && (
                  <RatingBreakdown>
                    {ratingDist.map(({ star, count }) => (
                      <BarRow key={star}>
                        <BarLabel>{star} <StarIcon sx={{ fontSize: 12, color: "#F6AD55", verticalAlign: "middle" }} /></BarLabel>
                        <BarTrack>
                          <BarFill pct={reviewTotal > 0 ? (count / reviewTotal) * 100 : 0} />
                        </BarTrack>
                        <BarCount>{count}</BarCount>
                      </BarRow>
                    ))}
                  </RatingBreakdown>
                )}

                <ReviewList>
                  {reviews.map((r) => (
                    <ReviewCard key={r._id}>
                      <ReviewTop>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: colors.skyBlue, fontSize: "0.8rem" }}>
                          {r.parent?.fullName?.[0] ?? "?"}
                        </Avatar>
                        <ReviewMeta>
                          <ReviewAuthor>{r.parent?.fullName ?? "Anonymous"}</ReviewAuthor>
                          <ReviewDate>{new Date(r.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" })}</ReviewDate>
                        </ReviewMeta>
                        <StarRow rating={r.rating} size={15} />
                      </ReviewTop>
                      {r.comment && (
                        <ReviewBody>
                          <FormatQuoteIcon sx={{ fontSize: 16, color: colors.border, mr: 0.5, transform: "scaleX(-1)" }} />
                          {r.comment}
                        </ReviewBody>
                      )}
                      {r.complaints && r.complaints.length > 0 && (
                        <ComplaintChips>
                          {r.complaints.map((c) => (
                            <Chip key={c} size="small" label={c} color="warning" variant="outlined" sx={{ fontSize: "0.7rem" }} />
                          ))}
                        </ComplaintChips>
                      )}
                    </ReviewCard>
                  ))}
                </ReviewList>
              </>
            )}
          </Section>

        </LeftCol>

        {/* ── RIGHT COLUMN ── */}
        <RightCol>
          <BookingCard>
            <SectionLabel>Book a Ride</SectionLabel>
            {!user ? (
              <RegisterPrompt>
                <Typography variant="body2" sx={{ color: colors.mutedText, mb: 3, textAlign: "center" }}>
                  Sign in to book a ride with {driver.fullName}.
                </Typography>
                <Button variant="contained" href="/register" fullWidth size="large" sx={{ borderRadius: "50px" }}>
                  Register
                </Button>
                <Button variant="outlined" href="/login" fullWidth size="large" sx={{ mt: 1.5, borderRadius: "50px" }}>
                  Sign In
                </Button>
              </RegisterPrompt>
            ) : user.userType === "parent" ? (
              <BookingForm parent={user} driverId={driver._id} />
            ) : (
              <Typography variant="body2" sx={{ color: colors.mutedText, textAlign: "center", mt: 2 }}>
                Only parents can book rides.
              </Typography>
            )}
          </BookingCard>
        </RightCol>
      </ContentGrid>
    </PageWrapper>
  );
}

function TagGroup({ label, items }: { label: string; items: string[] }) {
  return (
    <TagGroupWrap>
      <TagLabel>{label}</TagLabel>
      <TagList>
        {items.map((item) => (
          <Tag key={item}>{item}</Tag>
        ))}
      </TagList>
    </TagGroupWrap>
  );
}

/* ── Styled components ── */

const PageWrapper = styled.div`max-width: 1100px; margin: 0 auto; padding: 32px 24px;`;

const BackBtn = styled.button`
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: 1px solid ${colors.border};
  padding: 7px 18px; border-radius: 50px;
  color: ${colors.deepNavy}; font-weight: 600; font-size: 0.85rem;
  cursor: pointer; margin-bottom: 24px;
  transition: all 0.15s;
  &:hover { background: ${colors.deepNavy}; color: #fff; border-color: ${colors.deepNavy}; }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
  align-items: start;
  @media (max-width: 820px) { grid-template-columns: 1fr; }
`;

const LeftCol = styled.div`display: flex; flex-direction: column; gap: 16px;`;
const RightCol = styled.div``;

const HeroCard = styled.div`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 20px;
  padding: 24px;
  display: flex; gap: 20px; align-items: flex-start;
  box-shadow: 0 2px 16px rgba(26,54,93,0.06);
  @media (max-width: 500px) { flex-direction: column; }
`;

const HeroInfo = styled.div`display: flex; flex-direction: column; gap: 6px; flex: 1;`;

const HeroName = styled.h1`
  font-size: 1.4rem; font-weight: 800; color: ${colors.deepNavy}; margin: 0;
`;

const MetaLine = styled.div`
  display: flex; align-items: center; gap: 4px;
  font-size: 0.82rem; color: ${colors.mutedText};
`;

const RatingLine = styled.div`
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
`;

const ChipRow = styled.div`display: flex; gap: 6px; flex-wrap: wrap; margin-top: 2px;`;

const Section = styled.div`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(26,54,93,0.04);
`;

const SectionLabel = styled.h3`
  display: flex; align-items: center; gap: 8px;
  font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1.5px; color: ${colors.skyBlue}; margin: 0 0 14px;
`;

const ReviewCount = styled.span`
  background: ${colors.skyBlue};
  color: #fff;
  font-size: 0.65rem; font-weight: 700;
  padding: 1px 7px; border-radius: 50px;
`;

const TileGrid = styled.div`
  display: flex; flex-wrap: wrap; gap: 10px;
`;

const Tile = styled.div`
  display: flex; align-items: center; gap: 7px;
  background: ${colors.lightBg}; border: 1px solid ${colors.border};
  border-radius: 10px; padding: 8px 14px;
  font-size: 0.88rem; color: ${colors.slateCharcoal}; font-weight: 500;
`;

const DayChips = styled.div`display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px;`;
const DayChip = styled.span<{ active: boolean }>`
  width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.72rem; font-weight: 700;
  background: ${({ active }) => active ? colors.deepNavy : colors.lightBg};
  color: ${({ active }) => active ? "#fff" : colors.mutedText};
  border: 1px solid ${({ active }) => active ? colors.deepNavy : colors.border};
`;

const ShiftRow = styled.div`display: flex; gap: 8px; margin-bottom: 12px;`;
const ShiftBadge = styled.span<{ active: boolean }>`
  padding: 4px 14px; border-radius: 50px; font-size: 0.78rem; font-weight: 600;
  background: ${({ active }) => active ? colors.successGreen + "22" : colors.lightBg};
  color: ${({ active }) => active ? colors.successGreen : colors.mutedText};
  border: 1px solid ${({ active }) => active ? colors.successGreen + "44" : colors.border};
`;

const TagGroupWrap = styled.div`margin-top: 10px;`;
const TagLabel = styled.div`font-size: 0.72rem; font-weight: 700; color: ${colors.mutedText}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;`;
const TagList = styled.div`display: flex; flex-wrap: wrap; gap: 6px;`;
const Tag = styled.span`
  background: ${colors.skyBlue}18; color: ${colors.skyBlue};
  border: 1px solid ${colors.skyBlue}33;
  padding: 3px 10px; border-radius: 50px; font-size: 0.78rem; font-weight: 500;
`;

const CarsStack = styled.div`display: flex; flex-direction: column; gap: 12px;`;

const CarCard = styled.div<{ inactive: boolean }>`
  border: 1px solid ${({ inactive }) => inactive ? colors.border : colors.skyBlue + "44"};
  border-radius: 12px; padding: 14px 16px;
  background: ${({ inactive }) => inactive ? colors.lightBg : colors.pureWhite};
  opacity: ${({ inactive }) => inactive ? 0.7 : 1};
`;

const CarHeader = styled.div`display: flex; align-items: center; gap: 8px;`;
const CarName = styled.span`font-weight: 700; font-size: 0.92rem; color: ${colors.deepNavy};`;
const ColorDot = styled.span<{ color: string }>`
  width: 12px; height: 12px; border-radius: 50%;
  background: ${({ color }) => color};
  border: 1px solid ${colors.border};
  flex-shrink: 0;
`;

const CarMeta = styled.div`
  display: flex; align-items: center; gap: 6px; margin-top: 6px;
  font-size: 0.8rem; color: ${colors.mutedText};
`;

const Bullet = styled.span`width: 3px; height: 3px; border-radius: 50%; background: ${colors.border};`;

const CarPhoto = styled.img`
  width: 100%; max-height: 160px; object-fit: cover;
  border-radius: 8px; margin-top: 10px;
`;

const RatingBreakdown = styled.div`
  background: ${colors.lightBg}; border-radius: 10px;
  padding: 12px 16px; margin-bottom: 16px;
  display: flex; flex-direction: column; gap: 6px;
`;

const BarRow = styled.div`display: flex; align-items: center; gap: 8px;`;
const BarLabel = styled.span`font-size: 0.78rem; font-weight: 600; color: ${colors.deepNavy}; width: 28px; flex-shrink: 0;`;
const BarTrack = styled.div`flex: 1; height: 6px; background: ${colors.border}; border-radius: 3px; overflow: hidden;`;
const BarFill = styled.div<{ pct: number }>`
  height: 100%; width: ${({ pct }) => pct}%;
  background: #F6AD55; border-radius: 3px; transition: width 0.4s;
`;
const BarCount = styled.span`font-size: 0.75rem; color: ${colors.mutedText}; width: 20px; text-align: right; flex-shrink: 0;`;

const ReviewList = styled.div`display: flex; flex-direction: column; gap: 12px;`;

const ReviewCard = styled.div`
  border: 1px solid ${colors.border}; border-radius: 12px;
  padding: 14px 16px;
`;

const ReviewTop = styled.div`display: flex; align-items: center; gap: 10px;`;
const ReviewMeta = styled.div`flex: 1;`;
const ReviewAuthor = styled.div`font-size: 0.87rem; font-weight: 700; color: ${colors.deepNavy};`;
const ReviewDate = styled.div`font-size: 0.75rem; color: ${colors.mutedText};`;

const ReviewBody = styled.p`
  font-size: 0.87rem; color: ${colors.slateCharcoal};
  margin: 10px 0 0; line-height: 1.55;
`;

const ComplaintChips = styled.div`display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;`;

const EmptyReviews = styled.p`
  font-size: 0.875rem; color: ${colors.mutedText}; text-align: center; padding: 20px 0;
`;

const BookingCard = styled.div`
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(26,54,93,0.06);
  position: sticky; top: 24px;
`;

const RegisterPrompt = styled.div``;

const LoadingWrap = styled.div`
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  min-height: 60vh; text-align: center; gap: 8px;
`;

const LoadingText = styled.p`
  font-size: 0.92rem; color: ${colors.mutedText}; font-style: italic; margin-top: 8px;
`;

