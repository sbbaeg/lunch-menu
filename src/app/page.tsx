'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import '@/types/index.d';

interface NaverRestaurantItem {
  title: string;
  category: string;
  address: string;
  mapx: string;
  mapy: string;
}

interface NaverSearchResponse {
  items: NaverRestaurantItem[];
}

export default function Home() {
  const [recommendation, setRecommendation] = useState<NaverRestaurantItem | null>(null);
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const markerInstance = useRef<naver.maps.Marker | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    const scriptId = 'naver-maps-script';
    if (document.getElementById(scriptId)) {
      setIsMapReady(true);
      return;
    }
  
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID}&submodules=TransCoord`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (mapElement.current && !mapInstance.current) {
        const mapOptions = {
          center: new window.naver.maps.LatLng(37.5665, 126.9780),
          zoom: 15,
        };
        mapInstance.current = new window.naver.maps.Map(mapElement.current, mapOptions);
        setIsMapReady(true);
      }
    };
  }, []);

  const handleRecommendClick = () => {
    setLoading(true);
    setRecommendation(null);
    if (markerInstance.current) {
      markerInstance.current.setMap(null);
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`/api/recommend?lat=${latitude}&lng=${longitude}`);
          if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
          }
          const data: NaverSearchResponse = await response.json();

          // (수정!) 프론트엔드에서 맛집 목록을 받았는지 확인
          if (!data.items || data.items.length === 0) {
            alert('주변에 추천할 맛집을 찾지 못했어요!');
            setLoading(false);
            return;
          }

          // (수정!) 프론트엔드에서 랜덤 선택
          const randomIndex = Math.floor(Math.random() * data.items.length);
          const randomRestaurant = data.items[randomIndex];
          setRecommendation(randomRestaurant);
          
          if (mapInstance.current) {
            const point = new window.naver.maps.Point(Number(randomRestaurant.mapx), Number(randomRestaurant.mapy));
            const latlng = window.naver.maps.TransCoord.fromTM128ToLatLng(point);

            mapInstance.current.setCenter(latlng);
            markerInstance.current = new window.naver.maps.Marker({
              position: latlng,
              map: mapInstance.current,
            });
          }
        } catch (error) {
          console.error('Error fetching recommendation:', error);
          alert('맛집을 찾는 데 실패했습니다.');
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
      <h1 className="text-3xl font-bold mb-4">오늘 뭐 먹지? 🤔</h1>
      <div id="map" ref={mapElement} style={{ width: '100%', maxWidth: '800px', height: '400px', marginBottom: '20px', border: '1px solid #ccc' }}></div>
      <Button onClick={handleRecommendClick} disabled={loading || !isMapReady} size="lg">
        {loading ? '주변 맛집 검색 중...' : (isMapReady ? '점심 메뉴 추천받기!' : '지도 로딩 중...')}
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