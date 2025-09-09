import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import styled from "styled-components";
import ProfileCard from "@/components/Profilecard";
import { Button, CircularProgress } from "@mui/material";
import { useRouter } from 'next/router';

const Map = dynamic(() => import("../components/Map"), { ssr: false });

const PageContainer = styled.div`
  width: 80%;
  margin: 0 auto;
  padding: 20px;
  @media (max-width: 768px) {
    width: 100%;
    padding: 10px;
  }
`;

const ContentContainer = styled.div`
  display: flex;
  gap: 20px;
  @media (max-width: 768px) {
    flex-direction: column-reverse;
    gap: 0;
  }
`;

export const MapContainer = styled.div`
  flex: 2;
  min-width: 300px;
  height: 400px;
  @media (max-width: 768px) {
    width: 100%;
    height: calc(66vh - 10px);
    margin-bottom: 10px;
  }
`;

const ProfileCardContainer = styled.div`
  flex: 1;
  min-width: 300px;
  max-width: 400px;
  @media (max-width: 768px) {
    width: 100%;
    height: calc(34vh - 10px);
  }
`;

interface User {
    _id: string;
    userType: "parent" | "driver";
    fullName: string;
    email: string;
    phoneNumber: string;
    photo?: string;
    sex?: string;
    carModel?: string;
    carRegNumber?: string;
    carPhoto?: string;
    children?: Array<{ _id: string; name: string; age: number; grade: string; school: string; gender: string }>;
}

const Profile = () => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number }>({
        lat: -3.745,
        lng: -38.523,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch logged-in user
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/auth/me", {
                    method: "GET",
                    credentials: "include",
                });
                const data = await res.json();
                if (data.success) {
                    setUser(data.user);
                }
            } catch (err) {
                console.error("Failed to fetch user:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => console.error("Location error:", err)
            );
        }
    }, []);

    const handleLogout = async () => {
        try {
            const res = await fetch("/api/auth/logout", {
                method: "POST",
            });
            if (res.ok) {
                router.push("/login")
            }
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    if (loading) return <CircularProgress />;

    if (!user) return <p>Please login to view your profile.</p>;

    return (
        <PageContainer>
            <ContentContainer>
                <ProfileCardContainer>
                    {/* Render different layouts */}
                    {user.userType === "driver" ? (
                        <ProfileCard
                            _id={user._id}
                            photo={user.photo || "/avatar.jpg"}
                            fullName={user.fullName}
                            phoneNumber={user.phoneNumber}
                            sex={user.sex || ""}
                            carModel={user.carModel || ""}
                            carRegNumber={user.carRegNumber || ""}
                            carPhoto={user.carPhoto || ""}
                            rating={4.5}
                            dob={"1990-01-01"}
                        />
                    ) : (
                        <div>
                            <h2>{user.fullName} (Parent)</h2>
                            <p>Email: {user.email}</p>
                            <p>Phone: {user.phoneNumber}</p>
                            <p>Address: {(user as any).address}</p>
                            <h3>Children:</h3>
                            <ul>
                                {user.children?.map((child, idx) => (
                                    <li key={idx}>
                                        {child.name}, {child.age} years, Grade {child.grade}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </ProfileCardContainer>
                {user.userType === "driver" && (
                    <MapContainer>
                        <Map mode="profile" driverLocation={driverLocation} />
                    </MapContainer>
                )}
            </ContentContainer>
            <Button type="button" variant="contained" color="secondary" onClick={handleLogout}>
                Logout
            </Button>
        </PageContainer>
    );
};

export default Profile;