import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Drawer, List, ListItem, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import styled from 'styled-components';
import Link from 'next/link';

const Navbar: React.FC = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);

    const toggleDrawer = (open: boolean) => () => {
        setDrawerOpen(open);
    };

    return (
        <>
            <AppBar position="static">
                <ToolbarContainer>
                    <Link href="/" passHref>
                        <StyledTypography variant="h6" sx={{ flexGrow: 1 }}>
                            School Wheelz
                        </StyledTypography>
                    </Link>
                    <NavLinks>
                        <Link href="/drivers" passHref>
                            <NavLink>Drivers</NavLink>
                        </Link>
                        <Link href="/profile" passHref>
                            <NavLink>Profile</NavLink>
                        </Link>
                        <Link href="/register" passHref>
                            <NavLink>Register</NavLink>
                        </Link>
                    </NavLinks>
                    <MobileMenuIcon>
                        <IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleDrawer(true)}>
                            <MenuIcon />
                        </IconButton>
                    </MobileMenuIcon>
                </ToolbarContainer>
            </AppBar>
            <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
                <DrawerContainer>
                    <List>
                        <Link href="/drivers" passHref>
                            <ListItem onClick={toggleDrawer(false)}>
                                <ListItemText primary="Drivers" />
                            </ListItem>
                        </Link>
                        <Link href="/profile" passHref>
                            <ListItem onClick={toggleDrawer(false)}>
                                <ListItemText primary="Profile" />
                            </ListItem>
                        </Link>
                        <Link href="/register" passHref>
                            <ListItem onClick={toggleDrawer(false)}>
                                <ListItemText primary="Register" />
                            </ListItem>
                        </Link>
                    </List>
                </DrawerContainer>
            </Drawer>
        </>
    );
};

const ToolbarContainer = styled(Toolbar)`
    display: flex;
    justify-content: space-between;
`;

const NavLinks = styled.div`
    display: flex;
    gap: 20px;

    @media (max-width: 768px) {
        display: none;
    }
`;

const NavLink = styled(Button)`
    && {
        color: #fff;
        text-transform: none;
        &:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }
    }
`;

const MobileMenuIcon = styled.div`
    display: none;

    @media (max-width: 768px) {
        display: flex;
    }
`;

const DrawerContainer = styled.div`
    width: 250px;
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-sizing: border-box;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
        display: none;
    }

    @media (max-width: 768px) {
        width: 100%;
    }
`;

const StyledTypography = styled(Typography)`
    && {
        color: #fff;
        text-transform: none;
        font-weight: bold;
        font-size: 24px;
        margin: 0;
        padding: 0;
    }
`;


export default Navbar;
