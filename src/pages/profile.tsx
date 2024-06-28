import React from 'react';
import dynamic from 'next/dynamic';
import ProfileCard from '@/components/profilecard';

const Map = dynamic(() => import('../components/maps'), { ssr: false });

const Profile = () => {
    return (
        <div>
            <h1>Driver Tracking Map</h1>
            <div style={{ display: 'flex' }}>
                <ProfileCard />
                <Map />
            </div>
        </div>
    );
};

export default Profile;
