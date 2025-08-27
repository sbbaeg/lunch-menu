import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  try {
    // 1단계: 좌표를 주소로 변환 (Reverse Geocoding)
    // 여기서는 'Maps' API의 Geocoding 기능을 사용합니다.
    const geoRes = await fetch(
      `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${lng},${lat}&output=json`,
      {
        headers: {
          // Geocoding은 Maps 키를 사용합니다. (ID만 필요)
          'X-NCP-APIGW-API-KEY-ID': process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID!,
          // Secret 키는 Maps 서비스의 Geocoding API 정책에 따라 필요할 수 있습니다.
          // 보통 NCP의 Geocoding은 ID만으로 되지만, 만약을 위해 Secret도 추가해둘 수 있습니다. (별도 발급 필요)
          'X-NCP-APIGW-API-KEY': process.env.NAVER_MAPS_CLIENT_SECRET!, // Maps용 Secret 키 (별도 발급 필요)
        },
      }
    );
    const geoData = await geoRes.json();
    
    // 변환된 주소에서 'ㅇㅇ동' 같은 지역 이름(area3)을 추출합니다. 없으면 '맛집'으로 대체.
    const regionName = geoData?.results?.[0]?.region?.area3?.name || '맛집';
    const query = `${regionName} 맛집`;

    // 2단계: 추출한 지역 이름으로 맛집 검색 (Local Search)
    // 여기서는 'Search' API 키를 사용합니다.
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

    // 3단계: 검색된 맛집 중 하나를 랜덤으로 선택하여 반환
    const randomIndex = Math.floor(Math.random() * localData.items.length);
    const restaurant = localData.items[randomIndex];

    return NextResponse.json(restaurant);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data from Naver API' }, { status: 500 });
  }
}