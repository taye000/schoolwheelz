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
import { driverProfiles } from '@/sampledata'; // Import your driver data
import styled from 'styled-components';
import StarIcon from '@mui/icons-material/Star';
import StarHalfIcon from '@mui/icons-material/StarHalf';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import PhoneIcon from '@mui/icons-material/Phone';
import WcIcon from '@mui/icons-material/Wc';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import { Button } from '@mui/material';
import { DriverProfile } from '@/components/Profilecard';
import Loading from '@/Loading';

const DriverDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query; // Extract the ID from the router query
  const [isLoading, setIsLoading] = useState(true); // State to manage loading status

  const [driverProfile, setDriverProfile] = useState<DriverProfile | undefined>(undefined);

  useEffect(() => {
    setIsLoading(true); // Set loading state to true initially

    // Find the driver profile based on the ID
    const profile = driverProfiles.find(profile => profile.id === Number(id));
    if (profile) {
      setDriverProfile(profile);
    }

    setIsLoading(false); // Set loading state to false after data is fetched
  }, [id]);


  if (isLoading) {
    return <Loading />;
  }

  if (!driverProfile) {
    return (
      <PageContainer>
        <h2>Driver not found</h2>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <DetailHeader>
        <AvatarImg src={driverProfile.picture} alt={driverProfile.name} />
        <div>
          <Name>{driverProfile.name}</Name>
          <CarBadge>{driverProfile.carModel}</CarBadge>
        </div>
      </DetailHeader>
      <DetailGrid>
        <DetailItem><PhoneIcon /> <span>{driverProfile.phone}</span></DetailItem>
        <DetailItem><WcIcon /> <span>{driverProfile.sex}</span></DetailItem>
        <DetailItem><CalendarTodayIcon /> <span>{driverProfile.age} Years Old</span></DetailItem>
        <DetailItem><FormatListNumberedIcon /> <span>{driverProfile.carRegistration}</span></DetailItem>
      </DetailGrid>
      <CarImage src={driverProfile.carPicture} alt="Car" />
      <RatingRow>
        <StarsContainer>
          {Array.from({ length: Math.floor(driverProfile.rating) }).map((_, i) => <StarIcon key={i} />)}
          {driverProfile.rating % 1 !== 0 && <StarHalfIcon />}
          {Array.from({ length: 5 - Math.ceil(driverProfile.rating) }).map((_, i) => <StarOutlineIcon key={i} />)}
        </StarsContainer>
        <RatingBadge>{driverProfile.rating.toFixed(1)}</RatingBadge>
      </RatingRow>
      <MapAndButtonContainer>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          href="/register"
        >
          Register
        </Button>
      </MapAndButtonContainer>
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

export default DriverDetail;
