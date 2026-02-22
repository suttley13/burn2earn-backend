-- Run this in your Supabase SQL editor to create the food_logs table

create table if not exists food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  image_url text,
  food_name text not null,
  calories integer not null,
  protein_g numeric(6, 2),
  carbs_g numeric(6, 2),
  fat_g numeric(6, 2),
  confidence text check (confidence in ('high', 'medium', 'low')),
  notes text,
  logged_at timestamptz not null default now()
);

create index if not exists food_logs_user_date_idx on food_logs (user_id, logged_at);
