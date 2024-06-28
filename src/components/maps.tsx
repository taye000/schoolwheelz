// components/Map.tsx
import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import styled from 'styled-components';

const MapContainer = styled.div`
    width: 60%;
    float: left;
    margin-right: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0;
    overflow: hidden; /* Ensure no overflow */
`;

const Map = () => {
    const [location, setLocation] = useState({ lat: -3.745, lng: -38.523 });
    const [map, setMap] = useState<google.maps.Map | null>(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ lat: latitude, lng: longitude });
                },
                (error) => {
                    console.error('Error obtaining location', error);
                }
            );
        } else {
            console.error('Geolocation is not supported by this browser.');
        }
    }, []);

    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!googleMapsApiKey) {
        return <div>Error: Google Maps API key is not defined.</div>;
    }

    const handleLoad = (mapInstance: google.maps.Map | null) => {
        setMap(mapInstance);
    };

    return (
        <LoadScript googleMapsApiKey={googleMapsApiKey}>
            <MapContainer>
                <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={location}
                    zoom={15}
                    onLoad={handleLoad}
                >
                    {map && <Marker position={location} />}
                </GoogleMap>
            </MapContainer>
        </LoadScript>
    );
};

export default Map;
