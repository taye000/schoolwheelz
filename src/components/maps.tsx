import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import styled from 'styled-components';

const MapContainer = styled.div`
    flex: 1;
    height: 400px; /* Adjust height as needed */
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0;
    overflow: hidden; /* Ensure no overflow */
`;

const Map = () => {
    const [location, setLocation] = useState({ lat: -3.745, lng: -38.523 });
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

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
        setMapLoaded(true);
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
                    {mapLoaded && map && (
                        <Marker
                            key={`${location.lat}-${location.lng}`} // Update key to force re-render
                            position={location}
                            icon={{
                                url: 'https://img.icons8.com/?size=100&id=qzKNWF9sbXPV&format=png&color=000000',
                                scaledSize: new google.maps.Size(20, 20),
                                origin: new google.maps.Point(0, 0),
                                anchor: new google.maps.Point(10, 10),
                            }}
                        />
                    )}
                </GoogleMap>
            </MapContainer>
        </LoadScript>
    );
};

export default Map;
