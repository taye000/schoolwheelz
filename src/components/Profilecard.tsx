import React from 'react';
import styled from 'styled-components';
import { Avatar, Paper } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarHalfIcon from '@mui/icons-material/StarHalf';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import WcIcon from '@mui/icons-material/Wc';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DriveEtaIcon from '@mui/icons-material/DriveEta';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

export interface DriverProfile {
  id: number;
  picture: string;
  name: string;
  phone: string;
  sex: string;
  age: number;
  carRegistration: string;
  carModel: string;
  carPicture: string;
  rating: number;
}

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

const ProfileCard: React.FC<DriverProfile> = ({
  picture,
  name,
  phone,
  sex,
  age,
  carRegistration,
  carModel,
  carPicture,
  rating,
}) => {
  return (
    <ProfileContainer>
      <StyledPaper elevation={3}>
        <AvatarContainer>
          <Avatar src={picture} alt="Profile" sx={{ width: 100, height: 100 }} />
        </AvatarContainer>
        <ProfileInfo>
          <ProfileDetail><PersonIcon /> {name}</ProfileDetail>
          <ProfileDetail><PhoneIcon /> {phone}</ProfileDetail>
          <ProfileDetail><WcIcon /> {sex}</ProfileDetail>
          <ProfileDetail><CalendarTodayIcon /> {age} Years Old</ProfileDetail>
          <ProfileDetail><DriveEtaIcon /> {carModel}</ProfileDetail>
          <ProfileDetail><FormatListNumberedIcon /> {carRegistration}</ProfileDetail>
          <CarImage src={carPicture} alt="Car" />
          <StarRating rating={rating} />
        </ProfileInfo>
      </StyledPaper>
    </ProfileContainer>
  );
};

// Styled Components
const ProfileContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const StyledPaper = styled(Paper)`
  width: 100%;
  max-width: 400px;
  padding: 20px;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const AvatarContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;

  @media (max-width: 768px) {
    margin-top: 10px;
  }
`;

const ProfileDetail = styled.p`
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 14px;
  }
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
  margin-top: 10px;
`;

export default ProfileCard;
