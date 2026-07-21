-- ============================================================
-- INSURID Supabase Schema
-- Supabase SQL Editor で実行してください
-- ============================================================

-- ── 1. ins_sources ─────────────────────────────────────────
create table if not exists public.ins_sources (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  url         text not null unique,
  kind        text not null check (kind in ('rss', 'api', 'scrape', 'manual')),
  region      text not null check (region in ('us', 'uk', 'eu', 'asia', 'jp', 'global')),
  language    text not null default 'en' check (language in ('en', 'ja', 'zh')),
  trust_score numeric(4,2) not null default 80,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── 2. ins_candidates ──────────────────────────────────────
create table if not exists public.ins_candidates (
  id               uuid primary key default gen_random_uuid(),
  source_id        uuid references public.ins_sources(id) on delete set null,
  url              text not null,
  title_original   text,
  excerpt_original text,
  fetched_at       timestamptz not null default now(),
  importance_score numeric(5,2),
  state            text not null default 'new'
                     check (state in ('new', 'drafted', 'rejected', 'published')),
  draft_id         uuid
);

create index if not exists ins_candidates_state_idx on public.ins_candidates(state);
create index if not exists ins_candidates_fetched_idx on public.ins_candidates(fetched_at desc);

-- ── 3. ins_drafts ──────────────────────────────────────────
create table if not exists public.ins_drafts (
  id                 uuid primary key default gen_random_uuid(),
  candidate_id       uuid references public.ins_candidates(id) on delete cascade,
  title_jp           text not null,
  summary_jp         text not null,
  body_jp            text not null,
  category           text not null
                       check (category in ('broker','insurer','domestic','niche','regulation','webinar','howto')),
  region             text not null
                       check (region in ('us','uk','eu','asia','jp','global')),
  tags               text[] not null default '{}',
  related_player_ids uuid[] not null default '{}',
  ai_model           text not null default 'gemini-2.0-flash',
  generated_at       timestamptz not null default now(),
  state              text not null default 'pending'
                       check (state in ('pending','edited','approved','rejected'))
);

create index if not exists ins_drafts_state_idx on public.ins_drafts(state);
create index if not exists ins_drafts_generated_idx on public.ins_drafts(generated_at desc);

-- ── 4. ins_articles ────────────────────────────────────────
create table if not exists public.ins_articles (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  lead_excerpt text not null,
  body_md      text not null,
  category     text not null
                 check (category in ('broker','insurer','domestic','niche','regulation','webinar','howto')),
  region       text not null
                 check (region in ('us','uk','eu','asia','jp','global')),
  tags         text[] not null default '{}',
  player_ids   uuid[] not null default '{}',
  ai_draft_id  uuid references public.ins_drafts(id) on delete set null,
  editor_id    uuid,
  source_links jsonb not null default '[]',
  paywall      text not null default 'none'
                 check (paywall in ('none','premium','enterprise')),
  published_at timestamptz,
  updated_at   timestamptz,
  status       text not null default 'published'
                 check (status in ('scheduled','published','corrected','archived')),
  view_count   integer not null default 0
);

-- image_url: 元記事のOG画像URL（既存テーブルへの追加は ALTER TABLE で）
-- alter table public.ins_articles add column if not exists image_url text;

create index if not exists ins_articles_status_idx    on public.ins_articles(status);
create index if not exists ins_articles_published_idx on public.ins_articles(published_at desc);
create index if not exists ins_articles_category_idx  on public.ins_articles(category);
create index if not exists ins_articles_slug_idx      on public.ins_articles(slug);

-- ── 5. Row Level Security ──────────────────────────────────
-- ins_articles: 公開記事は誰でも閲覧可
alter table public.ins_articles enable row level security;
create policy "Public articles are viewable by everyone"
  on public.ins_articles for select
  using (status = 'published' and published_at <= now());

-- ins_drafts/candidates/sources: サービスロールキーのみ（管理API経由）
alter table public.ins_drafts    enable row level security;
alter table public.ins_candidates enable row level security;
alter table public.ins_sources    enable row level security;

-- サービスロールキーはRLSをバイパスするので管理APIは引き続き動作します

-- ── 6. 閲覧数カウント関数 ──────────────────────────────────
create or replace function public.increment_view_count(article_slug text)
returns void language sql security definer as $$
  update public.ins_articles
  set view_count = view_count + 1
  where slug = article_slug and status = 'published';
$$;
