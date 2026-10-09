"use client";

import React, { useEffect, useRef, useState } from "react";
import MapboxMap, { MapMouseEvent, Marker, NavigationControl, MapRef } from "react-map-gl/mapbox";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import GroupsIcon from "@mui/icons-material/Groups";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import axios from "axios";
import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { colors } from "@/lib/theme";

interface Place {
  id: string;
  place_name: string;
  center: [number, number];
}

interface School {
  _id: string;
  name: string;
  estate: string;
  location?: { coordinates: [number, number] };
}

interface Address {
  label: string;
  placeId?: string;
  lat: number;
  lng: number;
}

interface DriverMatch {
  _id: string;
  fullName: string;
  photo?: string;
  averageRating?: number;
  cars?: { make: string; model: string; availableSeats: number; isActive: boolean }[];
  schools?: School[];
  slotCapacity?: number;
  slotBookedSeats?: number;
  slotAvailableSeats?: number;
}

type Duration = "semester" | "month" | "week" | "one_off";

const NAIROBI = { latitude: -1.2921, longitude: 36.8219 };
const DURATION_LABELS: Record<Duration, string> = {
  semester: "Semester",
  month: "Month",
  week: "Week",
  one_off: "One off",
};

function dateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function dateFromKey(key: string) {
  return new Date(`${key}T12:00:00Z`);
}

function addDateDays(key: string, amount: number) {
  const date = dateFromKey(key);
  date.setUTCDate(date.getUTCDate() + amount);
  return dateKey(date);
}

function kenyaNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    hour: Number(value("hour")),
    minute: Number(value("minute")),
  };
}

function isSchoolDay(key: string, holidays: Set<string>) {
  const weekday = dateFromKey(key).getUTCDay();
  return weekday !== 0 && weekday !== 6 && !holidays.has(key);
}

function nextSchoolDay(key: string, holidays: Set<string>) {
  let candidate = key;
  for (let attempts = 0; attempts < 370 && !isSchoolDay(candidate, holidays); attempts += 1) {
    candidate = addDateDays(candidate, 1);
  }
  return candidate;
}

function previousSchoolDay(key: string, holidays: Set<string>) {
  let candidate = key;
  for (let attempts = 0; attempts < 370 && !isSchoolDay(candidate, holidays); attempts += 1) {
    candidate = addDateDays(candidate, -1);
  }
  return candidate;
}

function dateForDuration(start: string, duration: Duration, holidays: Set<string>) {
  if (duration === "one_off") return start;
  let end = start;
  if (duration === "week") {
    const weekday = dateFromKey(start).getUTCDay();
    end = addDateDays(start, (5 - weekday + 7) % 7);
  } else if (duration === "month") {
    const date = dateFromKey(start);
    end = dateKey(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12)));
  } else {
    const date = dateFromKey(start);
    const year = date.getUTCFullYear();
    const candidates = [`${year}-04-14`, `${year}-08-14`, `${year}-12-14`, `${year + 1}-04-14`];
    end = candidates.find((candidate) => candidate >= start) ?? `${year + 1}-04-14`;
  }
  return isSchoolDay(end, holidays) ? end : previousSchoolDay(end, holidays);
}

function suggestedStartDate(schoolIsDestination: boolean, holidays: Set<string>, now = kenyaNow()) {
  if (schoolIsDestination) return nextSchoolDay(addDateDays(now.date, 1), holidays);
  const afterTen = now.hour > 10 || (now.hour === 10 && now.minute > 0);
  return afterTen && now.hour < 17
    ? (isSchoolDay(now.date, holidays) ? now.date : nextSchoolDay(now.date, holidays))
    : nextSchoolDay(addDateDays(now.date, 1), holidays);
}

function timeInKenya(value: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  return `${parts.find((part) => part.type === "hour")?.value ?? "07"}:${parts.find((part) => part.type === "minute")?.value ?? "00"}`;
}

function previousBookingTimes(bookings: any[]) {
  const latest = [...bookings].sort((first, second) =>
    new Date(second.createdAt ?? second.tripDate).getTime() - new Date(first.createdAt ?? first.tripDate).getTime(),
  )[0];
  if (!latest) return { morning: "", evening: "" };
  const tripTime = timeInKenya(latest.tripDate);
  const hasMorning = ["morning", "both"].includes(latest.direction);
  const hasEvening = ["evening", "both"].includes(latest.direction);
  const morning = hasMorning ? latest.recurringMeta?.morningTime || tripTime : "";
  const evening = hasEvening
    ? latest.recurringMeta?.eveningTime || latest.returnTime || (latest.direction === "evening" ? tripTime : "")
    : "";
  return { morning, evening };
}

