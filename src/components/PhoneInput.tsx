"use client";

import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { colors } from "@/lib/theme";

// ─── Country data ─────────────────────────────────────────────────────────────
// East Africa first, then wider Africa, then international
export interface Country {
  code: string;
  name: string;
  dial: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  // ── East Africa ──
  { code: "KE", name: "Kenya",        dial: "+254", flag: "🇰🇪" },
  { code: "UG", name: "Uganda",       dial: "+256", flag: "🇺🇬" },
  { code: "TZ", name: "Tanzania",     dial: "+255", flag: "🇹🇿" },
  { code: "RW", name: "Rwanda",       dial: "+250", flag: "🇷🇼" },
  { code: "ET", name: "Ethiopia",     dial: "+251", flag: "🇪🇹" },
  { code: "BI", name: "Burundi",      dial: "+257", flag: "🇧🇮" },
  { code: "SS", name: "South Sudan",  dial: "+211", flag: "🇸🇸" },
  { code: "SO", name: "Somalia",      dial: "+252", flag: "🇸🇴" },
  { code: "DJ", name: "Djibouti",     dial: "+253", flag: "🇩🇯" },
  { code: "ER", name: "Eritrea",      dial: "+291", flag: "🇪🇷" },
  // ── Africa ──
  { code: "NG", name: "Nigeria",      dial: "+234", flag: "🇳🇬" },
  { code: "GH", name: "Ghana",        dial: "+233", flag: "🇬🇭" },
  { code: "ZA", name: "South Africa", dial: "+27",  flag: "🇿🇦" },
  { code: "EG", name: "Egypt",        dial: "+20",  flag: "🇪🇬" },
  { code: "MA", name: "Morocco",      dial: "+212", flag: "🇲🇦" },
  { code: "SN", name: "Senegal",      dial: "+221", flag: "🇸🇳" },
  { code: "CM", name: "Cameroon",     dial: "+237", flag: "🇨🇲" },
  { code: "CI", name: "Côte d'Ivoire",dial: "+225", flag: "🇨🇮" },
  { code: "ZM", name: "Zambia",       dial: "+260", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe",     dial: "+263", flag: "🇿🇼" },
  { code: "MZ", name: "Mozambique",   dial: "+258", flag: "🇲🇿" },
  { code: "AO", name: "Angola",       dial: "+244", flag: "🇦🇴" },
  { code: "MG", name: "Madagascar",   dial: "+261", flag: "🇲🇬" },
  { code: "MU", name: "Mauritius",    dial: "+230", flag: "🇲🇺" },
  { code: "TN", name: "Tunisia",      dial: "+216", flag: "🇹🇳" },
  { code: "LY", name: "Libya",        dial: "+218", flag: "🇱🇾" },
  { code: "SD", name: "Sudan",        dial: "+249", flag: "🇸🇩" },
  // ── International ──
  { code: "US", name: "United States",     dial: "+1",  flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom",    dial: "+44", flag: "🇬🇧" },
  { code: "CA", name: "Canada",            dial: "+1",  flag: "🇨🇦" },
  { code: "AU", name: "Australia",         dial: "+61", flag: "🇦🇺" },
  { code: "IN", name: "India",             dial: "+91", flag: "🇮🇳" },
  { code: "CN", name: "China",             dial: "+86", flag: "🇨🇳" },
  { code: "AE", name: "UAE",               dial: "+971",flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia",      dial: "+966",flag: "🇸🇦" },
  { code: "DE", name: "Germany",           dial: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France",            dial: "+33", flag: "🇫🇷" },
  { code: "IT", name: "Italy",             dial: "+39", flag: "🇮🇹" },
  { code: "BR", name: "Brazil",            dial: "+55", flag: "🇧🇷" },
  { code: "MX", name: "Mexico",            dial: "+52", flag: "🇲🇽" },
  { code: "JP", name: "Japan",             dial: "+81", flag: "🇯🇵" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface PhoneInputProps {
  /** Full E.164-style value e.g. "+254712345678" */
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  size?: "small" | "medium";
  disabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PhoneInput({
  value,
  onChange,
  label = "Phone Number",
  required = false,
  error = false,
  helperText,
  size = "medium",
  disabled = false,
}: PhoneInputProps) {
  // Derive selected country and local number from value
  const findCountry = (val: string) =>
    COUNTRIES.find((c) => val.startsWith(c.dial)) ?? COUNTRIES[0]; // defaults to Kenya

  const [selected, setSelected] = useState<Country>(() => findCountry(value));
  const [localNumber, setLocalNumber] = useState(() =>
    value.startsWith(selected.dial) ? value.slice(selected.dial.length) : value
  );

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Keep internal state in sync if parent resets value
  useEffect(() => {
    if (!value) {
      setLocalNumber("");
      setSelected(COUNTRIES[0]);
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const selectCountry = (country: Country) => {
    setSelected(country);
    setOpen(false);
    setSearch("");
    onChange(country.dial + localNumber);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only digits, spaces, hyphens
    const raw = e.target.value.replace(/[^\d\s\-]/g, "");
    setLocalNumber(raw);
    onChange(selected.dial + raw.replace(/\s|-/g, ""));
  };

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const small = size === "small";

  return (
    <Wrapper ref={containerRef}>
      {label && (
        <Label small={small} error={error}>
          {label}{required && <Asterisk> *</Asterisk>}
        </Label>
      )}

      <InputRow error={error} small={small} disabled={disabled}>
        {/* ── Country selector ── */}
        <FlagButton
          type="button"
          onClick={() => !disabled && setOpen((v) => !v)}
          small={small}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          title={`${selected.flag} ${selected.name} (${selected.dial})`}
        >
          <FlagEmoji>{selected.flag}</FlagEmoji>
          <DialCode>{selected.dial}</DialCode>
          <Chevron open={open}>▾</Chevron>
        </FlagButton>

        <Divider />

        {/* ── Number input ── */}
        <NumberInput
          type="tel"
          value={localNumber}
          onChange={handleNumberChange}
          placeholder="712 345 678"
          required={required}
          disabled={disabled}
          small={small}
          aria-label={label}
        />
      </InputRow>

      {/* ── Dropdown ── */}
      {open && (
        <Dropdown>
          <SearchBox
            ref={searchRef}
            type="text"
            placeholder="Search country or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <OptionList role="listbox">
            {filtered.length === 0 && (
              <NoResult>No countries found</NoResult>
            )}
            {filtered.map((country) => (
              <Option
                key={country.code}
                role="option"
                aria-selected={country.code === selected.code}
                active={country.code === selected.code}
                onClick={() => selectCountry(country)}
              >
                <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{country.flag}</span>
                <CountryName>{country.name}</CountryName>
                <CountryDial>{country.dial}</CountryDial>
              </Option>
            ))}
          </OptionList>
        </Dropdown>
      )}

      {helperText && <HelperText error={error}>{helperText}</HelperText>}
    </Wrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`;

const Label = styled.label<{ small?: boolean; error?: boolean }>`
  display: block;
  font-size: ${(p) => (p.small ? "0.72rem" : "0.75rem")};
  font-weight: 500;
  color: ${(p) => (p.error ? "#d32f2f" : colors.mutedText)};
  margin-bottom: 4px;
  letter-spacing: 0.01em;
`;

const Asterisk = styled.span`
  color: #d32f2f;
`;

const InputRow = styled.div<{ error?: boolean; small?: boolean; disabled?: boolean }>`
  display: flex;
  align-items: center;
  border: 1px solid ${(p) => (p.error ? "#d32f2f" : colors.border)};
  border-radius: 8px;
  background: ${(p) => (p.disabled ? colors.lightBg : colors.pureWhite)};
  transition: border-color 0.15s;
  height: ${(p) => (p.small ? "40px" : "56px")};
  overflow: visible;

  &:focus-within {
    border-color: ${(p) => (p.error ? "#d32f2f" : colors.skyBlue)};
    box-shadow: 0 0 0 2px ${(p) => (p.error ? "rgba(211,47,47,0.15)" : "rgba(66,153,225,0.15)")};
  }
`;

const FlagButton = styled.button<{ small?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: ${(p) => (p.small ? "0 8px" : "0 12px")};
  height: 100%;
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  border-radius: 8px 0 0 8px;
  transition: background 0.12s;

  &:hover:not(:disabled) {
    background: ${colors.lightBg};
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
`;

const FlagEmoji = styled.span`
  font-size: 1.25rem;
  line-height: 1;
`;

const DialCode = styled.span`
  font-size: 0.82rem;
  font-weight: 600;
  color: ${colors.slateCharcoal};
`;

const Chevron = styled.span<{ open?: boolean }>`
  font-size: 0.7rem;
  color: ${colors.mutedText};
  transform: ${(p) => (p.open ? "rotate(180deg)" : "rotate(0deg)")};
  transition: transform 0.15s;
  margin-left: 2px;
`;

const Divider = styled.div`
  width: 1px;
  height: 60%;
  background: ${colors.border};
  flex-shrink: 0;
`;

const NumberInput = styled.input<{ small?: boolean }>`
  flex: 1;
  border: none;
  outline: none;
  font-size: ${(p) => (p.small ? "0.85rem" : "0.95rem")};
  color: ${colors.slateCharcoal};
  background: transparent;
  padding: ${(p) => (p.small ? "0 10px" : "0 14px")};
  height: 100%;
  min-width: 0;

  &::placeholder {
    color: ${colors.mutedText};
    opacity: 0.7;
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: ${colors.pureWhite};
  border: 1px solid ${colors.border};
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(26, 54, 93, 0.14);
  z-index: 1300;
  overflow: hidden;
`;

const SearchBox = styled.input`
  width: 100%;
  border: none;
  border-bottom: 1px solid ${colors.border};
  outline: none;
  padding: 10px 14px;
  font-size: 0.82rem;
  color: ${colors.slateCharcoal};
  background: ${colors.lightBg};
  box-sizing: border-box;

  &::placeholder {
    color: ${colors.mutedText};
  }
`;

const OptionList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 4px 0;
  max-height: 240px;
  overflow-y: auto;
`;

const Option = styled.li<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  cursor: pointer;
  background: ${(p) => (p.active ? colors.lightBg : "transparent")};
  transition: background 0.1s;

  &:hover {
    background: ${colors.lightBg};
  }
`;

const CountryName = styled.span`
  flex: 1;
  font-size: 0.82rem;
  color: ${colors.slateCharcoal};
`;

const CountryDial = styled.span`
  font-size: 0.78rem;
  font-weight: 600;
  color: ${colors.mutedText};
`;

const NoResult = styled.li`
  padding: 12px 14px;
  font-size: 0.82rem;
  color: ${colors.mutedText};
  text-align: center;
`;

const HelperText = styled.p<{ error?: boolean }>`
  font-size: 0.72rem;
  color: ${(p) => (p.error ? "#d32f2f" : colors.mutedText)};
  margin: 4px 0 0 2px;
`;
