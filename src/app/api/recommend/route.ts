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

  const apiUrl = `https://naveropenapi.apigw.ntruss.com/map-place/v1/search?query=음식점&coordinate=${lng},${lat}`;

  try {
    // --- 로그 추가 1: 어떤 주소로 요청하는지 확인 ---
    console.log('Requesting to Naver API:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_MAPS_CLIENT_ID!,
        'X-NCP-APIGW-API-KEY': process.env.NAVER_MAPS_CLIENT_SECRET!,
      },
    });

    const data = await response.json();

    // --- 로그 추가 2: 네이버로부터 받은 응답 데이터 전체를 확인 ---
    console.log('Received from Naver API:', JSON.stringify(data, null, 2));

    if (!data.places || data.places.length === 0) {
      console.log('No places found in the response.');
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
