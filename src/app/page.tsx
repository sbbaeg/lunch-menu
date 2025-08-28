// 파일 경로: src/app/page.tsx

'use client';

import { useEffect } from 'react';

// (중요!) 여기에 본인의 Maps Client ID를 직접 입력해주세요.
const NAVER_MAPS_CLIENT_ID = '여기에 Maps Client ID 입력';

export default function Home() {
  useEffect(() => {
    // 스크립트 중복 로드 방지
    if (document.getElementById('naver-maps-script')) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'naver-maps-script';
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAPS_CLIENT_ID}&submodules=TransCoord`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // (수정!) 스크립트 로드가 완료된 후, 지도 관련 모든 로직을 실행합니다.
    script.onload = () => {
      console.log('Naver Maps script loaded successfully.');
      
      // window.naver 객체가 있는지 다시 한번 확인합니다.
      if (!window.naver || !window.naver.maps) {
        console.error('Naver Maps API did not load correctly.');
        alert('지도 API 로딩에 실패했습니다.');
        return;
      }

      // 테스트용 TM128 좌표 (강남역 부근)
      const tm128 = new window.naver.maps.Point(315035.5, 544256.5);

      try {
        // 좌표 변환 기능 테스트
        const latlng = window.naver.maps.TransCoord.fromTM128ToLatLng(tm128);
        console.log('Coordinate conversion successful:', latlng);
        alert('좌표 변환 성공! 위도: ' + latlng.y + ', 경도: ' + latlng.x);
      } catch (error) {
        console.error('Coordinate conversion failed:', error);
        alert('좌표 변환 실패! 콘솔을 확인하세요.');
      }
    };
  }, []);

  return (
    <main>
      <h1>Naver Maps API Test Page</h1>
      <p>F12를 눌러 콘솔 로그를 확인하세요.</p>
    </main>
  );
}