'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Recommendation {
  title: string;
  category: string;
  address: string;
  mapx: number;
  mapy: number;
}

export default function Home() {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  const [marker, setMarker] = useState<naver.maps.Marker | null>(null);
  const [loading, setLoading] = useState(false);
  const mapElement = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 1. 이미 스크립트가 로드되었거나, naver 객체가 이미 존재하면 중복 실행 방지
    if (window.naver && window.naver.maps) {
        // 지도를 즉시 초기화
        if (mapElement.current && !map) {
            const mapOptions = {
                center: new window.naver.maps.LatLng(37.3595704, 127.105399),
                zoom: 15,
            };
            const mapInstance = new window.naver.maps.Map(mapElement.current, mapOptions);
            setMap(mapInstance);
        }
        return;
    }

    // 2. 스크립트 태그 생성
    const script = document.createElement('script');
    
    // 3. (가장 중요!) ncpClientId를 ncpKeyId로 변경
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}`;
    
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // 4. 스크립트 로드 완료 후 실행될 콜백 함수
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
}, [map]); // map 상태가 변경될 때도 이 effect를 다시 확인할 수 있도록 추가

  const handleRecommendClick = () => {
    setLoading(true);
    if (marker) {
      marker.setMap(null);
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await fetch(`/api/recommend?lat=${latitude}&lng=${longitude}`);
        const data = await response.json();
        if (response.ok) {
          setRecommendation(data);
          if (map) {
            const recommendedLatLng = new naver.maps.LatLng(data.mapy, data.mapx);
            map.setCenter(recommendedLatLng);
            const newMarker = new naver.maps.Marker({
              position: recommendedLatLng,
              map: map,
            });
            setMarker(newMarker);
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
