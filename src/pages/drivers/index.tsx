import React from 'react';
import styled from 'styled-components';
import { driverProfiles } from '@/sampledata'; // Import your driver data
import Link from 'next/link';
import ProfileCard from '@/components/Profilecard';

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
        gap: 0;
    }
`;

const ProfileCardContainer = styled.div`
    flex: 1;
    min-width: 300px; /* Ensure minimum width for the profile card */
    max-width: 400px; /* Add a maximum width to prevent shrinking */
    cursor: pointer;
    transition: transform 0.3s ease;

    &:hover {
        transform: translateY(-5px);
    }

    @media (max-width: 768px) {
        width: 100%;
        height: calc(34vh - 10px); /* Take 1/3 of the viewport height */
    }
`;

const Drivers: React.FC = () => {
    return (
        <PageContainer>
            <ContentContainer>
                {driverProfiles.map(profile => (
                    <ProfileCardContainer key={profile.id}>
                        <Link href={`/drivers/${profile.id}`} passHref>
                            <ProfileCard {...profile} />
                        </Link>
                    </ProfileCardContainer>
                ))}
            </ContentContainer>
        </PageContainer>
    );
};

export default Drivers;
