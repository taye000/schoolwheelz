import React from 'react';
import dynamic from 'next/dynamic';
import styled from 'styled-components';
import ProfileCard from '@/components/profilecard';

const Map = dynamic(() => import('../components/maps'), { ssr: false });

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
    flex-wrap: wrap;
    gap: 20px;

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 10px;
    }
`;

const Title = styled.h1`
    text-align: center;
    margin-bottom: 20px;
`;

const Profile = () => {
    return (
        <PageContainer>
            <Title>Driver Profile</Title>
            <ContentContainer>
                <ProfileCard />
                <MapContainer>
                    <Map />
                </MapContainer>
            </ContentContainer>
        </PageContainer>
    );
};

const MapContainer = styled.div`
    flex: 1;
    min-width: 300px; /* Ensure minimum width for the map */
    height: 400px; /* Set a fixed height for the map */
    
    @media (max-width: 768px) {
        width: 100%;
        height: 300px; /* Adjust height for small devices */
    }
`;

export default Profile;
