import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import styled from 'styled-components';

const MapContainer = styled.div`
    flex: 1;
    height: 400px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0;
    overflow: hidden;
`;

interface MapProps {
    mode: 'register' | 'profile';
    driverLocation?: { lat: number; lng: number };
    onLocationsChange?: (locations: { pickupLocation: { lat: number; lng: number }, dropoffLocation: { lat: number; lng: number } }) => void;
}

const Map: React.FC<MapProps> = ({ mode, driverLocation, onLocationsChange }) => {
    const [locations, setLocations] = useState<{ pickupLocation: { lat: number; lng: number }, dropoffLocation: { lat: number; lng: number } }>({
        pickupLocation: { lat: 0, lng: 0 },
        dropoffLocation: { lat: 0, lng: 0 }
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [markerCount, setMarkerCount] = useState(0);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocations({
                        pickupLocation: { lat: latitude, lng: longitude },
                        dropoffLocation: { lat: latitude, lng: longitude }
                    });
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

    const handleMapClick = (event: google.maps.MapMouseEvent) => {
        if (mode !== 'register') return;

        const latLng = event.latLng;
        if (latLng) {
            if (markerCount === 0) {
                setLocations(prevState => ({
                    ...prevState,
                    pickupLocation: { lat: latLng.lat(), lng: latLng.lng() }
                }));
                setMarkerCount(1);
            } else if (markerCount === 1) {
                setLocations(prevState => ({
                    ...prevState,
                    dropoffLocation: { lat: latLng.lat(), lng: latLng.lng() }
                }));
                setMarkerCount(2);
            }
            onLocationsChange?.(locations);
        }
    };

    return (
        <LoadScript googleMapsApiKey={googleMapsApiKey}>
            <MapContainer>
                <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={mode === 'profile' && driverLocation ? driverLocation : locations.pickupLocation}
                    zoom={15}
                    onLoad={handleLoad}
                    onClick={handleMapClick}
                >
                    {mapLoaded && map && (
                        <>
                            {mode === 'register' && (
                                <>
                                    <Marker
                                        key={`pickup-${locations.pickupLocation.lat}-${locations.pickupLocation.lng}`}
                                        position={locations.pickupLocation}
                                        icon={{
                                            url: 'https://img.icons8.com/?size=100&id=qzKNWF9sbXPV&format=png&color=000000',
                                            scaledSize: new google.maps.Size(20, 20),
                                            origin: new google.maps.Point(0, 0),
                                            anchor: new google.maps.Point(10, 10),
                                        }}
                                    />
                                    <Marker
                                        key={`dropoff-${locations.dropoffLocation.lat}-${locations.dropoffLocation.lng}`}
                                        position={locations.dropoffLocation}
                                        icon={{
                                            url: 'https://img.icons8.com/?size=100&id=qzKNWF9sbXPV&format=png&color=FF0000',
                                            scaledSize: new google.maps.Size(20, 20),
                                            origin: new google.maps.Point(0, 0),
                                            anchor: new google.maps.Point(10, 10),
                                        }}
                                    />
                                </>
                            )}
                            {mode === 'profile' && driverLocation && (
                                <Marker
                                    key={`driver-${driverLocation.lat}-${driverLocation.lng}`}
                                    position={driverLocation}
                                    icon={{
                                        url: 'https://img.icons8.com/?size=100&id=qzKNWF9sbXPV&format=png&color=0000FF',
                                        scaledSize: new google.maps.Size(20, 20),
                                        origin: new google.maps.Point(0, 0),
                                        anchor: new google.maps.Point(10, 10),
                                    }}
                                />
                            )}
                        </>
                    )}
                </GoogleMap>
            </MapContainer>
        </LoadScript>
    );
};

export default Map;
