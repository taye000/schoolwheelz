import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import styled from 'styled-components';

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh; /* Center vertically on the screen */
`;

const Loading = () => {
    return (
        <LoadingContainer>
            <CircularProgress color="primary" />
        </LoadingContainer>
    );
};

export default Loading;
