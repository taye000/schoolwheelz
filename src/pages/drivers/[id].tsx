import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { driverProfiles } from '@/sampledata'; // Import your driver data
import styled from 'styled-components';
import { Button } from '@mui/material';
import ProfileCard, { DriverProfile } from '@/components/Profilecard';
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

  return (
    <PageContainer>
      <ContentContainer>
        <ProfileCardContainer>
          {driverProfile && (
            <ProfileCard {...driverProfile} />
          )}
        </ProfileCardContainer>
      </ContentContainer>
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

const PageContainer = styled.div`
  width: 80%;
  margin: 0 auto;
  padding: 20px;

  @media (max-width: 768px) {
    width: 100%;
    padding: 10px;
  }
`;

const ContentContainer = styled.div`
  display: flex;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    gap: 0;
  }
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
