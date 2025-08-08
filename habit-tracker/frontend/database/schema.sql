-- Enable Row Level Security
alter table auth.users enable row level security;

-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text,
  avatar_url text,
  public_url text unique,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create habit_categories table
create table if not exists public.habit_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  color text not null default '#3B82F6',
  icon text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create habits table
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  category_id uuid references public.habit_categories(id) on delete cascade,
  name text not null,
  description text,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  is_non_negotiable boolean default false,
  target_frequency integer not null default 1,
  frequency_unit text check (frequency_unit in ('daily', 'weekly', 'monthly')) default 'daily',
  is_public boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create habit_logs table
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references public.habits(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  completed_at timestamp with time zone default now(),
  notes text,
  created_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists profiles_username_idx on public.profiles(username);
create index if not exists profiles_public_url_idx on public.profiles(public_url);
create index if not exists habit_categories_user_id_idx on public.habit_categories(user_id);
create index if not exists habits_user_id_idx on public.habits(user_id);
create index if not exists habits_category_id_idx on public.habits(category_id);
create index if not exists habit_logs_habit_id_idx on public.habit_logs(habit_id);
create index if not exists habit_logs_user_id_idx on public.habit_logs(user_id);
create index if not exists habit_logs_completed_at_idx on public.habit_logs(completed_at);

-- Row Level Security policies

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = user_id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = user_id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = user_id);

create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (public_url is not null);

-- Habit categories policies
create policy "Users can view own categories" on public.habit_categories
  for select using (auth.uid() = user_id);

create policy "Users can create own categories" on public.habit_categories
  for insert with check (auth.uid() = user_id);

create policy "Users can update own categories" on public.habit_categories
  for update using (auth.uid() = user_id);

create policy "Users can delete own categories" on public.habit_categories
  for delete using (auth.uid() = user_id);

-- Habits policies
create policy "Users can view own habits" on public.habits
  for select using (auth.uid() = user_id);

create policy "Users can create own habits" on public.habits
  for insert with check (auth.uid() = user_id);

create policy "Users can update own habits" on public.habits
  for update using (auth.uid() = user_id);

create policy "Users can delete own habits" on public.habits
  for delete using (auth.uid() = user_id);

create policy "Public habits are viewable by everyone" on public.habits
  for select using (is_public = true);

-- Habit logs policies
create policy "Users can view own habit logs" on public.habit_logs
  for select using (auth.uid() = user_id);

create policy "Users can create own habit logs" on public.habit_logs
  for insert with check (auth.uid() = user_id);

create policy "Users can update own habit logs" on public.habit_logs
  for update using (auth.uid() = user_id);

create policy "Users can delete own habit logs" on public.habit_logs
  for delete using (auth.uid() = user_id);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.habit_categories enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

-- Function to update updated_at column
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers to update updated_at column
create trigger handle_updated_at_profiles
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at_habit_categories
  before update on public.habit_categories
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at_habits
  before update on public.habits
  for each row execute function public.handle_updated_at();
