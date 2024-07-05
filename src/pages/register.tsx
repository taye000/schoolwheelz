import React, { useState } from 'react';
import { TextField, Paper, FormControlLabel, Checkbox, Typography, Button } from '@mui/material';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { MapContainer } from './profile';

const Map = dynamic(() => import('../components/Map'), { ssr: false });

const RegisterForm: React.FC = () => {
    const [formData, setFormData] = useState({
        parentName: '',
        parentPhone: '',
        childName: '',
        schoolContact: '',
        pickupLocation: { lat: 0, lng: 0 },
        dropoffLocation: { lat: 0, lng: 0 },
        recurring: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleMapChange = (locations: { pickupLocation: { lat: number; lng: number }, dropoffLocation: { lat: number; lng: number } }) => {
        setFormData({
            ...formData,
            ...locations,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log(formData); // You can handle form submission logic here
    };

    return (
        <FormContainer>
            <StyledPaper elevation={3}>
                <Typography variant="h4" gutterBottom>
                    Register for School Pick-Up and Drop-Off
                </Typography>
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Parent's Name"
                        fullWidth
                        margin="normal"
                        name="parentName"
                        value={formData.parentName}
                        onChange={handleChange}
                        required
                    />
                    <TextField
                        label="Parent's Phone"
                        fullWidth
                        margin="normal"
                        name="parentPhone"
                        value={formData.parentPhone}
                        onChange={handleChange}
                        required
                    />
                    <TextField
                        label="Child's Name"
                        fullWidth
                        margin="normal"
                        name="childName"
                        value={formData.childName}
                        onChange={handleChange}
                        required
                    />
                    <TextField
                        label="School Contact"
                        fullWidth
                        margin="normal"
                        name="schoolContact"
                        value={formData.schoolContact}
                        onChange={handleChange}
                        required
                    />
                    <Typography variant="h6" gutterBottom>
                        Select Pick-Up and Drop-Off Locations
                    </Typography>
                    <MapContainer>
                        <Map
                            mode="register"
                            onLocationsChange={handleMapChange}
                        />
                    </MapContainer>
                    <FormControlLabel
                        control={
                            <Checkbox
                                name="recurring"
                                checked={formData.recurring}
                                onChange={handleChange}
                            />
                        }
                        label="Recurring Pick-Up"
                    />
                    <Button type="submit" variant="contained" color="primary">
                        Register
                    </Button>
                </form>
            </StyledPaper>
        </FormContainer>
    );
};

// Styled Components
const FormContainer = styled.div`
    width: 60%;
    margin: 0 auto;
    padding: 20px;

    @media (max-width: 768px) {
        width: 90%;
    }
`;

const StyledPaper = styled(Paper)`
    padding: 10px;
    margin: 20px 0;
`;


export default RegisterForm;
