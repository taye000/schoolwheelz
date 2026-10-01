"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Autocomplete as GoogleAutocomplete,
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import {
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HistoryIcon from "@mui/icons-material/History";
import PlaceIcon from "@mui/icons-material/Place";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import toast from "react-hot-toast";
import styled from "styled-components";

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

export interface BookingAddress {
  label: string;
  placeId?: string;
  lat: number;
  lng: number;
}

interface AddressLists {
  savedAddresses: BookingAddress[];
  locationHistory: BookingAddress[];
}

interface BookingLocationsProps {
  onContinue: () => void;
}

const PLACES_LIBRARIES: ("places")[] = ["places"];
const EMPTY_LISTS: AddressLists = { savedAddresses: [], locationHistory: [] };

export default function BookingLocations({ onContinue }: BookingLocationsProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "schoolwheelz-google-maps",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: PLACES_LIBRARIES,
  });
  const [pickup, setPickup] = useState<BookingAddress | null>(null);
  const [dropoff, setDropoff] = useState<BookingAddress | null>(null);
  const [pickupText, setPickupText] = useState("");
  const [dropoffText, setDropoffText] = useState("");
  const [lists, setLists] = useState<AddressLists>(EMPTY_LISTS);
  const [saving, setSaving] = useState(false);
  const [mapsAuthError, setMapsAuthError] = useState(false);
  const pickupAutocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  const dropoffAutocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  const mapAutocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  const mapPickerRef = useRef<HTMLDivElement | null>(null);
  const [mapTarget, setMapTarget] = useState<"pickup" | "dropoff" | null>(null);
  const [mapQuery, setMapQuery] = useState("");
  const [mapCandidate, setMapCandidate] = useState<BookingAddress | null>(null);

  useEffect(() => {
    axios
      .get("/api/parents/locations", { withCredentials: true })
      .then((response) => {
        if (response.data.success) setLists(response.data.data);
      })
      .catch(() => {});
    try {
      const stored = sessionStorage.getItem("schoolwheelz.bookingLocations");
      if (stored) {
        const locations = JSON.parse(stored) as { pickup: BookingAddress; dropoff: BookingAddress };
        setPickup(locations.pickup);
        setDropoff(locations.dropoff);
        setPickupText(locations.pickup.label);
        setDropoffText(locations.dropoff.label);
      }
    } catch {
      sessionStorage.removeItem("schoolwheelz.bookingLocations");
    }
  }, []);

  useEffect(() => {
    const previousHandler = window.gm_authFailure;
    window.gm_authFailure = () => {
      previousHandler?.();
      setMapsAuthError(true);
    };
    return () => { window.gm_authFailure = previousHandler; };
  }, []);

  useEffect(() => {
    if (mapTarget) mapPickerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [mapTarget]);

  const addressFromPlace = (place: google.maps.places.PlaceResult) => {
    const point = place.geometry?.location;
    const label = place.formatted_address || place.name;
    if (!point || !label) {
      toast.error("Choose a result with a full address.");
      return null;
    }
    return {
      label,
      placeId: place.place_id,
      lat: point.lat(),
      lng: point.lng(),
    };
  };

  const selectSaved = (address: BookingAddress, field: "pickup" | "dropoff") => {
    if (field === "pickup") {
      setPickup(address);
      setPickupText(address.label);
    } else {
      setDropoff(address);
      setDropoffText(address.label);
    }
  };

  const openMapPicker = (field: "pickup" | "dropoff") => {
    setMapTarget(field);
    setMapQuery(field === "pickup" ? pickupText : dropoffText);
    setMapCandidate(field === "pickup" ? pickup : dropoff);
  };

  const useMapLocation = () => {
    if (!mapTarget || !mapCandidate) return;
    if (mapTarget === "pickup") {
      setPickup(mapCandidate);
      setPickupText(mapCandidate.label);
    } else {
      setDropoff(mapCandidate);
      setDropoffText(mapCandidate.label);
    }
    setMapTarget(null);
  };

  const saveAddress = async (address: BookingAddress) => {
    setSaving(true);
    try {
      const response = await axios.post(
        "/api/parents/locations",
        { kind: "saved", address },
        { withCredentials: true },
      );
      setLists((previous) => ({ ...previous, savedAddresses: response.data.data.savedAddresses }));
      toast.success("Address saved.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Sign in to save addresses.");
    } finally {
      setSaving(false);
    }
  };

  const removeSaved = async (address: BookingAddress) => {
    try {
      const response = await axios.delete("/api/parents/locations", {
        data: { placeId: address.placeId, label: address.label },
        withCredentials: true,
      });
      setLists((previous) => ({ ...previous, savedAddresses: response.data.data }));
    } catch {
      toast.error("Could not remove that saved address.");
    }
  };

  const continueToDrivers = async () => {
    if (!pickup || !dropoff) return;
    const locations = { pickup, dropoff };
    sessionStorage.setItem("schoolwheelz.bookingLocations", JSON.stringify(locations));
    setSaving(true);
    try {
      await axios.post(
        "/api/parents/locations",
        { kind: "history", address: pickup },
        { withCredentials: true },
      );
      const result = await axios.post(
        "/api/parents/locations",
        { kind: "history", address: dropoff },
        { withCredentials: true },
      );
      setLists((previous) => ({ ...previous, locationHistory: result.data.data.locationHistory }));
    } catch {
      // Location selection still works for guests; history is account-backed.
    } finally {
      setSaving(false);
      onContinue();
    }
  };

  const savedKeys = new Set(lists.savedAddresses.map((address) => address.placeId || address.label));

  return (
    <LocationPanel>
      <PanelHeading>
        <div>
          <Eyebrow>YOUR SCHOOL RUN</Eyebrow>
          <Typography component="h2" variant="h5" sx={{ fontWeight: 800, color: "#20211E" }}>
            Where are we going?
          </Typography>
        </div>
        <PlaceIcon sx={{ color: "#20211E", fontSize: 30 }} />
      </PanelHeading>

      {loadError || mapsAuthError || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
        <ErrorText>Google Maps search is unavailable. Check that the Maps JavaScript and Places APIs are enabled and the browser key allows this site.</ErrorText>
      ) : !isLoaded ? (
        <LoadingRow><CircularProgress size={18} /> Loading address search</LoadingRow>
      ) : (
        <AddressFields>
          <GoogleAutocomplete
            onLoad={(autocomplete) => { pickupAutocomplete.current = autocomplete; }}
            options={{ componentRestrictions: { country: "ke" }, fields: ["formatted_address", "geometry", "place_id", "name"] }}
            onPlaceChanged={() => {
              const selected = addressFromPlace(pickupAutocomplete.current?.getPlace() ?? {});
              if (selected) {
                setPickup(selected);
                setPickupText(selected.label);
              }
            }}
          >
            <TextField
              label="Pick-up address"
              placeholder="Home, gate, apartment..."
              value={pickupText}
              onChange={(event) => { setPickupText(event.target.value); setPickup(null); }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Find this pick-up on the map">
                      <span><IconButton edge="end" aria-label="Find pick-up on map" onClick={() => openMapPicker("pickup")} disabled={!pickupText.trim()}><MapOutlinedIcon /></IconButton></span>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              fullWidth
              inputProps={{ "aria-label": "Pick-up address" }}
            />
          </GoogleAutocomplete>
          <GoogleAutocomplete
            onLoad={(autocomplete) => { dropoffAutocomplete.current = autocomplete; }}
            options={{ componentRestrictions: { country: "ke" }, fields: ["formatted_address", "geometry", "place_id", "name"] }}
            onPlaceChanged={() => {
              const selected = addressFromPlace(dropoffAutocomplete.current?.getPlace() ?? {});
              if (selected) {
                setDropoff(selected);
                setDropoffText(selected.label);
              }
            }}
          >
            <TextField
              label="Drop-off address"
              placeholder="School or another destination"
              value={dropoffText}
              onChange={(event) => { setDropoffText(event.target.value); setDropoff(null); }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Find this drop-off on the map">
                      <span><IconButton edge="end" aria-label="Find drop-off on map" onClick={() => openMapPicker("dropoff")} disabled={!dropoffText.trim()}><MapOutlinedIcon /></IconButton></span>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              fullWidth
              inputProps={{ "aria-label": "Drop-off address" }}
            />
          </GoogleAutocomplete>
        </AddressFields>
      )}

      {mapTarget && isLoaded && (
        <MapPicker ref={mapPickerRef}>
          <MapPickerHeader>
            <div>
              <MapPickerTitle>{mapTarget === "pickup" ? "Confirm pick-up" : "Confirm drop-off"}</MapPickerTitle>
              <MapPickerHint>Search with Google Maps, then check the pin before using this address.</MapPickerHint>
            </div>
            <IconButton aria-label="Close map" onClick={() => setMapTarget(null)}><CloseIcon /></IconButton>
          </MapPickerHeader>
          <GoogleAutocomplete
            onLoad={(autocomplete) => { mapAutocomplete.current = autocomplete; }}
            options={{ componentRestrictions: { country: "ke" }, fields: ["formatted_address", "geometry", "place_id", "name"] }}
            onPlaceChanged={() => {
              const selected = addressFromPlace(mapAutocomplete.current?.getPlace() ?? {});
              if (selected) {
                setMapCandidate(selected);
                setMapQuery(selected.label);
              }
            }}
          >
            <TextField
              label="Search on Google Maps"
              value={mapQuery}
              onChange={(event) => { setMapQuery(event.target.value); setMapCandidate(null); }}
              placeholder="Type an address or place name"
              helperText="Choose a Google suggestion to verify the address."
              fullWidth
            />
          </GoogleAutocomplete>
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "280px" }}
            center={mapCandidate ? { lat: mapCandidate.lat, lng: mapCandidate.lng } : { lat: -1.2921, lng: 36.8219 }}
            zoom={mapCandidate ? 16 : 12}
            options={{ mapTypeControl: false, streetViewControl: false, fullscreenControl: false }}
          >
            {mapCandidate && <Marker position={{ lat: mapCandidate.lat, lng: mapCandidate.lng }} />}
          </GoogleMap>
          <MapPickerFooter>
            {mapCandidate && <MapAddress>{mapCandidate.label}</MapAddress>}
            <Button variant="contained" onClick={useMapLocation} disabled={!mapCandidate}>
              Use this {mapTarget} location
            </Button>
          </MapPickerFooter>
        </MapPicker>
      )}

      {(lists.savedAddresses.length > 0 || lists.locationHistory.length > 0) && (
        <AddressListsWrap>
          {lists.savedAddresses.length > 0 && (
            <AddressGroup>
              <ListTitle>Saved addresses</ListTitle>
              {lists.savedAddresses.map((address) => (
                <AddressRow key={`saved-${address.placeId ?? address.label}`}>
                  <AddressLabel title={address.label}>{address.label}</AddressLabel>
                  <UseButton onClick={() => selectSaved(address, "pickup")}>Pick-up</UseButton>
                  <UseButton onClick={() => selectSaved(address, "dropoff")}>Drop-off</UseButton>
                  <IconButton size="small" aria-label={`Remove ${address.label}`} onClick={() => removeSaved(address)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </AddressRow>
              ))}
            </AddressGroup>
          )}
          {lists.locationHistory.length > 0 && (
            <AddressGroup>
              <ListTitle><HistoryIcon sx={{ fontSize: 16, mr: 0.5 }} />Recent places</ListTitle>
              {lists.locationHistory.map((address) => {
                const isSaved = savedKeys.has(address.placeId || address.label);
                return (
                  <AddressRow key={`history-${address.placeId ?? address.label}`}>
                    <AddressLabel title={address.label}>{address.label}</AddressLabel>
                    <UseButton onClick={() => selectSaved(address, "pickup")}>Pick-up</UseButton>
                    <UseButton onClick={() => selectSaved(address, "dropoff")}>Drop-off</UseButton>
                    <IconButton
                      size="small"
                      aria-label={isSaved ? "Address saved" : `Save ${address.label}`}
                      disabled={isSaved || saving}
                      onClick={() => saveAddress(address)}
                    >
                      {isSaved ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                    </IconButton>
                  </AddressRow>
                );
              })}
            </AddressGroup>
          )}
        </AddressListsWrap>
      )}

      <ContinueButton
        variant="contained"
        endIcon={<ArrowForwardIcon />}
        disabled={!pickup || !dropoff || saving || !isLoaded}
        onClick={continueToDrivers}
      >
        {saving ? "Saving..." : "Choose a driver"}
      </ContinueButton>
      {pickup && dropoff && <SelectedSummary>{pickup.label} <span>to</span> {dropoff.label}</SelectedSummary>}
    </LocationPanel>
  );
}

const LocationPanel = styled.section`
  width: 100%;
  max-width: 900px;
  margin: 0 auto 32px;
  padding: 24px;
  border: 1px solid #E4E2DA;
  border-top: 5px solid #F2C230;
  border-radius: 6px;
  background: #FFFDF6;
  box-shadow: 0 10px 28px rgba(32, 33, 30, 0.07);
`;

const PanelHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const Eyebrow = styled.div`
  margin-bottom: 5px;
  color: #8A6C0A;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
`;

const AddressFields = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  @media (max-width: 620px) { grid-template-columns: 1fr; }
`;

const MapPicker = styled.div`
  display: grid;
  gap: 12px;
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #E4E2DA;
  background: #FFFFFF;
  scroll-margin: 20px;
`;
const MapPickerHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;
const MapPickerTitle = styled.div`
  color: #20211E;
  font-size: 0.95rem;
  font-weight: 800;
`;
const MapPickerHint = styled.p`
  margin: 4px 0 0;
  color: #646358;
  font-size: 0.76rem;
`;
const MapPickerFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;
const MapAddress = styled.span`
  flex: 1 1 220px;
  color: #35362F;
  font-size: 0.8rem;
  overflow-wrap: anywhere;
`;

const AddressListsWrap = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 22px;
  margin-top: 22px;
`;

const AddressGroup = styled.div`min-width: 0;`;
const ListTitle = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: #58564E;
  font-size: 0.76rem;
  font-weight: 800;
`;
const AddressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 42px;
  border-top: 1px solid #EAE7DD;
`;
const AddressLabel = styled.span`
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: #292923;
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const UseButton = styled.button`
  flex: 0 0 auto;
  padding: 5px 7px;
  border: 0;
  background: transparent;
  color: #65500B;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  &:hover { text-decoration: underline; }
`;
const ContinueButton = styled(Button)`
  && {
    min-height: 48px;
    margin-top: 20px;
    padding: 0 22px;
    border-radius: 4px;
    background: #F2C230;
    color: #20211E;
    font-weight: 800;
    &:hover { background: #E5B51D; }
    &:disabled { background: #E8E5DA; color: #77756D; }
  }
`;
const SelectedSummary = styled.p`
  margin: 12px 0 0;
  color: #626057;
  font-size: 0.76rem;
  overflow-wrap: anywhere;
  span { padding: 0 5px; color: #9A7A0A; font-weight: 700; }
`;
const LoadingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  color: #625E53;
  font-size: 0.85rem;
`;
const ErrorText = styled.p`
  margin: 0;
  color: #A33A2A;
  font-size: 0.85rem;
`;