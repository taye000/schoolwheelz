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
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import Link from 'next/link';

export interface DriverProfile {
  _id: string;
  photo: string;
  fullName: string;
  phoneNumber: string;
  sex: string;
  dob: string;
  carRegNumber: string;
  carModel: string;
  carPhoto: string;
  rating?: number;
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
  _id,
  photo,
  fullName,
  phoneNumber,
  sex,
  dob,
  carRegNumber,
  carModel,
  carPhoto,
  rating,
}) => {
  return (
    <ProfileContainer>
      <Link href={`/drivers/${_id}`} passHref legacyBehavior>
        <StyledLink>
          <StyledPaper elevation={3}>
            <AvatarContainer>
              <Avatar src={photo} alt="Profile" sx={{ width: 100, height: 100, border: '4px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
            </AvatarContainer>
            <ProfileInfo>
              <NameRow>
                <PersonIcon style={{ marginRight: 8 }} />
                <NameText>{fullName}</NameText>
                <Badge>{carModel}</Badge>
              </NameRow>
              <DetailsGrid>
                <DetailItem><PhoneIcon /> <span>{phoneNumber}</span></DetailItem>
                <DetailItem><WcIcon /> <span>{sex}</span></DetailItem>
                <DetailItem><CalendarTodayIcon /> <span>{dob} Years Old</span></DetailItem>
                <DetailItem><FormatListNumberedIcon /> <span>{carRegNumber}</span></DetailItem>
              </DetailsGrid>
              <CarImage src={carPhoto} alt="Car" />
              <StarRow>
                <StarRating rating={rating || 0} />
                <RatingBadge>{rating?.toFixed(1) || 'N/A'}</RatingBadge>
              </StarRow>
            </ProfileInfo>
          </StyledPaper>
        </StyledLink>
      </Link>
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
  background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const StyledLink = styled.a`
  text-decoration: none !important;
  color: inherit;
  cursor: pointer;
  & span, & strong, & b {
    text-decoration: none !important;
    color: inherit;
  }
  &:hover, &:visited, &:active {
    text-decoration: none !important;
    color: inherit;
  }
`;

const StyledPaper = styled(Paper)`
  width: 100%;
  max-width: 400px;
  padding: 24px 20px;
  box-sizing: border-box;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(60, 72, 88, 0.12);
  background: linear-gradient(135deg, #fff 60%, #f3f4f6 100%);
  transition: box-shadow 0.2s, transform 0.2s;
  &:hover {
    box-shadow: 0 8px 32px rgba(60, 72, 88, 0.18);
    transform: translateY(-2px) scale(1.02);
  }

  @media (max-width: 768px) {
    padding: 12px 8px;
  }
`;
const NameRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const NameText = styled.span`
  font-size: 1.3rem;
  font-weight: 600;
  color: #2d3748;
  text-decoration: none !important;
`;

const Badge = styled.span`
  background: #6366f1;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 500;
  border-radius: 12px;
  padding: 2px 10px;
  margin-left: 8px;
  text-decoration: none !important;
`;

// Removed Divider
const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 18px 0 12px 0;
  width: 100%;
  justify-items: center;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1rem;
  color: #374151;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 6px 12px;
  box-shadow: 0 1px 4px rgba(60,72,88,0.06);
  min-width: 120px;
  justify-content: center;
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
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
`;

const StarsContainer = styled.div`
  display: flex;
  align-items: center;
  color: #fbbf24;
  margin-top: 10px;
`;

const StarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
`;

const RatingBadge = styled.span`
  background: #fbbf24;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 10px;
  padding: 2px 10px;
`;

export default ProfileCard;
