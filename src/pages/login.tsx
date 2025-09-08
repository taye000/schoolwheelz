import React, { useState } from 'react';
import { TextField, Button, Typography, MenuItem } from '@mui/material';
import styled from 'styled-components';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

const Login: React.FC = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        userType: 'parent',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/auth/login', formData);
            if (response.status === 200) {
                toast.success('Login successful!');
                router.push('/profile')
            }
        } catch (error) {
            console.error('Error logging in:', error);
            toast.error('Failed to log in. Please check your credentials.');
        }
    };

    return (
        <LoginContainer>
            <FormContainer onSubmit={handleSubmit}>
                <Typography variant="h4" gutterBottom>
                    Sign In
                </Typography>
                <TextField
                    label="User Type"
                    name="userType"
                    value={formData.userType}
                    onChange={handleChange}
                    select
                    fullWidth
                    margin="normal"
                    required
                >
                    <MenuItem value="parent">Parent</MenuItem>
                    <MenuItem value="driver">Driver</MenuItem>
                </TextField>
                <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    required
                />
                <TextField
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    required
                />
                <Button type="submit" variant="contained" color="primary" fullWidth>
                    Sign In
                </Button>
            </FormContainer>
        </LoginContainer>
    );
};

const LoginContainer = styled.div`
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
`;

const FormContainer = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export default Login;
