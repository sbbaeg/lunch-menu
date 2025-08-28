// 파일 경로: src/app/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 타입 정의 파일은 tsconfig.json을 통해 전역으로 적용되므로 import가 필요 없습니다.

interface PlaceItem {
  title: string;
  category: string;
  address: string;
  mapx: string;
  mapy: string;
}

interface ApiResponse {
  items: PlaceItem[];
}

export default function Home() {
  const [recommendation, setRecommendation] = useState<PlaceItem | null>(null);
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const markerInstance = useRef<naver.maps.Marker | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    const scriptId = 'naver-maps-script';
    if (document.getElementById(scriptId)) {
      if (window.naver && window.naver.maps) {
        setIsMapReady(true);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      setIsMapReady(true);
    };
  }, []);

  useEffect(() => {
    if (isMapReady && mapElement.current && !mapInstance.current) {
      const mapOptions = {
        center: new window.naver.maps.LatLng(37.5665, 126.9780),
        zoom: 15,
      };
      mapInstance.current = new window.naver.maps.Map(mapElement.current, mapOptions);
    }
  }, [isMapReady]);

  const handleRecommendClick = () => {
    setLoading(true);
    setRecommendation(null);
    if (markerInstance.current) {
      markerInstance.current.setMap(null);
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // (수정!) 맛집 검색 전에 지도를 현재 위치로 먼저 이동시킵니다.
        if (mapInstance.current) {
          const userLocation = new window.naver.maps.LatLng(latitude, longitude);
          mapInstance.current.setCenter(userLocation);
        }

        try {
          const response = await fetch(`/api/recommend?lat=${latitude}&lng=${longitude}`);
          if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
          }
          const data: ApiResponse = await response.json();

          if (!data.items || data.items.length === 0) {
            alert('주변에 추천할 음식점을 찾지 못했어요!');
            setLoading(false);
            return;
          }

          const randomIndex = Math.floor(Math.random() * data.items.length);
          const randomRestaurant = data.items[randomIndex];
          setRecommendation(randomRestaurant);

          if (mapInstance.current) {
            const latlng = new window.naver.maps.LatLng(
              Number(randomRestaurant.mapy),
              Number(randomRestaurant.mapx)
            );
            
            // (수정!) 마커만 새로 추가합니다. (지도는 이미 이동함)
            markerInstance.current = new window.naver.maps.Marker({
              position: latlng,
              map: mapInstance.current,
            });
          }
        } catch (error) {
          console.error('Error fetching recommendation:', error);
          alert('음식점을 찾는 데 실패했습니다.');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("위치 정보를 가져오는 데 실패했습니다. 위치 권한을 허용해주세요.");
        setLoading(false);
      }
    );
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">오늘 뭐 먹지? (feat.naver)</h1>
      <div id="map" ref={mapElement} style={{ width: '100%', maxWidth: '800px', height: '400px', marginBottom: '20px', border: '1px solid #ccc' }}></div>
      <Button onClick={handleRecommendClick} disabled={loading || !isMapReady} size="lg">
        {loading ? '주변 음식점 검색 중...' : (isMapReady ? '점심 메뉴 추천받기!' : '지도 로딩 중...')}
      </Button>
      {recommendation && (
        <Card className="mt-4 w-full max-w-md">
          <CardHeader>
            <CardTitle>{recommendation.title.replace(/<[^>]+>/g, "")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>카테고리:</strong> {recommendation.category}</p>
            <p><strong>주소:</strong> {recommendation.address}</p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
