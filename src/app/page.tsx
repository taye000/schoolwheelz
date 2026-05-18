"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { Button, Typography, Box, Container, Grid } from "@mui/material";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import ShieldIcon from "@mui/icons-material/Shield";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StarIcon from "@mui/icons-material/Star";
import SchoolIcon from "@mui/icons-material/School";
import { colors } from "@/lib/theme";

const features = [
  {
    icon: <ShieldIcon sx={{ fontSize: 40, color: colors.mintCream }} />,
    title: "Safe & Verified",
    desc: "All drivers are background-checked and licensed professionals.",
  },
  {
    icon: <LocationOnIcon sx={{ fontSize: 40, color: colors.skyBlue }} />,
    title: "Live Tracking",
    desc: "Track your child's route in real-time, every step of the way.",
  },
  {
    icon: <StarIcon sx={{ fontSize: 40, color: colors.warningAmber ?? "#D69E2E" }} />,
    title: "Rated Drivers",
    desc: "Choose from community-rated drivers with transparent reviews.",
  },
];

export default function HomePage() {
  const [schools, setSchools] = useState<{ _id: string; name: string; estate: string }[]>([]);

  useEffect(() => {
    fetch("/api/schools")
      .then((r) => r.json())
      .then((d) => { if (d.success) setSchools(d.data); })
      .catch(() => {});
  }, []);

  return (
    <PageWrapper>
      {/* Hero */}
      <HeroSection>
        <HeroOverlay />
        <HeroContent>
          <BusBadge>
            <DirectionsBusIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            School Transportation, Reimagined
          </BusBadge>
          <HeroTitle variant="h1">
            Safe Rides for<br />
            <span style={{ color: colors.skyBlue }}>Every Child.</span>
          </HeroTitle>
          <HeroSubtitle variant="subtitle1">
            Connect with verified school drivers, book trips, and track
            drop-offs in real-time — all in one app.
          </HeroSubtitle>
          <HeroCTA>
            <PrimaryButton variant="contained" size="large" href="/register">
              Get Started — It&apos;s Free
            </PrimaryButton>
            <SecondaryButton variant="outlined" size="large" href="/drivers">
              Browse Drivers
            </SecondaryButton>
          </HeroCTA>
        </HeroContent>
      </HeroSection>

      {/* Features */}
      <FeaturesSection>
        <Container maxWidth="lg">
          <SectionLabel>Why School Wheelz</SectionLabel>
          <SectionTitle variant="h2">Built for parents. Trusted by schools.</SectionTitle>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            {features.map((f, i) => (
              <Grid item xs={12} md={4} key={i}>
                <FeatureCard>
                  <IconWrap>{f.icon}</IconWrap>
                  <FeatureTitle variant="h5">{f.title}</FeatureTitle>
                  <FeatureDesc variant="body1">{f.desc}</FeatureDesc>
                </FeatureCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </FeaturesSection>

      {/* CTA Banner */}
      {schools.length > 0 && (
        <SchoolsSection>
          <Container maxWidth="lg">
            <SchoolsLabel>Where We Operate</SchoolsLabel>
            <SchoolsSectionTitle variant="h2">Schools We Cover 🏫</SchoolsSectionTitle>
            <SchoolsSub>Our verified drivers serve these schools across Nairobi and beyond.</SchoolsSub>
            <SchoolsGrid>
              {schools.map((s, i) => (
                <SchoolPill key={s._id} colorIdx={i % PILL_COLORS.length}>
                  <SchoolIcon sx={{ fontSize: 14, mr: 0.75, opacity: 0.85 }} />
                  <SchoolPillName>{s.name}</SchoolPillName>
                  <SchoolPillEstate>{s.estate}</SchoolPillEstate>
                </SchoolPill>
              ))}
            </SchoolsGrid>
            <SchoolsFooter>
              <a href="/drivers" style={{ color: colors.skyBlue, fontWeight: 700, fontSize: "0.9rem" }}>
                Find a driver near your school →
              </a>
            </SchoolsFooter>
          </Container>
        </SchoolsSection>
      )}

      {/* CTA Banner */}
      <CTABanner>
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography variant="h3" sx={{ color: "#fff", fontWeight: 700, mb: 2 }}>
            Ready to get started?
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.85)", mb: 4 }}>
            Join thousands of families who trust School Wheelz every morning.
          </Typography>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
            <Button
              variant="contained"
              size="large"
              href="/register"
              sx={{ bgcolor: colors.mintCream, color: colors.deepNavy, fontWeight: 700, "&:hover": { bgcolor: "#68D391" } }}
            >
              Register as Parent
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="/driver-registration"
              sx={{ color: "#fff", borderColor: "#fff", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
            >
              Become a Driver
            </Button>
          </Box>
        </Container>
      </CTABanner>
    </PageWrapper>
  );
}

const deepNavy = colors.deepNavy;
const skyBlue = colors.skyBlue;

const PageWrapper = styled.div`
  background-color: ${colors.lightBg};
`;

const HeroSection = styled.section`
  position: relative;
  background-image: url("/unnamed.png");
  background-size: cover;
  background-position: center;
  min-height: 92vh;
  display: flex;
  align-items: center;
  padding: 0 24px;
`;

const HeroOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(26, 54, 93, 0.88) 0%,
    rgba(66, 153, 225, 0.55) 100%
  );
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  max-width: 700px;
  margin: 0 auto;
  text-align: center;
  color: #fff;
`;

const BusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(8px);
  padding: 8px 20px;
  border-radius: 100px;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 24px;
`;

const HeroTitle = styled(Typography)`
  && {
    font-size: clamp(2.4rem, 6vw, 4rem);
    font-weight: 800;
    color: #fff;
    line-height: 1.15;
    margin-bottom: 20px;
    text-shadow: 0 2px 12px rgba(0,0,0,0.25);
  }
`;

const HeroSubtitle = styled(Typography)`
  && {
    font-size: 1.15rem;
    color: rgba(255, 255, 255, 0.9);
    max-width: 520px;
    margin: 0 auto 36px;
    line-height: 1.7;
  }
`;

const HeroCTA = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
`;

const PrimaryButton = styled(Button)`
  && {
    background: linear-gradient(135deg, ${skyBlue}, ${deepNavy});
    color: #fff;
    font-size: 1rem;
    padding: 14px 32px;
    border-radius: 50px;
    box-shadow: 0 4px 20px rgba(66,153,225,0.5);
    &:hover {
      background: linear-gradient(135deg, ${deepNavy}, ${skyBlue});
      box-shadow: 0 6px 24px rgba(26,54,93,0.5);
    }
  }
`;

const SecondaryButton = styled(Button)`
  && {
    color: #fff;
    border-color: rgba(255, 255, 255, 0.7);
    font-size: 1rem;
    padding: 14px 32px;
    border-radius: 50px;
    backdrop-filter: blur(4px);
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: #fff;
    }
  }
`;

const FeaturesSection = styled.section`
  padding: 96px 24px;
  background-color: ${colors.pureWhite};
`;

const SectionLabel = styled.p`
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${skyBlue};
  margin-bottom: 12px;
`;

const SectionTitle = styled(Typography)`
  && {
    font-size: clamp(1.8rem, 4vw, 2.4rem);
    font-weight: 700;
    color: ${deepNavy};
    max-width: 500px;
    line-height: 1.2;
    margin-bottom: 8px;
  }
`;

const FeatureCard = styled.div`
  background: ${colors.lightBg};
  border: 1px solid ${colors.border};
  border-radius: 16px;
  padding: 36px 28px;
  height: 100%;
  transition: transform 0.25s, box-shadow 0.25s;
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 40px rgba(26, 54, 93, 0.12);
  }
`;

const IconWrap = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: ${deepNavy};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`;

const FeatureTitle = styled(Typography)`
  && {
    font-weight: 700;
    color: ${deepNavy};
    margin-bottom: 10px;
  }
`;

const FeatureDesc = styled(Typography)`
  && {
    color: ${colors.mutedText};
    line-height: 1.7;
  }
`;

const CTABanner = styled.section`
  background: linear-gradient(135deg, ${deepNavy} 0%, #2a69ac 100%);
  padding: 96px 24px;
`;

/* ── Schools Section ── */

const PILL_COLORS = [
  { bg: "#EBF8FF", text: "#2C5282", border: "#BEE3F8" }, // blue
  { bg: "#F0FFF4", text: "#22543D", border: "#9AE6B4" }, // green
  { bg: "#FFFAF0", text: "#744210", border: "#FBD38D" }, // amber
  { bg: "#FFF5F7", text: "#702459", border: "#FBB6CE" }, // pink
  { bg: "#FAF5FF", text: "#44337A", border: "#D6BCFA" }, // purple
  { bg: "#EDFDFD", text: "#234E52", border: "#81E6D9" }, // teal
];

const SchoolsSection = styled.section`
  padding: 80px 24px;
  background: linear-gradient(160deg, #f7fafc 0%, #ebf8ff 60%, #f0fff4 100%);
`;

const SchoolsLabel = styled.p`
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${colors.skyBlue};
  margin-bottom: 10px;
`;

const SchoolsSectionTitle = styled(Typography)`
  && {
    font-size: clamp(1.8rem, 4vw, 2.4rem);
    font-weight: 800;
    color: ${deepNavy};
    margin-bottom: 8px;
  }
`;

const SchoolsSub = styled.p`
  font-size: 1rem;
  color: ${colors.mutedText};
  margin-bottom: 36px;
  max-width: 500px;
`;

const SchoolsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const SchoolPill = styled.div<{ colorIdx: number }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px 8px 12px;
  border-radius: 100px;
  border: 1.5px solid ${({ colorIdx }) => PILL_COLORS[colorIdx].border};
  background: ${({ colorIdx }) => PILL_COLORS[colorIdx].bg};
  color: ${({ colorIdx }) => PILL_COLORS[colorIdx].text};
  font-weight: 600;
  font-size: 0.82rem;
  cursor: default;
  transition: transform 0.15s, box-shadow 0.15s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
`;

const SchoolPillName = styled.span`font-weight: 700;`;
const SchoolPillEstate = styled.span`
  font-weight: 400; opacity: 0.75;
  &::before { content: " · "; }
`;

const SchoolsFooter = styled.div`
  margin-top: 28px;
`;

