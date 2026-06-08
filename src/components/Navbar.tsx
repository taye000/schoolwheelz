"use client";

import React, { useState, useEffect } from "react";
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemText,
    Avatar,
    Popover,
    MenuItem,
    Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import styled from "styled-components";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { colors } from "@/lib/theme";
import NotificationBell from "@/components/NotificationBell";
import { AppLogoIcon } from "@/components/AppLogo";

interface User {
    _id: string;
    fullName: string;
    email: string;
    userType: "parent" | "driver" | "admin";
}

const Navbar: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const toggleDrawer = (open: boolean) => () => {
        setDrawerOpen(open);
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/auth/me", {
                    credentials: "include",
                });
                const data = await res.json();
                setUser(data.success ? data.user : null);
            } catch {
                setUser(null);
            }
        };
        fetchUser();
    }, [pathname]);

    const handleAvatarClick = (e: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(e.currentTarget);
    };
    const handlePopoverClose = () => setAnchorEl(null);

    const handleSignOut = async () => {
        handlePopoverClose();
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch { /* ignore */ }
        router.push("/login");
    };

    const profileHref = user?.userType === "admin" ? "/admin" : "/profile";
    const popoverOpen = Boolean(anchorEl);

    return (
        <>
            <StyledAppBar position="sticky" elevation={0}>
                <ToolbarContainer>
                    <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
                        <AppLogoIcon size={32} />
                        <BrandName>School Wheelz</BrandName>
                    </Link>

                    <NavLinks>
                        {user?.userType !== "driver" && <NavLink href="/drivers">Drivers</NavLink>}
                        {user?.userType === "parent" && <NavLink href="/bookings">My Bookings</NavLink>}
                        {user?.userType === "driver" && <NavLink href="/bookings">My Bookings</NavLink>}
                        {user?.userType === "driver" && <NavLink href="/trips">My Trips</NavLink>}
                        {user?.userType === "admin" && (
                            <NavLink href="/admin">Admin Dashboard</NavLink>
                        )}
                        {!user && <NavLink href="/drivers">Drivers</NavLink>}
                        {!user && <NavLink href="/register">Register</NavLink>}
                        {!user && <NavLink href="/driver-registration">Drive with us</NavLink>}
                        {!user ? (
                            <SignInButton href="/login" variant="contained" size="small">
                                Sign In
                            </SignInButton>
                        ) : (
                            <>
                                <NotificationBell />
                                <UserChip onClick={handleAvatarClick}>
                                    <Avatar sx={{ width: 28, height: 28, bgcolor: user.userType === "admin" ? colors.warningAmber : colors.skyBlue, fontSize: "0.75rem" }}>
                                        {user.fullName?.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <span>{user.fullName?.split(" ")[0]}</span>
                                </UserChip>
                            </>
                        )}
                    </NavLinks>

                    <MobileMenuButton
                        edge="start"
                        color="inherit"
                        aria-label="open menu"
                        onClick={toggleDrawer(true)}
                    >
                        <MenuIcon />
                    </MobileMenuButton>
                </ToolbarContainer>
            </StyledAppBar>

            {/* Avatar popover */}
            <Popover
                open={popoverOpen}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{ sx: { mt: 1, minWidth: 180, borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", overflow: "hidden" } }}
            >
                {user && (
                    <>
                        <PopoverUser>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: user.userType === "admin" ? colors.warningAmber : colors.skyBlue, fontSize: "0.85rem" }}>
                                {user.fullName?.charAt(0).toUpperCase()}
                            </Avatar>
                            <div>
                                <PopoverName>{user.fullName}</PopoverName>
                                <PopoverRole>{user.userType}</PopoverRole>
                            </div>
                        </PopoverUser>
                        <Divider />
                        <MenuItem
                            onClick={() => { handlePopoverClose(); router.push(profileHref); }}
                            sx={{ gap: 1.5, py: 1.2, fontSize: "0.875rem", fontWeight: 500 }}
                        >
                            <AccountCircleIcon fontSize="small" sx={{ color: colors.skyBlue }} />
                            {user.userType === "admin" ? "Admin Dashboard" : "My Profile"}
                        </MenuItem>
                        <MenuItem
                            onClick={handleSignOut}
                            sx={{ gap: 1.5, py: 1.2, fontSize: "0.875rem", fontWeight: 500, color: colors.errorRed }}
                        >
                            <LogoutIcon fontSize="small" />
                            Sign Out
                        </MenuItem>
                    </>
                )}
            </Popover>

            <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
                <DrawerContainer>
                    <DrawerHeader>
                        <BrandName style={{ color: colors.deepNavy }}>School Wheelz</BrandName>
                        <IconButton onClick={toggleDrawer(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </DrawerHeader>
                    <List sx={{ flex: 1 }}>
                        {[
                            ...(user?.userType !== "driver" ? [{ href: "/drivers", label: "Drivers" }] : []),
                            ...(user?.userType === "parent" ? [{ href: "/bookings", label: "My Bookings" }, { href: "/profile", label: "My Profile" }] : []),
                            ...(user?.userType === "driver" ? [{ href: "/bookings", label: "My Bookings" }, { href: "/trips", label: "My Trips" }, { href: "/profile", label: "My Profile" }] : []),
                            ...(user?.userType === "admin" ? [{ href: "/admin", label: "Admin Dashboard" }] : []),
                            ...(!user ? [{ href: "/drivers", label: "Drivers" }, { href: "/register", label: "Register as Parent" }, { href: "/driver-registration", label: "Become a Driver" }] : []),
                        ].map((item) => (
                            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                                <ListItem onClick={toggleDrawer(false)} sx={{ borderRadius: "10px", mb: 0.5, "&:hover": { bgcolor: colors.lightBg } }}>
                                    <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600, color: colors.deepNavy }} />
                                </ListItem>
                            </Link>
                        ))}
                    </List>
                    {!user ? (
                        <DrawerFooter>
                            <Button variant="contained" href="/login" fullWidth size="large">
                                Sign In
                            </Button>
                        </DrawerFooter>
                    ) : null}
                </DrawerContainer>
            </Drawer>
        </>
    );
};

