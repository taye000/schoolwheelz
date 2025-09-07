import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import ProfileCard, { DriverProfile } from '@/components/Profilecard';
import Loading from '@/Loading';

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

const Drivers: React.FC = () => {
    const [drivers, setDrivers] = useState<DriverProfile[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDrivers = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`/api/drivers?page=${page}&limit=${pageSize}`);
                if (response.data.success) {
                    setDrivers(response.data.data);
                    setTotalPages(response.data.pagination.pages);
                }
            } catch (error) {
                console.error('Error fetching drivers:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDrivers();
    }, [page]);

    const handlePrev = () => setPage(prev => Math.max(prev - 1, 1));
    const handleNext = () => setPage(prev => Math.min(prev + 1, totalPages));

    return (
        <PageContainer>
            <ContentContainer>
                {isLoading ? (
                    <Loading />
                ) : drivers.length === 0 ? (
                    <p>No drivers found. Looks like the garage is empty! Add some drivers to get started.</p>
                ) : (
                    drivers.map(driver => (
                        <ProfileCardContainer key={driver._id}>
                            <ProfileCard
                                _id={driver._id}
                                fullName={driver.fullName}
                                photo={driver.photo}
                                phoneNumber={driver.phoneNumber}
                                sex={driver.sex}
                                dob={driver.dob}
                                carRegNumber={driver.carRegNumber}
                                carModel={driver.carModel}
                                carPhoto={driver.carPhoto}
                                rating={4.5} // Placeholder rating
                            />
                        </ProfileCardContainer>
                    ))
                )}
            </ContentContainer>
            <PaginationContainer>
                <PaginationButton onClick={handlePrev} disabled={page === 1}>Previous</PaginationButton>
                <PageIndicator>Page {page} of {totalPages}</PageIndicator>
                <PaginationButton onClick={handleNext} disabled={page === totalPages}>Next</PaginationButton>
            </PaginationContainer>
        </PageContainer>
    );
};

export default Drivers;
