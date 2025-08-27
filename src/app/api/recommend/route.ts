import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  try {
    // 1단계: 좌표 -> 주소 변환 (Maps API 키 사용)
    const geoRes = await fetch(
      `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${lng},${lat}&output=json`,
      {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_MAPS_CLIENT_ID!, // (수정된 부분)
          'X-NCP-APIGW-API-KEY': process.env.NAVER_MAPS_CLIENT_SECRET!,
        },
      }
    );
    const geoData = await geoRes.json();
    const regionName = geoData?.results?.[0]?.region?.area3?.name || '맛집';
    const query = `${regionName} 맛집`;

    // 2단계: 주소 -> 맛집 검색 (Search API 키 사용)
    const localRes = await fetch(
      `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(
        query
      )}&display=10&sort=random`,
      {
        headers: {
          'X-Naver-Client-Id': process.env.NAVER_SEARCH_CLIENT_ID!,
          'X-Naver-Client-Secret': process.env.NAVER_SEARCH_CLIENT_SECRET!,
        },
      }
    );
    const localData = await localRes.json();

    if (!localData.items || localData.items.length === 0) {
      return NextResponse.json({ error: 'No restaurants found nearby' }, { status: 404 });
    }

    // 3단계: 랜덤으로 맛집 선택 후 반환
    const randomIndex = Math.floor(Math.random() * localData.items.length);
    const restaurant = localData.items[randomIndex];

    return NextResponse.json(restaurant);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data from Naver API' }, { status: 500 });
  }
}