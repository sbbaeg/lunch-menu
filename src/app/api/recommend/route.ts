// 파일 경로: src/app/api/recommend/route.ts

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  // (수정!) 네이버 클라우드 플랫폼의 Places API 엔드포인트 사용
  const apiUrl = `https://naveropenapi.apigw.ntruss.com/map-place/v1/search?query=맛집&coordinate=${lng},${lat}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        // (중요!) Places API는 Maps API 키를 사용합니다.
        'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_MAPS_CLIENT_ID!,
        'X-NCP-APIGW-API-KEY': process.env.NAVER_MAPS_CLIENT_SECRET!,
      },
    });

    const data = await response.json();

    // Places API의 응답 형식은 'places' 배열입니다.
    if (!data.places || data.places.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // (수정!) 응답 데이터 구조에 맞게 반환
    // Places API는 표준 위경도(WGS84)를 반환하므로 좌표 변환이 필요 없습니다.
    const items = data.places.map((place: any) => ({
      title: place.name,
      category: place.category,
      address: place.road_address,
      mapx: place.x, // 경도
      mapy: place.y, // 위도
    }));

    return NextResponse.json({ items });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data from Naver API' }, { status: 500 });
  }
}
