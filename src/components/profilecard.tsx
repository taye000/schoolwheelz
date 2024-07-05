import React from 'react';
import styled from 'styled-components';
import { Avatar, Paper } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarHalfIcon from '@mui/icons-material/StarHalf';
import StarOutlineIcon from '@mui/icons-material/StarOutline';

// Sample driver profile object
const driverProfile = {
    picture: '/avatar.jpg',
    name: 'John Doe',
    phone: '+1234567890',
    sex: 'Male',
    age: 30,
    carRegistration: 'F OFF',
    carModel: 'Porsche GT3',
    carPicture: '/PorscheGT3.jpg',
    rating: 4.5,
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
        <StarsContainer>
            {Array.from({ length: fullStars }).map((_, index) => (
                <StarIcon key={`full-${index}`} />
            ))}
            {halfStar && <StarHalfIcon />}
            {Array.from({ length: emptyStars }).map((_, index) => (
                <StarOutlineIcon key={`empty-${index}`} />
            ))}
        </StarsContainer>
    );
};

const ProfileCard: React.FC = () => {
    return (
        <ProfileContainer>
            <StyledPaper elevation={3}>
                <Avatar src={driverProfile.picture} alt="Profile" sx={{ width: 100, height: 100 }} />
                <ProfileInfo>
                    <ProfileDetail>{driverProfile.name}</ProfileDetail>
                    <ProfileDetail>{driverProfile.phone}</ProfileDetail>
                    <ProfileDetail>{driverProfile.sex}</ProfileDetail>
                    <ProfileDetail>{driverProfile.age} Years Old</ProfileDetail>
                    <ProfileDetail>{driverProfile.carModel}</ProfileDetail>
                    <ProfileDetail>{driverProfile.carRegistration}</ProfileDetail>
                    <CarImage src={driverProfile.carPicture} alt="Car" />
                    <StarRating rating={driverProfile.rating} />
                </ProfileInfo>
            </StyledPaper>
        </ProfileContainer>
    );
};

// Styled Components
const ProfileContainer = styled.div`
  float: left;
  margin-right: 20px;

  @media (max-width: 768px) {
    width: 100%;
    margin-right: 0;
    margin-bottom: 20px;
  }
`;

const StyledPaper = styled(Paper)`
  padding: 20px;
`;

const ProfileInfo = styled.div`
  margin-top: 20px;
`;

const ProfileDetail = styled.p`
  margin-bottom: 10px;
`;

const CarImage = styled.img`
  width: 100%;
  max-height: 150px;
  height: auto;
  margin-top: 10px;
  border-radius: 8px;
  object-fit: cover;
`;

const StarsContainer = styled.div`
  display: flex;
  align-items: center;
  color: gold; // Change this to your desired star color
`;

export default ProfileCard;
