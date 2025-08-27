'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 추천 결과 데이터의 타입을 정의합니다.
interface Recommendation {
  title: string;
  category: string;
  address: string;
  mapx: string; // API 응답이 문자열이므로 string으로 받습니다.
  mapy: string;
}

export default function Home() {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<naver.maps.Map | null>(null); // map 객체를 ref로 관리
  const markerInstance = useRef<naver.maps.Marker | null>(null); // marker 객체를 ref로 관리
  const [loading, setLoading] = useState(false);

  // 지도 초기화 로직
useEffect(() => {
    const script = document.createElement('script');
    
    // (가장 중요!) URL 끝에 '&submodules=TransCoord'를 추가하여 좌표 변환 확장 기능을 함께 불러옵니다.
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID}&submodules=TransCoord`;
    
    script.async = true;
    script.onload = () => {
      if (mapElement.current && !mapInstance.current) {
        const mapOptions = {
          center: new window.naver.maps.LatLng(37.5665, 126.9780), // 서울 시청 기본 위치
          zoom: 15,
        };
        mapInstance.current = new window.naver.maps.Map(mapElement.current, mapOptions);
      }
    };
    document.head.appendChild(script);
}, []);

  // 추천 버튼 클릭 핸들러
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
          // 1. 우리 백엔드 API에 현재 위치 좌표를 보내 맛집 추천 요청
          const response = await fetch(`/api/recommend?lat=${latitude}&lng=${longitude}`);
          const data: Recommendation = await response.json();

          if (!response.ok) {
            throw new Error('Failed to fetch recommendation');
          }

          setRecommendation(data);
          
          if (mapInstance.current) {
            // 2. 백엔드에서 받은 TM128 좌표를 위도/경도로 변환
            const point = new window.naver.maps.Point(Number(data.mapx), Number(data.mapy));
            const latlng = window.naver.maps.TransCoord.fromTM128ToLatLng(point);

            // 3. 변환된 좌표로 지도의 중심을 이동하고 새로운 마커를 생성
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
      <Button onClick={handleRecommendClick} disabled={loading} size="lg">
        {loading ? '주변 맛집 검색 중...' : '점심 메뉴 추천받기!'}
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