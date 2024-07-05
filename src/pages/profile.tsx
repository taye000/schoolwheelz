import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styled from 'styled-components';
import ProfileCard, { DriverProfile } from '@/components/Profilecard';
import { Button } from '@mui/material';
import { driverProfiles } from '@/sampledata';
import { MapAndButtonContainer } from './drivers/[id]';

const driverProfile: DriverProfile = driverProfiles[0];

const Map = dynamic(() => import('../components/Map'), { ssr: false });

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

const Profile = () => {
    const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number }>({ lat: -3.745, lng: -38.523 });

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setDriverLocation({ lat: latitude, lng: longitude });
                },
                (error) => {
                    console.error('Error obtaining location', error);
                }
            );
        } else {
            console.error('Geolocation is not supported by this browser.');
        }
    }, []);

    return (
        <PageContainer>
            <ContentContainer>
                <ProfileCardContainer>
                    <ProfileCard {...driverProfile} />
                </ProfileCardContainer>
                <MapContainer>
                    <Map mode="profile" driverLocation={driverLocation} />
                </MapContainer>
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

export const MapContainer = styled.div`
    flex: 2;
    min-width: 300px; /* Ensure minimum width for the map */
    height: 400px; /* Set a fixed height for the map */

    @media (max-width: 768px) {
        width: 100%;
        height: calc(66vh - 10px); /* Take 2/3 of the viewport height */
        margin-bottom: 10px;
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

export default Profile;
