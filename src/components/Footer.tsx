import React from 'react';
import { Typography, TextField, Button, IconButton } from '@mui/material';
import styled from 'styled-components';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

const Footer: React.FC = () => {
    return (
        <FooterContainer>
            <FooterContent>
                <FooterSection>
                    <Typography variant="body2" align="center">
                        Connect with us:
                    </Typography>
                    <SocialIcons>
                        <IconButton aria-label="Facebook" color="inherit">
                            <FacebookIcon />
                        </IconButton>
                        <IconButton aria-label="Twitter" color="inherit">
                            <TwitterIcon />
                        </IconButton>
                        <IconButton aria-label="Instagram" color="inherit">
                            <InstagramIcon />
                        </IconButton>
                        <IconButton aria-label="LinkedIn" color="inherit">
                            <LinkedInIcon />
                        </IconButton>
                    </SocialIcons>
                </FooterSection>
                <FooterSection>
                    <Typography variant="body2" align="center">
                        Subscribe to our newsletter for updates:
                    </Typography>
                    <NewsletterForm>
                        <TextField
                            id="newsletter-email"
                            label="Email"
                            variant="outlined"
                            size="small"
                            fullWidth
                            InputProps={{
                                endAdornment: (
                                    <Button variant="contained" color="primary" size="small">
                                        Subscribe
                                    </Button>
                                )
                            }}
                        />
                    </NewsletterForm>
                </FooterSection>
            </FooterContent>
            <Typography variant="body2" align="center" style={{ marginTop: '20px' }}>
                © {new Date().getFullYear()} School Wheelz. All rights reserved.
            </Typography>
        </FooterContainer>
    );
};

const FooterContainer = styled.footer`
    background-color: #333;
    color: #fff;
    padding: 40px 0;
    text-align: center;
`;

const FooterContent = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    max-width: 800px;
    margin: 0 auto;

    @media (min-width: 768px) {
        flex-direction: row;
    }
`;

const FooterSection = styled.div`
    flex: 1;
    margin: 20px;
`;

const SocialIcons = styled.div`
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;
`;

const NewsletterForm = styled.div`
    display: flex;
    align-items: center;
    margin-top: 10px;
`;

export default Footer;
