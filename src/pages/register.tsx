import React, { useState } from 'react';
import { TextField, Paper, FormControlLabel, Checkbox, Typography, Button } from '@mui/material';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { MapContainer } from './profile';
import axios from 'axios';

const Map = dynamic(() => import('../components/Map'), { ssr: false });

const RegisterForm: React.FC = () => {
    const [formData, setFormData] = useState({
        parentName: '',
        parentPhone: '',
        parentLocation: '',
        children: [
            { childName: '', school: '', location: '' }
        ],
        pickupLocation: { lat: 0, lng: 0 },
        dropoffLocation: { lat: 0, lng: 0 },
        recurring: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        if (name === 'parentName' || name === 'parentPhone' || name === 'parentLocation' || name === 'recurring') {
            setFormData({
                ...formData,
                [name]: type === 'checkbox' ? checked : value,
            });
        }
    };
    const handleMapChange = (locations: { pickupLocation: { lat: number; lng: number }, dropoffLocation: { lat: number; lng: number } }) => {
        setFormData({
            ...formData,
            ...locations,
        });
    };

    const handleChildChange = (index: number, field: string, value: string) => {
        const updatedChildren = formData.children.map((child, i) =>
            i === index ? { ...child, [field]: value } : child
        );
        setFormData({
            ...formData,
            children: updatedChildren,
        });
    };

    const handleAddChild = () => {
        setFormData({
            ...formData,
            children: [...formData.children, { childName: '', school: '', location: '' }],
        });
    };

    const handleRemoveChild = (index: number) => {
        setFormData({
            ...formData,
            children: formData.children.filter((_, i) => i !== index),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/parents-registration', formData);
            if (response.status === 201) {
                alert('Parent registered successfully!');
                setFormData({
                    parentName: '',
                    parentPhone: '',
                    parentLocation: '',
                    children: [
                        { childName: '', school: '', location: '' }
                    ],
                    pickupLocation: { lat: 0, lng: 0 },
                    dropoffLocation: { lat: 0, lng: 0 },
                    recurring: false,
                });
            }
        } catch (error) {
            console.error('Error registering parent:', error);
            alert('Failed to register parent. Please try again.');
        }
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
                        label="Parent's Location"
                        fullWidth
                        margin="normal"
                        name="parentLocation"
                        value={formData.parentLocation}
                        onChange={handleChange}
                        required
                    />

                    <Typography variant="h6" gutterBottom>
                        Children
                    </Typography>
                    {formData.children.map((child, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '8px' }}>
                            <TextField
                                label={`Child's Name`}
                                fullWidth
                                margin="normal"
                                value={child.childName}
                                onChange={e => handleChildChange(idx, 'childName', e.target.value)}
                                required
                            />
                            <TextField
                                label="School"
                                fullWidth
                                margin="normal"
                                value={child.school}
                                onChange={e => handleChildChange(idx, 'school', e.target.value)}
                                required
                            />
                            <TextField
                                label="Location"
                                fullWidth
                                margin="normal"
                                value={child.location}
                                onChange={e => handleChildChange(idx, 'location', e.target.value)}
                                required
                            />
                            {formData.children.length > 1 && (
                                <Button variant="outlined" color="secondary" onClick={() => handleRemoveChild(idx)} style={{ height: '56px' }}>
                                    Remove
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button variant="contained" color="primary" onClick={handleAddChild} style={{ marginBottom: '16px' }}>
                        Add Child
                    </Button>
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
