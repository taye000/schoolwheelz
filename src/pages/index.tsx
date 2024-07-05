// pages/index.tsx
import React from 'react';
import styled from 'styled-components';
import { Button, Typography } from '@mui/material';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

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
      {/* Additional sections for features or benefits */}
    </Container>
  );
};

const Container = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 100vh; /* Ensure the container takes up the full viewport height */
`;

const HeroSection = styled.section`
    background-color: #f0f0f0;
    padding: 100px 0;
    text-align: center;
    flex-grow: 1; /* Allow HeroSection to grow and take up remaining space */
`;

const HeroContent = styled.div`
    max-width: 800px;
    margin: 0 auto;
`;

export default LandingPage;
