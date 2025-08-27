'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

declare global {
  interface Window {
    naver: any;
  }
}

interface Recommendation {
  title: string;
  category: string;
  address: string;
  coordinates: {
    lat: string;
    lon: string;
  };
}

export default function Home() {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [map, setMap] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const mapElement = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (mapElement.current) {
        const mapOptions = {
          center: new window.naver.maps.LatLng(37.3595704, 127.105399),
          zoom: 15,
        };
        const mapInstance = new window.naver.maps.Map(mapElement.current, mapOptions);
        setMap(mapInstance);
      }
    };
  }, []);

  const handleRecommendClick = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await fetch(`/api/recommend?lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        if (response.ok) {
          setRecommendation(data);
          if (map) {
            const recommendedLatLng = new window.naver.maps.LatLng(data.coordinates.lat, data.coordinates.lon);
            map.setCenter(recommendedLatLng);
            new window.naver.maps.Marker({
              position: recommendedLatLng,
              map: map,
            });
          }
        } else {
          console.error(data.error);
        }
      } catch (error) {
        console.error('Failed to fetch recommendation:', error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Geolocation error:", error);
      setLoading(false);
    });
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <div id="map" ref={mapElement} style={{ width: '100%', height: '400px', marginBottom: '20px' }}></div>
      <Button onClick={handleRecommendClick} disabled={loading}>
        {loading ? 'Searching...' : 'Get Lunch Recommendation'}
      </Button>
      {recommendation && (
        <Card className="mt-4 w-full max-w-md">
          <CardHeader>
            <CardTitle>{recommendation.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Category:</strong> {recommendation.category}</p>
            <p><strong>Address:</strong> {recommendation.address}</p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}