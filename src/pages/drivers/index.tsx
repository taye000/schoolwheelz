import React, { useState } from 'react';
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
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 32px;
    justify-items: center;
    width: 100%;
    margin: 0 auto;
    @media (max-width: 1200px) {
        grid-template-columns: repeat(2, 1fr);
    }
    @media (max-width: 700px) {
        grid-template-columns: 1fr;
        gap: 16px;
    }
`;

const ProfileCardContainer = styled.div`
    width: 100%;
    max-width: 340px;
    cursor: pointer;
    transition: transform 0.3s ease;
    &:hover {
        transform: translateY(-5px);
    }
    @media (max-width: 768px) {
        max-width: 100%;
    }
`;

const Drivers: React.FC = () => {
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const totalPages = Math.ceil(driverProfiles.length / pageSize);
    const paginatedProfiles = driverProfiles.slice((page - 1) * pageSize, page * pageSize);

    const handlePrev = () => setPage(prev => Math.max(prev - 1, 1));
    const handleNext = () => setPage(prev => Math.min(prev + 1, totalPages));

    return (
        <PageContainer>
            <ContentContainer>
                {paginatedProfiles.map(profile => (
                    <ProfileCardContainer key={profile.id}>
                        <ProfileCard {...profile} />
                    </ProfileCardContainer>
                ))}
            </ContentContainer>
            <PaginationContainer>
                <PaginationButton onClick={handlePrev} disabled={page === 1}>Previous</PaginationButton>
                <PageIndicator>Page {page} of {totalPages}</PageIndicator>
                <PaginationButton onClick={handleNext} disabled={page === totalPages}>Next</PaginationButton>
            </PaginationContainer>
        </PageContainer>
    );
};

const PaginationContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin: 24px 0 0 0;
`;

const PaginationButton = styled.button`
    padding: 8px 18px;
    border-radius: 8px;
    border: none;
    background: #6366f1;
    color: #fff;
    font-weight: 500;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s;
    &:disabled {
        background: #cbd5e1;
        color: #64748b;
        cursor: not-allowed;
    }
`;

const PageIndicator = styled.span`
    font-size: 1rem;
    color: #374151;
    font-weight: 500;
`;

export default Drivers;
