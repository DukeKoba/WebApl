import { NextRequest, NextResponse } from "next/server";

export interface RssItem {
  title: string;
  url: string;
  excerpt: string;
  pubDate: string;
  source: string;
}

const FEEDS: { name: string; url: string }[] = [
  { name: "Insurance Journal",     url: "https://www.insurancejournal.com/feed/" },
  { name: "Coverager",             url: "https://coverager.com/feed/" },
  { name: "Carrier Management",    url: "https://carriermanagement.com/feed/" },
  { name: "Insurance Business AU", url: "https://www.insurancebusiness.com.au/rss/news" },
  { name: "Insurance Business CA", url: "https://www.insurancebusiness.ca/rss/news" },
  { name: "Insurance Business UK", url: "https://www.insurancebusiness.co.uk/rss/news" },
  { name: "Risk & Insurance",      url: "https://riskandinsurance.com/feed/" },
  { name: "Digital Insurance",     url: "https://www.dig-in.com/rss/articles" },
  { name: "Insurance Business NZ", url: "https://www.insurancebusiness.co.nz/rss/news" },
  { name: "Reinsurance News",      url: "https://www.reinsurancene.ws/feed/" },
  { name: "PropertyCasualty360",   url: "https://www.propertycasualty360.com/feed/" },
  { name: "Claims Journal",        url: "https://www.claimsjournal.com/feed/" },
  { name: "Insurtech Insights",    url: "https://www.insurtechinsights.com/feed/" },
  { name: "The Insurer",           url: "https://www.theinsurer.com/feed/" },
  { name: "AM Best News",          url: "https://news.ambest.com/rss/newsrss.aspx" },
];

function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function getTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  return m ? stripCdata(m[1]).replace(/<[^>]+>/g, "").trim() : "";
}

function getLinkTag(xml: string): string {
  // <link> can be empty-element or have CDATA; atom:link has href attr
  const atomLink = xml.match(/<link[^>]+href="([^"]+)"/i);
  if (atomLink) return atomLink[1];
  const rssLink = xml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  return rssLink ? stripCdata(rssLink[1]).trim() : "";
}

async function fetchFeed(feed: { name: string; url: string }): Promise<RssItem[]> {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": "INSURID-RSS-Reader/1.0" },
    next: { revalidate: 1800 },
  });
  if (!res.ok) return [];
  const xml = await res.text();

  const items: RssItem[] = [];
  const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRe.exec(xml)) !== null && items.length < 10) {
    const block = match[1];
    const title   = getTag(block, "title");
    const url     = getLinkTag(block) || getTag(block, "link");
    const excerpt = getTag(block, "description") || getTag(block, "summary");
    const pubDate = getTag(block, "pubDate") || getTag(block, "published") || "";
    if (title && url) {
      items.push({ title, url, excerpt: excerpt.slice(0, 300), pubDate, source: feed.name });
    }
  }
  return items;
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("source") ?? "all";

  const targets = source === "all"
    ? FEEDS
    : FEEDS.filter((f) => f.name.toLowerCase().includes(source.toLowerCase()));

  const results = await Promise.allSettled(targets.map(fetchFeed));
  const items: RssItem[] = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : []
  );

  // Sort by pubDate (newest first)
  items.sort((a, b) => {
    const ta = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const tb = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return tb - ta;
  });

  return NextResponse.json({ items, feeds: FEEDS.map((f) => f.name) });
}
