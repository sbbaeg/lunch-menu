import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  try {
    const geoRes = await fetch(
      `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${lng},${lat}&output=json`,
      {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_MAPS_CLIENT_ID!,
          'X-NCP-APIGW-API-KEY': process.env.NAVER_MAPS_CLIENT_SECRET!,
        },
      }
    );
    const geoData = await geoRes.json();
    const regionName = geoData?.results?.[0]?.region?.area3?.name || '맛집';
    const query = `${regionName} 맛집`;

    const localRes = await fetch(
      `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(
        query
      )}&display=10&sort=random`, // 10개 검색
      {
        headers: {
          'X-Naver-Client-Id': process.env.NAVER_SEARCH_CLIENT_ID!,
          'X-Naver-Client-Secret': process.env.NAVER_SEARCH_CLIENT_SECRET!,
        },
      }
    );
    const localData = await localRes.json();

    if (!localData.items || localData.items.length === 0) {
      return NextResponse.json({ items: [] }); // 맛집이 없으면 빈 배열 반환
    }

    // (수정!) 랜덤 선택 로직을 제거하고, 맛집 목록 전체를 반환합니다.
    return NextResponse.json(localData);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data from Naver API' }, { status: 500 });
  }
}