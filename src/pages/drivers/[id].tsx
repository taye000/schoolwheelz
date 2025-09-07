const PageContainer = styled.div`
  width: 80%;
  margin: 0 auto;
  padding: 20px;

  @media (max-width: 768px) {
    width: 100%;
    padding: 10px;
  }
`;
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import styled from 'styled-components';
import StarIcon from '@mui/icons-material/Star';
import StarHalfIcon from '@mui/icons-material/StarHalf';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import PhoneIcon from '@mui/icons-material/Phone';
import WcIcon from '@mui/icons-material/Wc';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import DriveEtaIcon from '@mui/icons-material/DriveEta';
import { Button } from '@mui/material';
import { DriverProfile } from '@/components/Profilecard';
import Loading from '@/Loading';

const DriverDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);

  useEffect(() => {
    const fetchDriver = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/drivers/${id}`);
        if (response.data.success) {
          setDriverProfile(response.data.data);
        } else {
          setDriverProfile(null);
        }
      } catch (error) {
        console.error('Error fetching driver:', error);
        setDriverProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDriver();
  }, [id]);

  if (isLoading) {
    return <Loading />;
  }

  if (!driverProfile) {
    return (
      <PageContainer>
        <EmptyState>
          <h2>Driver not found</h2>
          <Button variant="contained" color="primary" href="/drivers">
            Back to Drivers
          </Button>
        </EmptyState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackButton onClick={() => router.push('/drivers')}>
        ← Back to Drivers
      </BackButton>

      <MainContent>
        <LeftColumn>
          <DetailHeader>
            <AvatarSection>
              <AvatarImg src={driverProfile.photo} alt={driverProfile.fullName} />
              <AvatarInfo>
                <Name>{driverProfile.fullName}</Name>
                <SubInfo>
                  <CarBadge>{driverProfile.carModel}</CarBadge>
                  <RatingSection>
                    <StarsContainer>
                      {Array.from({ length: Math.floor(4.5) }).map((_, i) => (
                        <StarIcon key={i} />
                      ))}
                      {4.5 % 1 !== 0 && <StarHalfIcon />}
                      {Array.from({ length: 5 - Math.ceil(4.5) }).map((_, i) => (
                        <StarOutlineIcon key={i} />
                      ))}
                    </StarsContainer>
                    <RatingBadge>4.5</RatingBadge>
                  </RatingSection>
                </SubInfo>
              </AvatarInfo>
            </AvatarSection>
          </DetailHeader>

          <Section>
            <SectionTitle>Contact Information</SectionTitle>
            <DetailGrid>
              <DetailItem><PhoneIcon /> <span>{driverProfile.phoneNumber}</span></DetailItem>
              <DetailItem><WcIcon /> <span>{driverProfile.sex}</span></DetailItem>
              <DetailItem><CalendarTodayIcon /> <span>{new Date().getFullYear() - new Date(driverProfile.dob).getFullYear()} Years Old</span></DetailItem>
            </DetailGrid>
          </Section>

          <Section>
            <SectionTitle>Vehicle Information</SectionTitle>
            <DetailGrid>
              <DetailItem><DriveEtaIcon /> <span>{driverProfile.carModel}</span></DetailItem>
              <DetailItem><FormatListNumberedIcon /> <span>{driverProfile.carRegNumber}</span></DetailItem>
            </DetailGrid>
            <CarImageWrapper>
              <CarImage src={driverProfile.carPhoto} alt="Car" />
            </CarImageWrapper>
          </Section>
        </LeftColumn>

        <RightColumn>
          <Section>
            <SectionTitle>Schedule a Pick-up</SectionTitle>
            <RegisterCard>
              <p>Ready to schedule a pick-up with {driverProfile.fullName}?</p>
              <Button
                variant="contained"
                color="primary"
                href="/register"
                fullWidth
                size="large"
              >
                Register Now
              </Button>
            </RegisterCard>
          </Section>
        </RightColumn>
      </MainContent>
    </PageContainer>
  );
};

const DetailHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
  margin-bottom: 24px;
  @media (max-width: 700px) {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
`;

const AvatarImg = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  object-fit: cover;
`;

const Name = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 8px 0;
`;

const CarBadge = styled.span`
  background: #6366f1;
  color: #fff;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 12px;
  padding: 4px 14px;
  margin-left: 8px;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 24px;
  width: 100%;
  justify-items: start;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  color: #374151;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 8px 16px;
  box-shadow: 0 1px 4px rgba(60,72,88,0.06);
  min-width: 140px;
  justify-content: flex-start;
`;

const CarImage = styled.img`
  width: 100%;
  max-width: 420px;
  max-height: 180px;
  height: auto;
  margin: 0 auto 18px auto;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: block;
`;

const RatingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const StarsContainer = styled.div`
  display: flex;
  align-items: center;
  color: #fbbf24;
`;

const RatingBadge = styled.span`
  background: #fbbf24;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 10px;
  padding: 4px 14px;
`;

export const MapAndButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;

  @media (max-width: 768px) {
    margin-top: 10px;
  }
`;

const ProfileCardContainer = styled.div`
  flex: 1;
  min-width: 300px; /* Ensure minimum width for the profile card */
  max-width: 400px; /* Add a maximum width to prevent shrinking */

  @media (max-width: 768px) {
    width: 100%;
    height: calc(34vh - 10px); /* Take 1/3 of the viewport height */
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  border-radius: 12px;
  background: #f9fafb;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const BackButton = styled.button`
  background: transparent;
  border: none;
  color: #6366f1;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    text-decoration: underline;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: row;
  gap: 32px;
  width: 100%;
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const LeftColumn = styled.div`
  flex: 2;
  min-width: 300px;
`;

const RightColumn = styled.div`
  flex: 1;
  min-width: 250px;
`;

const AvatarSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const AvatarInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SubInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RatingSection = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 16px;
`;

const RegisterCard = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
`;

const CarImageWrapper = styled.div`
  margin-top: 16px;
  border-radius: 8px;
  overflow: hidden;
`;

export default DriverDetail;