export default function RideRequestWizard() {
  const router = useRouter();
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapRef = useRef<MapRef>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [recentSchoolId, setRecentSchoolId] = useState("");
  const [schoolIsDestination, setSchoolIsDestination] = useState(true);
  const [preferredTimes, setPreferredTimes] = useState({ morning: "", evening: "" });
  const [holidayDates, setHolidayDates] = useState<string[]>([]);
  const [address, setAddress] = useState<Address | null>(null);
  const [addressText, setAddressText] = useState("");
  const [addressHistory, setAddressHistory] = useState<Address[]>([]);
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [duration, setDuration] = useState<Duration>("semester");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tripDate, setTripDate] = useState("");
  const [tripTime, setTripTime] = useState("07:00");
  const [mapOpen, setMapOpen] = useState(false);
  const [mapQuery, setMapQuery] = useState("");
  const [mapCenter, setMapCenter] = useState(NAIROBI);
  const [mapSelection, setMapSelection] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [matches, setMatches] = useState<DriverMatch[] | null>(null);
  const [matchError, setMatchError] = useState("");
  const scheduleTouched = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      axios.get("/api/schools"),
      axios.get("/api/parents/locations", { withCredentials: true }).catch(() => null),
      axios.get("/api/bookings?limit=50", { withCredentials: true }).catch(() => null),
    ])
      .then(([schoolResponse, locationResponse, bookingResponse]) => {
        if (!active) return;
        const availableSchools: School[] = schoolResponse.data.success ? schoolResponse.data.data : [];
        setSchools(availableSchools);
        const history: Address[] = locationResponse?.data?.success
          ? locationResponse.data.data.locationHistory ?? []
          : [];
        setAddressHistory(history);

        const bookings = bookingResponse?.data?.success ? bookingResponse.data.data : [];
        setPreferredTimes(previousBookingTimes(bookings));
        const previousSchool = bookings
          .flatMap((booking: any) => booking.children ?? [])
          .map((child: any) => availableSchools.find((school) => school.name === child.school)?._id)
          .find(Boolean) ?? "";
        if (previousSchool) {
          setRecentSchoolId(previousSchool);
          setSchoolId(previousSchool);
        }
      })
      .catch(() => setMatchError("Could not load schools. Refresh and try again."))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!schoolId) {
      setHolidayDates([]);
      return;
    }
    let active = true;
    const now = kenyaNow();
    const year = Number(now.date.slice(0, 4));
    axios.get(`/api/holidays?schoolId=${encodeURIComponent(schoolId)}&from=${now.date}&to=${year + 1}-12-31`)
      .then((response) => {
        if (active) setHolidayDates((response.data.data ?? []).map((holiday: { date: string }) => holiday.date));
      })
      .catch(() => { if (active) setHolidayDates([]); });
    return () => { active = false; };
  }, [schoolId]);

  useEffect(() => {
    if (loading || !schoolId || scheduleTouched.current) return;
    const holidays = new Set(holidayDates);
    const now = kenyaNow();
    const suggestedDate = suggestedStartDate(schoolIsDestination, holidays, now);
    const afterTen = now.hour > 10 || (now.hour === 10 && now.minute > 0);
    const previousTime = schoolIsDestination ? preferredTimes.morning : preferredTimes.evening;
    const isPastFiveFromSchool = !schoolIsDestination && now.hour >= 17;
    const suggestedTime = isPastFiveFromSchool
      ? "07:00"
      : previousTime || (schoolIsDestination || !afterTen ? "07:00" : "17:00");
    setTripDate(suggestedDate);
    setStartDate(suggestedDate);
    setEndDate(dateForDuration(suggestedDate, duration, holidays));
    setTripTime(suggestedTime);
  }, [duration, holidayDates, loading, preferredTimes, schoolId, schoolIsDestination]);

  const selectedSchool = schools.find((school) => school._id === schoolId) ?? null;
  const destinationAddress = schoolIsDestination ? selectedSchool : address;
  const originAddress = schoolIsDestination ? address : selectedSchool;
  const dateValid = duration === "one_off"
    ? Boolean(tripDate)
    : Boolean(startDate && endDate && new Date(endDate) >= new Date(startDate));
  const canSearch = Boolean(selectedSchool && address && tripTime && dateValid && token && !searching);

  const searchPlaces = async (value: string, forMap = false) => {
    if (!token || value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const params = new URLSearchParams({
        access_token: token,
        country: "ke",
        types: "address,poi,neighborhood,locality",
        limit: "6",
        language: "en",
      });
      if (forMap) params.set("proximity", `${mapCenter.longitude},${mapCenter.latitude}`);
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value.trim())}.json?${params}`,
      );
      const data = await response.json();
      setSuggestions(data.features ?? []);
    } catch {
      setSuggestions([]);
    }
  };

  const onAddressChange = (value: string) => {
    setAddressText(value);
    setAddress(null);
    setMatches(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchPlaces(value), 300);
  };

  const choosePlace = (place: Place, forMap = false) => {
    const [lng, lat] = place.center;
    const selected = { label: place.place_name, placeId: place.id, lat, lng };
    setAddress(selected);
    setAddressText(selected.label);
    setMatchError("");
    setSuggestions([]);
    setMapCenter({ longitude: lng, latitude: lat });
    setMapSelection(selected);
    if (forMap) {
      mapRef.current?.flyTo({ center: [lng, lat], zoom: 16, duration: 650 });
      setMapQuery(selected.label);
    }
  };

  const useRecentAddress = (recent: Address) => {
    setAddress(recent);
    setAddressText(recent.label);
    setMapCenter({ longitude: recent.lng, latitude: recent.lat });
    setMatches(null);
    setMatchError("");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMatchError("Location access is not available in this browser.");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude: lat, longitude: lng } = position.coords;
      setMapCenter({ latitude: lat, longitude: lng });
      try {
        const params = new URLSearchParams({ access_token: token ?? "", language: "en" });
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?${params}`);
        const data = await response.json();
        const feature = data.features?.[0];
        const selected = {
          label: feature?.place_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          placeId: feature?.id,
          lat,
          lng,
        };
        setAddress(selected);
        setAddressText(selected.label);
        setMatches(null);
        setMatchError("");
      } catch {
        setMatchError("Could not find your current address. Try searching for it instead.");
      } finally {
        setGettingLocation(false);
      }
    }, () => {
      setGettingLocation(false);
      setMatchError("Allow location access or enter your address manually.");
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  const openMap = () => {
    setMapQuery(addressText);
    setMapSelection(address);
    setSuggestions([]);
    setMapOpen(true);
    if (address) setMapCenter({ latitude: address.lat, longitude: address.lng });
    if (addressText.trim()) void searchPlaces(addressText, true);
  };

  const handleMapClick = async (event: MapMouseEvent) => {
    const { lat, lng } = event.lngLat;
    const candidate = { label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng };
    setMapSelection(candidate);
    setMapCenter({ latitude: lat, longitude: lng });
    try {
      const params = new URLSearchParams({ access_token: token ?? "", language: "en" });
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?${params}`);
      const data = await response.json();
      if (data.features?.[0]) setMapSelection({ ...candidate, label: data.features[0].place_name, placeId: data.features[0].id });
    } catch {}
  };

  const confirmMapLocation = () => {
    if (!mapSelection) return;
    setAddress(mapSelection);
    setAddressText(mapSelection.label);
    setMatches(null);
    setMatchError("");
    setMapOpen(false);
  };

  const findDrivers = async () => {
    if (!canSearch || !selectedSchool || !address) return;
    setSearching(true);
    setMatchError("");
    setMatches(null);
    try {
      try {
        const historyResponse = await axios.post(
          "/api/parents/locations",
          { kind: "history", address },
          { withCredentials: true },
        );
        setAddressHistory(historyResponse.data.data.locationHistory ?? []);
      } catch {
        // Guests can search drivers; only signed-in parents have saved history.
      }
      const requestedStart = duration === "one_off" ? tripDate : startDate;
      const params = new URLSearchParams({
        school: selectedSchool._id,
        limit: "50",
        duration,
        startDate: requestedStart,
        endDate: duration === "one_off" ? requestedStart : endDate,
        time: tripTime,
        direction: schoolIsDestination ? "morning" : "evening",
      });
      const response = await axios.get(`/api/drivers?${params.toString()}`);
      const candidates: DriverMatch[] = response.data.data ?? [];
      const withSeats = candidates.filter((driver) =>
        driver.cars?.some((car) => car.isActive && car.availableSeats > 0) &&
        (driver.slotAvailableSeats ?? driver.cars?.find((car) => car.isActive)?.availableSeats ?? 0) > 0,
      );
      setMatches(withSeats);
      if (withSeats.length === 0) setMatchError(`No online drivers with available seats are listed for ${selectedSchool.name} yet.`);
      if (withSeats.length === 1) selectDriver(withSeats[0]._id);
    } catch (error: any) {
      setMatchError(error?.response?.data?.message ?? "Could not find drivers right now. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const selectDriver = (driverId: string) => {
    if (!selectedSchool || !address) return;
    const schoolAddress: Address = {
      label: `${selectedSchool.name}, ${selectedSchool.estate}`,
      lat: selectedSchool.location?.coordinates?.[1] ?? NAIROBI.latitude,
      lng: selectedSchool.location?.coordinates?.[0] ?? NAIROBI.longitude,
    };
    const pickup = schoolIsDestination ? address : schoolAddress;
    const dropoff = schoolIsDestination ? schoolAddress : address;
    sessionStorage.setItem("schoolwheelz.bookingLocations", JSON.stringify({ pickup, dropoff }));
    sessionStorage.setItem("schoolwheelz.bookingContext", JSON.stringify({
      schoolId: selectedSchool._id,
      schoolName: selectedSchool.name,
      schoolIsDestination,
      duration,
      startDate: duration === "one_off" ? tripDate : startDate,
      endDate: duration === "one_off" ? undefined : endDate,
      tripTime,
      direction: schoolIsDestination ? "morning" : "evening",
    }));
    router.push(`/drivers/${driverId}`);
  };

  if (loading) return <LoadingPanel><CircularProgress /><span>Loading supported schools...</span></LoadingPanel>;

  return (
    <Wizard>
      <WizardHeading>
        <Eyebrow>YOUR SCHOOL RUN</Eyebrow>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 850, color: "#20211E" }}>Plan a school ride</Typography>
        <Intro>Choose the school and your address. We&apos;ll show drivers who serve that route.</Intro>
      </WizardHeading>

      <Reassurance role="note">
        <GroupsIcon aria-hidden="true" />
        <div>
          <ReassuranceTitle>Same friendly face every morning</ReassuranceTitle>
          <ReassuranceText>For a term booking, your child keeps the same assigned driver. Familiar neighborhood riders can help the school run feel like a routine.</ReassuranceText>
        </div>
      </Reassurance>

      {!token && <ErrorText>Add NEXT_PUBLIC_MAPBOX_TOKEN to enable address search.</ErrorText>}
      <StepSection>
        <StepNumber>1</StepNumber>
        <StepBody>
          <StepHeader>
            <div>
              <StepTitle>{schoolIsDestination ? "Where to?" : "Where from?"}</StepTitle>
              <StepHint>Choose one of the supported schools.</StepHint>
            </div>
            <TooltipButton title="Swap school and address direction" onClick={() => { scheduleTouched.current = false; setSchoolIsDestination((value) => !value); }}>
              <SwapVertIcon />
            </TooltipButton>
          </StepHeader>
          <TextField
            select
            label="Supported school"
            value={schoolId}
            onChange={(event) => { scheduleTouched.current = false; setSchoolId(event.target.value); setMatches(null); }}
            fullWidth
          >
            {schools.map((school) => (
              <MenuItem key={school._id} value={school._id}>
                {school.name} · {school.estate}{school._id === recentSchoolId ? " · Recent" : ""}
              </MenuItem>
            ))}
          </TextField>
          {schools.length === 0 && <ErrorText>No supported schools are listed yet.</ErrorText>}
        </StepBody>
      </StepSection>

      {selectedSchool && (
        <StepSection $animate key={`address-${schoolId}-${schoolIsDestination}`}>
          <StepNumber>2</StepNumber>
          <StepBody>
            <StepTitle>{schoolIsDestination ? "Where from?" : "Where to?"}</StepTitle>
            <StepHint>Enter an address, use your current location, or choose it on the map.</StepHint>
            <AddressInputRow>
              <TextField
                label="Home or pick-up address"
                placeholder="Enter an estate, building, or street"
                value={addressText}
                onChange={(event) => onAddressChange(event.target.value)}
                fullWidth
                disabled={!token}
                autoComplete="off"
                InputProps={{
                  endAdornment: (
                    <IconButton aria-label="Choose address on map" title="Choose address on map" onClick={openMap} disabled={!token}>
                      <MapOutlinedIcon />
                    </IconButton>
                  ),
                }}
              />
              <Button
                variant="outlined"
                startIcon={gettingLocation ? <CircularProgress size={16} /> : <MyLocationIcon />}
                onClick={useCurrentLocation}
                disabled={gettingLocation || !token}
              >
                Use current address
              </Button>
            </AddressInputRow>
            {suggestions.length > 0 && (
              <SuggestionList>
                {suggestions.map((place) => (
                  <SuggestionButton key={place.id} onClick={() => choosePlace(place)}>{place.place_name}</SuggestionButton>
                ))}
              </SuggestionList>
            )}
            {addressHistory.length > 0 && (
              <HistorySection>
                <StepHint>Previously used locations</StepHint>
                <HistoryRow>
                  {addressHistory.slice(0, 8).map((recent) => (
                    <HistoryButton key={recent.placeId ?? recent.label} $selected={address?.label === recent.label} onClick={() => useRecentAddress(recent)}>
                      {recent.label}
                    </HistoryButton>
                  ))}
                </HistoryRow>
              </HistorySection>
            )}
            {address && <SelectedAddress>Selected: {address.label}</SelectedAddress>}
          </StepBody>
        </StepSection>
      )}

      {selectedSchool && address && (
        <StepSection $animate key={`schedule-${duration}`}>
          <StepNumber>3</StepNumber>
          <StepBody>
            <StepTitle>How often?</StepTitle>
            <StepHint>Choose a booking duration and preferred travel time.</StepHint>
            <DurationRow>
              {(["semester", "month", "week", "one_off"] as Duration[]).map((option) => (
                <DurationButton key={option} $selected={duration === option} onClick={() => { setDuration(option); if (startDate) setEndDate(dateForDuration(startDate, option, new Set(holidayDates))); setMatches(null); }}>
                  {DURATION_LABELS[option]}
                </DurationButton>
              ))}
            </DurationRow>
            {duration === "one_off" ? (
              <ScheduleFields>
                <TextField type="date" label="Trip date" value={tripDate} onChange={(event) => setTripDate(event.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ min: new Date().toISOString().slice(0, 10) }} />
                <TextField type="date" label="Trip date" value={tripDate} onChange={(event) => { const value = event.target.value; scheduleTouched.current = true; setTripDate(value); setStartDate(value); }} InputLabelProps={{ shrink: true }} inputProps={{ min: kenyaNow().date }} />
                <TextField type="time" label="Preferred time" value={tripTime} onChange={(event) => { scheduleTouched.current = true; setTripTime(event.target.value); }} InputLabelProps={{ shrink: true }} />
              </ScheduleFields>
            ) : (
              <ScheduleFields>
                <TextField type="date" label="Start date" value={startDate} onChange={(event) => { const value = event.target.value; scheduleTouched.current = true; setStartDate(value); setTripDate(value); setEndDate(dateForDuration(value, duration, new Set(holidayDates))); }} InputLabelProps={{ shrink: true }} inputProps={{ min: kenyaNow().date }} />
                <TextField type="date" label={duration === "semester" ? "Semester end date" : `${DURATION_LABELS[duration]} end date`} value={endDate} onChange={(event) => { scheduleTouched.current = true; setEndDate(event.target.value); }} InputLabelProps={{ shrink: true }} inputProps={{ min: startDate || kenyaNow().date }} />
                <TextField type="time" label="Preferred time" value={tripTime} onChange={(event) => { scheduleTouched.current = true; setTripTime(event.target.value); }} InputLabelProps={{ shrink: true }} />
              </ScheduleFields>
            )}
            <GoButton onClick={findDrivers} disabled={!canSearch}>
              {searching ? <><CircularProgress size={22} sx={{ color: "#20211E", mr: 1 }} /> Looking for drivers...</> : <>GO <ArrowForwardIcon /></>}
            </GoButton>
            {matchError && <ErrorText>{matchError}</ErrorText>}
            {matches && matches.length > 0 && (
              <Matches aria-live="polite">
                <MatchesTitle>Drivers serving {selectedSchool.name}</MatchesTitle>
                <StepHint>These are available driver profiles, not confirmed assignments. Booking requests still need approval.</StepHint>
                {matches.map((driver) => {
                  const activeCar = driver.cars?.find((car) => car.isActive);
                  return (
                    <DriverMatchButton key={driver._id} onClick={() => selectDriver(driver._id)}>
                      <span><strong>{driver.fullName}</strong><small>{activeCar ? `${activeCar.make} ${activeCar.model} · ${driver.slotAvailableSeats ?? activeCar.availableSeats} seats free for this slot` : "Vehicle details unavailable"}</small></span>
                      <ArrowForwardIcon />
                    </DriverMatchButton>
                  );
                })}
              </Matches>
            )}
          </StepBody>
        </StepSection>
      )}

      <Dialog open={mapOpen} onClose={() => setMapOpen(false)} fullWidth maxWidth="md" fullScreen={typeof window !== "undefined" && window.innerWidth < 650}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Choose your address
          <IconButton aria-label="Close map" onClick={() => setMapOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.5, pb: 2 }}>
          <TextField
            label="Search places"
            value={mapQuery}
            onChange={(event) => {
              const value = event.target.value;
              setMapQuery(value);
              if (searchTimer.current) clearTimeout(searchTimer.current);
              searchTimer.current = setTimeout(() => void searchPlaces(value, true), 300);
            }}
            fullWidth
          />
          {suggestions.length > 0 && (
            <SuggestionList>
              {suggestions.map((place) => (
                <SuggestionButton key={place.id} onClick={() => choosePlace(place, true)}>{place.place_name}</SuggestionButton>
              ))}
            </SuggestionList>
          )}
          {token ? (
            <MapFrame>
              <MapboxMap
                ref={mapRef}
                initialViewState={{ ...mapCenter, zoom: mapSelection ? 15 : 11 }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                mapboxAccessToken={token}
                onClick={handleMapClick}
                style={{ width: "100%", height: "100%" }}
              >
                <NavigationControl position="top-right" />
                {mapSelection && <Marker longitude={mapSelection.lng} latitude={mapSelection.lat} color="#F2C230" />}
              </MapboxMap>
            </MapFrame>
          ) : <ErrorText>Mapbox search is not configured.</ErrorText>}
          {mapSelection && <SelectedAddress>{mapSelection.label}</SelectedAddress>}
          <Button variant="contained" onClick={confirmMapLocation} disabled={!mapSelection}>Use this address</Button>
        </DialogContent>
      </Dialog>
    </Wizard>
  );
}

const reveal = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;
const Wizard = styled.div`
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 24px 0 48px;
`;
const WizardHeading = styled.header`
  margin: 0 0 24px;
  padding-bottom: 22px;
  border-bottom: 1px solid ${colors.border};
`;
const Eyebrow = styled.div`
  margin-bottom: 6px;
  color: #876600;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
`;
const Intro = styled.p`
  margin: 8px 0 0;
  color: ${colors.mutedText};
  font-size: 0.92rem;
`;
const Reassurance = styled.aside`
  display: flex;
  align-items: flex-start;
  gap: 11px;
  margin: -8px 0 20px;
  padding: 12px 14px;
  border-left: 3px solid #F2C230;
  background: #FFF8DE;
  color: #514A35;
  svg { flex: 0 0 auto; color: #876600; margin-top: 1px; }
`;
const ReassuranceTitle = styled.p`
  margin: 0;
  color: #292923;
  font-size: 0.87rem;
  font-weight: 800;
`;
const ReassuranceText = styled.p`
  margin: 3px 0 0;
  color: #625E53;
  font-size: 0.76rem;
  line-height: 1.45;
`;
const StepSection = styled.section<{ $animate?: boolean }>`
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 12px;
  margin: 16px 0;
  padding: 18px;
  border: 1px solid ${colors.border};
  border-radius: 6px;
  background: #FFFDF7;
  animation: ${({ $animate }) => $animate ? reveal : "none"} 300ms ease-out both;
`;
const StepNumber = styled.div`
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #F2C230;
  color: #20211E;
  font-size: 0.82rem;
  font-weight: 800;
`;
const StepBody = styled.div`display: grid; gap: 12px; min-width: 0;`;
const StepHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`;
const StepTitle = styled.h2`
  margin: 0;
  color: #20211E;
  font-size: 1.1rem;
  font-weight: 800;
`;
const StepHint = styled.p`
  margin: 3px 0 0;
  color: ${colors.mutedText};
  font-size: 0.8rem;
  line-height: 1.5;
`;
const TooltipButton = styled(IconButton)`
  && { color: #5E4A08; border: 1px solid ${colors.border}; }
`;
const AddressInputRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;
const SuggestionList = styled.div`
  position: relative;
  z-index: 3;
  display: grid;
  border: 1px solid ${colors.border};
  background: #fff;
  box-shadow: 0 8px 20px rgba(32, 33, 30, 0.1);
`;
const SuggestionButton = styled.button`
  padding: 10px 12px;
  border: 0;
  border-bottom: 1px solid #EEEADF;
  background: #fff;
  color: #292923;
  text-align: left;
  font-size: 0.82rem;
  cursor: pointer;
  &:hover { background: #FFF7D8; }
`;
const HistorySection = styled.div`display: grid; gap: 8px;`;
const HistoryRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
`;
const HistoryButton = styled.button<{ $selected: boolean }>`
  max-width: 100%;
  padding: 7px 10px;
  overflow: hidden;
  border: 1px solid ${({ $selected }) => $selected ? "#B78A00" : colors.border};
  border-radius: 4px;
  background: ${({ $selected }) => $selected ? "#FFF2B9" : "#fff"};
  color: #35362F;
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
`;
const SelectedAddress = styled.div`
  color: #514A35;
  font-size: 0.82rem;
  overflow-wrap: anywhere;
`;
const DurationRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 7px;
  @media (max-width: 520px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;
const DurationButton = styled.button<{ $selected: boolean }>`
  min-height: 42px;
  padding: 7px;
  border: 1px solid ${({ $selected }) => $selected ? "#A37A00" : colors.border};
  border-radius: 4px;
  background: ${({ $selected }) => $selected ? "#F2C230" : "#fff"};
  color: #20211E;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
`;
const ScheduleFields = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
`;
const GoButton = styled(Button)`
  && {
    display: flex;
    width: min(210px, 100%);
    min-height: 64px;
    margin: 12px auto 2px;
    border-radius: 999px;
    background: #F2C230;
    color: #20211E;
    font-size: 1.12rem;
    font-weight: 900;
    letter-spacing: 0.06em;
    box-shadow: 0 0 0 0 rgba(242, 194, 48, 0.45);
    animation: goPulse 2.2s ease-out infinite;
    &:hover { background: #E5B51D; }
    &:disabled { background: #E7E2D3; color: #77746B; animation: none; }
    @keyframes goPulse {
      0% { box-shadow: 0 0 0 0 rgba(242, 194, 48, 0.38); }
      70% { box-shadow: 0 0 0 11px rgba(242, 194, 48, 0); }
      100% { box-shadow: 0 0 0 0 rgba(242, 194, 48, 0); }
    }
  }
`;
const ErrorText = styled.p`
  margin: 0;
  color: #A33A2A;
  font-size: 0.83rem;
`;
const Matches = styled.div`
  display: grid;
  gap: 8px;
  margin-top: 12px;
`;
const MatchesTitle = styled.h3`
  margin: 0;
  color: #20211E;
  font-size: 0.94rem;
  font-weight: 800;
`;
const DriverMatchButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid ${colors.border};
  background: #fff;
  color: #20211E;
  text-align: left;
  cursor: pointer;
  &:hover { border-color: #B78A00; background: #FFF9E4; }
  span { display: grid; gap: 3px; }
  small { color: ${colors.mutedText}; }
`;
const MapFrame = styled.div`
  height: min(56vh, 480px);
  min-height: 280px;
  overflow: hidden;
  border: 1px solid ${colors.border};
`;
const LoadingPanel = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 300px;
  color: ${colors.mutedText};
`;