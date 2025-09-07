import React, { useState } from 'react';
import styled from 'styled-components';
import { TextField, Button, MenuItem } from '@mui/material';

const DriverRegistration: React.FC = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        dob: '',
        licenseNumber: '',
        idNumber: '',
        email: '',
        phoneNumber: '',
        photo: '',
        sex: '',
        carMake: '',
        carModel: '',
        carRegNumber: '',
        carPhoto: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form Data:', formData);
    };

    return (
        <PageContainer>
            <FormContainer onSubmit={handleSubmit}>
                <h1>Driver Registration</h1>
                <TextField label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} fullWidth margin="normal" required />
                <TextField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} fullWidth margin="normal" required InputLabelProps={{ shrink: true }} />
                <TextField label="License Number" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} fullWidth margin="normal" required />
                <TextField label="ID Number" name="idNumber" value={formData.idNumber} onChange={handleChange} fullWidth margin="normal" required />
                <TextField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} fullWidth margin="normal" required />
                <TextField label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} fullWidth margin="normal" required />
                <TextField label="Photo URL" name="photo" value={formData.photo} onChange={handleChange} fullWidth margin="normal" required />
                <TextField
                    label="Sex"
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    select
                    fullWidth
                    margin="normal"
                    required
                >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                </TextField>
                <TextField label="Car Make" name="carMake" value={formData.carMake} onChange={handleChange} fullWidth margin="normal" required />
                <TextField label="Car Model" name="carModel" value={formData.carModel} onChange={handleChange} fullWidth margin="normal" required />
                <TextField label="Car Registration Number" name="carRegNumber" value={formData.carRegNumber} onChange={handleChange} fullWidth margin="normal" required />
                <TextField label="Car Photo URL" name="carPhoto" value={formData.carPhoto} onChange={handleChange} fullWidth margin="normal" required />
                <Button type="submit" variant="contained" color="primary" fullWidth>
                    Submit
                </Button>
            </FormContainer>
        </PageContainer>
    );
};

const PageContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export default DriverRegistration;