const StyledAppBar = styled(AppBar)`
  && {
    background: rgba(26, 54, 93, 0.97);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
`;

const ToolbarContainer = styled(Toolbar)`
  display: flex;
  justify-content: space-between;
  padding: 12px 24px !important;
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
  letter-spacing: -0.3px;
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  && {
    color: rgba(255,255,255,0.85);
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    padding: 6px 14px;
    border-radius: 8px;
    transition: all 0.15s;
    &:hover {
      color: #fff;
      background: rgba(255,255,255,0.1);
    }
  }
`;

const SignInButton = styled(Button)`
  && {
    background: rgba(255,255,255,0.15);
    color: #fff;
    border-radius: 50px;
    padding: 6px 20px;
    font-size: 0.875rem;
    font-weight: 600;
    backdrop-filter: blur(4px);
    &:hover {
      background: rgba(255,255,255,0.25);
    }
  }
` as typeof Button;

const PopoverUser = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
`;

const PopoverName = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${colors.deepNavy};
  line-height: 1.2;
`;

const PopoverRole = styled.div`
  font-size: 0.75rem;
  color: ${colors.mutedText};
  text-transform: capitalize;
`;

const UserChip = styled.button`
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.12);
  border-radius: 50px;
  padding: 4px 14px 4px 6px;
  color: #fff; font-size: 0.875rem; font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(255,255,255,0.22);
  }
`;

const MobileMenuButton = styled(IconButton)`
  && {
    display: none;
    color: #fff;
    @media (max-width: 768px) { display: flex; }
  }
`;

const DrawerContainer = styled.div`
  width: 300px;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 12px;
  border-bottom: 1px solid ${colors.border};
`;

const DrawerFooter = styled.div`
  padding: 16px 20px 24px;
  border-top: 1px solid ${colors.border};
`;

export default Navbar;
