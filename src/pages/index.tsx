import React from 'react';
import styled from 'styled-components';
import { Button, Typography } from '@mui/material';

const LandingPage: React.FC = () => {
  return (
    <Container>
      <HeroSection>
        <HeroContent>
          <Typography variant="h2" gutterBottom>
            Welcome to School Wheelz
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Your trusted solution for safe school transportation.
          </Typography>
          <Button variant="contained" color="primary" size="large" href="/register">
            Register Now
          </Button>
        </HeroContent>
      </HeroSection>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* Ensure the container takes up the full viewport height */
`;

const HeroSection = styled.section`
  background-image: url(${"unnamed.png"});
  background-size: cover;
  background-position: center;
  padding: 100px 20px; /* Adjust padding for top and bottom, reduce left and right padding for smaller screens */
  text-align: center;
  flex-grow: 1; /* Allow HeroSection to grow and take up remaining space */
  position: relative; /* Ensure positioning context for absolute positioning */

  @media (max-width: 768px) {
    padding: 80px 20px; /* Adjust padding for smaller screens */
  }

  @media (max-width: 480px) {
    padding: 60px 20px; /* Further reduce padding for extra small screens */
  }
`;

const HeroContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1; /* Ensure content is above the background image */

  @media (max-width: 768px) {
    max-width: 600px; /* Adjust maximum width for smaller screens */
  }

  @media (max-width: 480px) {
    max-width: 400px; /* Further adjust maximum width for extra small screens */
  }
`;

export default LandingPage;
