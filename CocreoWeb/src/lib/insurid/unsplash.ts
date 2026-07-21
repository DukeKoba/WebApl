import type { Category } from "./types";

const CATEGORY_QUERIES: Record<Category, string> = {
  broker:     "insurance broker business professionals office",
  insurer:    "artificial intelligence technology data digital",
  market:     "stock market finance economy charts trading",
  claims:     "insurance claims damage assessment accident",
  regulation: "law regulation compliance gavel courthouse",
  strategy:   "business strategy merger acquisition corporate",
  howto:      "business guide workshop training professional",
};

// picsum.photos seeds per category — used as fallback when Unsplash is unavailable
const PICSUM_SEEDS: Record<Category, string[]> = {
  broker:     ["ins-broker-1", "ins-broker-2", "ins-broker-3", "ins-broker-4", "ins-broker-5"],
  insurer:    ["ins-tech-1",   "ins-tech-2",   "ins-tech-3",   "ins-tech-4",   "ins-tech-5"],
  market:     ["ins-mkt-1",    "ins-mkt-2",    "ins-mkt-3",    "ins-mkt-4",    "ins-mkt-5"],
  claims:     ["ins-claim-1",  "ins-claim-2",  "ins-claim-3",  "ins-claim-4",  "ins-claim-5"],
  regulation: ["ins-reg-1",    "ins-reg-2",    "ins-reg-3",    "ins-reg-4",    "ins-reg-5"],
  strategy:   ["ins-str-1",    "ins-str-2",    "ins-str-3",    "ins-str-4",    "ins-str-5"],
  howto:      ["ins-how-1",    "ins-how-2",    "ins-how-3",    "ins-how-4",    "ins-how-5"],
};

export interface UnsplashPhoto {
  url: string;       // regular ~1080px — hero用
  smallUrl: string;  // small ~400px  — listサムネイル用
  credit: { name: string; username: string };
}

function makePicsumPhotos(cat: string): UnsplashPhoto[] {
  const seeds = (PICSUM_SEEDS as Record<string, string[]>)[cat] ?? PICSUM_SEEDS.broker;
  return seeds.map((seed) => ({
    url:      `https://picsum.photos/seed/${seed}/1080/600`,
    smallUrl: `https://picsum.photos/seed/${seed}/400/250`,
    credit: { name: "picsum.photos", username: "" },
  }));
}

// カテゴリごとに複数枚キャッシュ（1時間有効）
const CACHE = new Map<Category, { photos: UnsplashPhoto[]; expiry: number }>();
const TTL_MS = 60 * 60 * 1000;
const FETCH_COUNT = 5;

async function fetchMultiple(cat: Category, key: string): Promise<UnsplashPhoto[]> {
  const cached = CACHE.get(cat);
  if (cached && cached.expiry > Date.now()) return cached.photos;

  const query = encodeURIComponent(CATEGORY_QUERIES[cat]);
  const res = await fetch(
    `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&count=${FETCH_COUNT}&client_id=${key}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Unsplash ${res.status} for ${cat}`);
  const data = await res.json();

  const list = Array.isArray(data) ? data : [data];
  const photos: UnsplashPhoto[] = list.map((item: Record<string, unknown>) => {
    const urls = item.urls as Record<string, string> | undefined;
    const user = item.user as Record<string, string> | undefined;
    return {
      url:      urls?.regular  ?? "",
      smallUrl: urls?.small    ?? urls?.regular ?? "",
      credit: { name: user?.name ?? "", username: user?.username ?? "" },
    };
  });

  CACHE.set(cat, { photos, expiry: Date.now() + TTL_MS });
  return photos;
}

export async function fetchCategoryPhotos(
  categories: Category[]
): Promise<Partial<Record<Category, UnsplashPhoto[]>>> {
  if (!categories?.length) return {};

  const key = process.env.UNSPLASH_ACCESS_KEY;

  // Unsplash キーがない場合は picsum.photos フォールバック
  if (!key) {
    return Object.fromEntries(
      categories.map((cat) => [cat, makePicsumPhotos(cat)])
    ) as Partial<Record<Category, UnsplashPhoto[]>>;
  }

  const results = await Promise.allSettled(
    categories.map(async (cat) => ({ cat, photos: await fetchMultiple(cat, key) }))
  );

  const map: Partial<Record<Category, UnsplashPhoto[]>> = {};
  for (const r of results) {
    if (r.status === "fulfilled") {
      map[r.value.cat] = r.value.photos;
    } else {
      // Unsplash 失敗時は picsum フォールバック（catは取れないので後で補完）
    }
  }

  // Unsplash で取得できなかったカテゴリは picsum で補完
  for (const cat of categories) {
    if (!map[cat]) map[cat] = makePicsumPhotos(cat);
  }

  return map;
}

// 記事インデックスに応じて写真を順番に割り当てる
export function pickPhoto(
  photos: Partial<Record<Category, UnsplashPhoto[]>>,
  cat: Category,
  idx: number
): UnsplashPhoto | undefined {
  const list = photos[cat];
  if (!list?.length) return undefined;
  return list[idx % list.length];
}
