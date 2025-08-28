// 파일 경로: src/app/api/recommend/route.ts

import { NextResponse } from 'next/server';

interface NaverPlace {
  name: string;
  category: string;
  road_address: string;
  x: string;
  y: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  // (수정!) 검색어를 '음식점'으로 변경하여 검색 범위를 넓힙니다.
  const apiUrl = `https://naveropenapi.apigw.ntruss.com/map-place/v1/search?query=음식점&coordinate=${lng},${lat}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_MAPS_CLIENT_ID!,
        'X-NCP-APIGW-API-KEY': process.env.NAVER_MAPS_CLIENT_SECRET!,
      },
    });

    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const items = data.places.map((place: NaverPlace) => ({
      title: place.name,
      category: place.category,
      address: place.road_address,
      mapx: place.x,
      mapy: place.y,
    }));

    return NextResponse.json({ items });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data from Naver API' }, { status: 500 });
  }
}
