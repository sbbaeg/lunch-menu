// 파일 경로: src/app/api/recommend/route.ts

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  try {
    // (수정!) Reverse Geocoding 없이 바로 지역 검색 API 호출
    const localRes = await fetch(
      // (수정!) URL에 좌표(longitude, latitude)와 반경(radius) 파라미터 추가
      `https://openapi.naver.com/v1/search/local.json?query=맛집&display=10&sort=random&longitude=${lng}&latitude=${lat}&radius=2000`, // 반경 2km
      {
        headers: {
          'X-Naver-Client-Id': process.env.NAVER_SEARCH_CLIENT_ID!,
          'X-Naver-Client-Secret': process.env.NAVER_SEARCH_CLIENT_SECRET!,
        },
      }
    );
    const localData = await localRes.json();

    if (!localData.items || localData.items.length === 0) {
      return NextResponse.json({ items: [] });
    }
    
    return NextResponse.json(localData);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data from Naver API' }, { status: 500 });
  }
}
