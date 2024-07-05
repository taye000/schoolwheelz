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
    gap: 20px;

    @media (max-width: 768px) {
        flex-direction: column-reverse;
        gap: 0;
    }
`;

const Title = styled.h1`
    text-align: center;
    margin-bottom: 20px;
`;

const Profile = () => {
    return (
        <PageContainer>
            <ContentContainer>
                <ProfileCardContainer>
                    <ProfileCard />
                </ProfileCardContainer>
                <MapContainer>
                    <Map />
                </MapContainer>
            </ContentContainer>
        </PageContainer>
    );
};

const MapContainer = styled.div`
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
