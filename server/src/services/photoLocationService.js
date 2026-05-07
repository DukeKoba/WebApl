import exifr from 'exifr';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import heicConvert from 'heic-convert';

// ユーザーエージェント：Nominatim 利用規約により必須
const USER_AGENT = 'WebApl-Ramen-Poster/1.0 (instagram caption generator)';

/** 先頭バイトを見て HEIC/HEIF を判定する（拡張子・mimeに頼らない） */
async function isHeic(srcPath) {
  try {
    const fd = await fs.open(srcPath, 'r');
    try {
      const { buffer } = await fd.read(Buffer.alloc(32), 0, 32, 0);
      // HEIC/HEIF: bytes 4-7 = "ftyp", bytes 8-11 in heic / heix / mif1 / msf1 / heim / heis ...
      if (buffer.slice(4, 8).toString('ascii') !== 'ftyp') return false;
      const brand = buffer.slice(8, 12).toString('ascii');
      return /^(heic|heix|hevc|hevx|mif1|msf1|heim|heis|hevm|hevs)$/i.test(brand);
    } finally {
      await fd.close();
    }
  } catch {
    return false;
  }
}

/**
 * Claude Vision / Instagram で扱える形式・サイズに正規化する。
 * - HEIC/HEIF を JPEG に事前変換（Linux ビルドの sharp は HEIC 読み込み非対応のため）
 * - EXIF orientation を反映してリサイズ前に回転
 * - 長辺 1568px に縮小（Claude 推奨上限）
 * - 出力は sRGB JPEG（HEIC・PNG・CMYK・wide gamut も全て JPEG 化）
 * 戻り値は { path, filename }（拡張子は .jpg）
 */
export async function normalizeImage(srcPath) {
  const dir = path.dirname(srcPath);
  const baseName = path.basename(srcPath, path.extname(srcPath));
  const outPath = path.join(dir, `${baseName}.jpg`);
  const tmpPath = `${outPath}.tmp`;

  // HEIC を先に JPEG バッファへ落としてから sharp に渡す
  let input = srcPath;
  if (await isHeic(srcPath)) {
    const inputBuffer = await fs.readFile(srcPath);
    input = await heicConvert({ buffer: inputBuffer, format: 'JPEG', quality: 0.9 });
  }

  try {
    await sharp(input, { failOn: 'none' })
      .rotate()
      .resize(1568, 1568, { fit: 'inside', withoutEnlargement: true })
      .toColorspace('srgb')
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(tmpPath);
  } catch (e) {
    console.error('[normalizeImage] sharp failed:', e.message);
    throw e;
  }

  if (path.resolve(srcPath) !== path.resolve(outPath)) {
    await fs.unlink(srcPath).catch(() => {});
  }
  await fs.rename(tmpPath, outPath);

  return { path: outPath, filename: path.basename(outPath) };
}

/**
 * 画像ファイルから GPS 座標と撮影日時を抽出する。
 * GPS 非搭載や EXIF 欠落の場合は null を返す。
 */
export async function extractExifData(imagePath) {
  try {
    const data = await exifr.parse(imagePath, { gps: true, tiff: true });
    if (!data) return null;

    const lat = data.latitude ?? null;
    const lon = data.longitude ?? null;
    const takenAt = data.DateTimeOriginal || data.CreateDate || null;

    if (lat == null || lon == null) {
      return { latitude: null, longitude: null, takenAt };
    }
    return { latitude: lat, longitude: lon, takenAt };
  } catch {
    return null;
  }
}

/**
 * Nominatim (OpenStreetMap) で逆ジオコーディング。
 * 返り値は英語ロケール優先（accept-language=en）で city/suburb/country などを含む。
 */
export async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=en`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' } });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};

    // 都市レベルの英語地名を優先して組み立てる
    const locality = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || addr.town || addr.village || addr.city;
    const region = addr.city || addr.state;
    const country = addr.country;
    const parts = [locality, region, country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

    return {
      displayName: data.display_name || null,
      locationLabel: parts.slice(0, 2).join(', ') || data.display_name || null,
      amenityName: addr.amenity || addr.restaurant || null,
      raw: addr,
    };
  } catch {
    return null;
  }
}

/**
 * Overpass API で GPS 半径 100m 以内のレストラン/食堂を検索。
 * 最も近い施設の name (可能なら name:en) を返す。
 */
export async function findNearbyRestaurant(lat, lon) {
  const radius = 100; // meters
  const query = `
    [out:json][timeout:10];
    (
      node["amenity"~"^(restaurant|fast_food|cafe|food_court)$"](around:${radius},${lat},${lon});
      way["amenity"~"^(restaurant|fast_food|cafe|food_court)$"](around:${radius},${lat},${lon});
    );
    out center tags 20;
  `.trim();

  const url = 'https://overpass-api.de/api/interpreter';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const elements = data.elements || [];
    if (elements.length === 0) return null;

    // ラーメン/ヌードル系を優先
    const scored = elements.map(el => {
      const tags = el.tags || {};
      const cuisine = (tags.cuisine || '').toLowerCase();
      const name = tags['name:en'] || tags.name || null;
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      const dist = elLat != null ? haversine(lat, lon, elLat, elLon) : Infinity;
      const cuisineBoost = /(ramen|noodle|japanese)/.test(cuisine) ? -30 : 0; // 距離から 30m 引いて優先
      return { name, dist: dist + cuisineBoost, cuisine };
    }).filter(x => x.name);

    if (scored.length === 0) return null;
    scored.sort((a, b) => a.dist - b.dist);
    return scored[0].name;
  } catch {
    return null;
  }
}

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
