-- ============================================================
-- RatingBee Database Schema
-- Paste this into Supabase SQL Editor and run it
-- ============================================================

-- USER PROFILES
-- Extends Supabase auth.users with extra fields
create table if not exists public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'business_owner', 'admin')),
  created_at timestamptz default now()
);

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- CLAIMED LISTINGS
create table if not exists public.claimed_listings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  place_id text not null,
  business_name text not null,
  business_phone text not null,
  business_email text not null,
  owner_name text not null,
  owner_role text not null default 'owner',
  verified boolean default false,
  verification_code text,
  verification_expires timestamptz,
  plan text not null default 'free' check (plan in ('free', 'pro', 'reviewamp')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  unique(place_id) -- one claim per business
);

-- RATINGBEE NATIVE REVIEWS
create table if not exists public.rb_reviews (
  id uuid default gen_random_uuid() primary key,
  place_id text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  text text not null check (length(text) >= 20),
  helpful_count integer default 0,
  not_helpful_count integer default 0,
  flag_count integer default 0,
  flagged boolean default false,
  created_at timestamptz default now()
);

-- REVIEW VOTES (helpful/not helpful/flag)
create table if not exists public.review_votes (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references public.rb_reviews(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  vote_type text not null check (vote_type in ('up', 'down', 'flag')),
  created_at timestamptz default now(),
  unique(review_id, user_id) -- one vote per user per review
);

-- GOOGLE REVIEW VOTES (for imported Google reviews)
create table if not exists public.google_review_votes (
  id uuid default gen_random_uuid() primary key,
  place_id text not null,
  review_key text not null, -- author_name + date as unique key
  user_id uuid references auth.users(id) on delete cascade not null,
  vote_type text not null check (vote_type in ('up', 'down', 'flag')),
  created_at timestamptz default now(),
  unique(review_key, user_id)
);

-- REVIEW REPLIES
create table if not exists public.review_replies (
  id uuid default gen_random_uuid() primary key,
  place_id text not null,
  review_key text not null, -- works for both native and Google reviews
  user_id uuid references auth.users(id) on delete cascade not null,
  author_name text not null,
  text text not null check (length(text) >= 1),
  is_owner_reply boolean default false,
  created_at timestamptz default now()
);

-- STRIPE EVENTS LOG
create table if not exists public.stripe_events (
  id uuid default gen_random_uuid() primary key,
  stripe_event_id text unique not null,
  event_type text not null,
  payload jsonb not null,
  processed boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.user_profiles enable row level security;
alter table public.claimed_listings enable row level security;
alter table public.rb_reviews enable row level security;
alter table public.review_votes enable row level security;
alter table public.google_review_votes enable row level security;
alter table public.review_replies enable row level security;

-- User profiles: users can read all, only edit their own
create policy "Profiles are public" on public.user_profiles for select using (true);
create policy "Users can update own profile" on public.user_profiles for update using (auth.uid() = id);

-- Claimed listings: public can read verified, owners manage their own
create policy "Verified listings are public" on public.claimed_listings for select using (verified = true);
create policy "Owners can see own listings" on public.claimed_listings for select using (auth.uid() = user_id);
create policy "Owners can update own listings" on public.claimed_listings for update using (auth.uid() = user_id);
create policy "Authenticated users can claim" on public.claimed_listings for insert with check (auth.uid() = user_id);

-- Reviews: anyone can read, authenticated users can create
create policy "Reviews are public" on public.rb_reviews for select using (flagged = false);
create policy "Authenticated users can review" on public.rb_reviews for insert with check (auth.uid() = user_id);
create policy "Users can delete own reviews" on public.rb_reviews for delete using (auth.uid() = user_id);

-- Votes: authenticated users only
create policy "Votes are public" on public.review_votes for select using (true);
create policy "Authenticated users can vote" on public.review_votes for insert with check (auth.uid() = user_id);
create policy "Users can change own vote" on public.review_votes for update using (auth.uid() = user_id);
create policy "Users can remove own vote" on public.review_votes for delete using (auth.uid() = user_id);

create policy "Google votes are public" on public.google_review_votes for select using (true);
create policy "Authenticated users can vote google" on public.google_review_votes for insert with check (auth.uid() = user_id);
create policy "Users can change own google vote" on public.google_review_votes for update using (auth.uid() = user_id);

-- Replies: anyone can read, authenticated users can post
create policy "Replies are public" on public.review_replies for select using (true);
create policy "Authenticated users can reply" on public.review_replies for insert with check (auth.uid() = user_id);
create policy "Users can delete own replies" on public.review_replies for delete using (auth.uid() = user_id);

-- ============================================================
-- HELPFUL FUNCTIONS
-- ============================================================

-- Auto-update helpful counts when votes change
create or replace function update_review_vote_counts()
returns trigger as $$
begin
  update public.rb_reviews set
    helpful_count = (select count(*) from public.review_votes where review_id = coalesce(NEW.review_id, OLD.review_id) and vote_type = 'up'),
    not_helpful_count = (select count(*) from public.review_votes where review_id = coalesce(NEW.review_id, OLD.review_id) and vote_type = 'down'),
    flag_count = (select count(*) from public.review_votes where review_id = coalesce(NEW.review_id, OLD.review_id) and vote_type = 'flag'),
    flagged = (select count(*) from public.review_votes where review_id = coalesce(NEW.review_id, OLD.review_id) and vote_type = 'flag') >= 3
  where id = coalesce(NEW.review_id, OLD.review_id);
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger on_vote_change
  after insert or update or delete on public.review_votes
  for each row execute procedure update_review_vote_counts();
