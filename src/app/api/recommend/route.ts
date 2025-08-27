import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  // Note: The Naver Local Search API does not directly support searching by coordinates.
  // A generic query is used here. For a more location-specific search,
  // a reverse geocoding step would be needed to get an address from the coordinates,
  // and that address would be used in the search query.
  const query = '맛집'; // "Good restaurant" in Korean

  const naverApiUrl = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5`;

  try {
    const response = await fetch(naverApiUrl, {
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID || '',
        'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET || '',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json({ error: 'Failed to fetch data from Naver API', details: errorBody }, { status: response.status });
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ error: 'No restaurants found' }, { status: 404 });
    }

    const randomIndex = Math.floor(Math.random() * data.items.length);
    const randomRestaurant = data.items[randomIndex];

    const result = {
      title: randomRestaurant.title.replace(/<[^>]*>?/gm, ''),
      category: randomRestaurant.category,
      address: randomRestaurant.address,
      coordinates: {
        lat: randomRestaurant.mapy,
        lon: randomRestaurant.mapx,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
