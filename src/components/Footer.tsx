"use client";

import React from "react";
import { Typography, IconButton } from "@mui/material";
import styled from "styled-components";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import { colors } from "@/lib/theme";

const Footer: React.FC = () => {
    return (
        <FooterContainer>
            <FooterInner>
                <BrandCol>
                    <LogoRow>
                        <LogoBadge>
                            <DirectionsBusIcon sx={{ fontSize: 20, color: colors.skyBlue }} />
                        </LogoBadge>
                        <BrandName>School Wheelz</BrandName>
                    </LogoRow>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", maxWidth: 260, lineHeight: 1.7 }}>
                        Safe, reliable, and trackable school transportation for parents and drivers.
                    </Typography>
                    <SocialRow>
                        {[FacebookIcon, TwitterIcon, InstagramIcon, LinkedInIcon].map((Icon, i) => (
                            <SocialBtn key={i} aria-label="social">
                                <Icon sx={{ fontSize: 18 }} />
                            </SocialBtn>
                        ))}
                    </SocialRow>
                </BrandCol>

                <LinksGrid>
                    <LinkCol>
                        <ColTitle>App</ColTitle>
                        <FooterLink href="/drivers">Browse Drivers</FooterLink>
                        <FooterLink href="/register">Register as Parent</FooterLink>
                        <FooterLink href="/driver-registration">Become a Driver</FooterLink>
                        <FooterLink href="/login">Sign In</FooterLink>
                    </LinkCol>
                    <LinkCol>
                        <ColTitle>Company</ColTitle>
                        <FooterLink href="#">About Us</FooterLink>
                        <FooterLink href="#">Safety</FooterLink>
                        <FooterLink href="#">Privacy Policy</FooterLink>
                        <FooterLink href="#">Terms of Service</FooterLink>
                    </LinkCol>
                </LinksGrid>
            </FooterInner>

            <Divider />

            <BottomRow>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem" }}>
                    © {new Date().getFullYear()} School Wheelz. All rights reserved.
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem" }}>
                    Built for safe school commutes
                </Typography>
            </BottomRow>
        </FooterContainer>
    );
};

const FooterContainer = styled.footer`
    background: ${colors.deepNavy};
    padding: 64px 0 0;
`;

const FooterInner = styled.div`
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    gap: 64px;
    flex-wrap: wrap;
`;

const BrandCol = styled.div`
    flex: 1;
    min-width: 240px;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const LogoRow = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

const LogoBadge = styled.div`
    width: 36px; height: 36px;
    background: rgba(255,255,255,0.1);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
`;

const BrandName = styled.span`
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
`;

const SocialRow = styled.div`
    display: flex;
    gap: 8px;
`;

const SocialBtn = styled.button`
    width: 36px; height: 36px;
    background: rgba(255,255,255,0.08);
    border: none;
    border-radius: 8px;
    color: rgba(255,255,255,0.7);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { background: rgba(255,255,255,0.16); color: #fff; }
`;

const LinksGrid = styled.div`
    display: flex;
    gap: 64px;
    flex-wrap: wrap;
`;

const LinkCol = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 140px;
`;

const ColTitle = styled.p`
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: rgba(255,255,255,0.4);
    margin: 0 0 4px;
`;

const FooterLink = styled.a`
    color: rgba(255,255,255,0.65);
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    transition: color 0.15s;
    &:hover { color: #fff; }
`;

const Divider = styled.hr`
    border: none;
    border-top: 1px solid rgba(255,255,255,0.08);
    margin: 48px 0 0;
`;

const BottomRow = styled.div`
    max-width: 1100px;
    margin: 0 auto;
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
`;

export default Footer;
