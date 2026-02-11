export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  alt: string | null;
  src: {
    original: string;
    large: string;
    large2x: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[];
  total_results: number;
  page: number;
  per_page: number;
}

function getPexelsApiKey(): string {
  const key = process.env.NEXT_PUBLIC_PEXELS_API_KEY || '';
  if (!key) {
    console.warn('NEXT_PUBLIC_PEXELS_API_KEY is not set. Pexels search will not work.');
  }
  return key;
}

export async function searchPexels(query: string, perPage = 15): Promise<PexelsPhoto[]> {
  const apiKey = getPexelsApiKey();
  if (!apiKey) return [];

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;

  const res = await fetch(url, {
    headers: { Authorization: apiKey },
  });

  if (!res.ok) {
    throw new Error(`Pexels API error: ${res.status}`);
  }

  const data: PexelsSearchResponse = await res.json();
  return data.photos;
}

export async function getCuratedPhotos(perPage = 15): Promise<PexelsPhoto[]> {
  const apiKey = getPexelsApiKey();
  if (!apiKey) return [];

  const url = `https://api.pexels.com/v1/curated?per_page=${perPage}`;

  const res = await fetch(url, {
    headers: { Authorization: apiKey },
  });

  if (!res.ok) {
    throw new Error(`Pexels API error: ${res.status}`);
  }

  const data: PexelsSearchResponse = await res.json();
  return data.photos;
}
