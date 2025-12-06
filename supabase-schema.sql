-- Enable extensions
create extension if not exists "uuid-ossp";

-- Profiles table extends auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  is_group boolean not null default false,
  title text,
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text default 'member'
);

create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  type text default 'text',
  created_at timestamptz not null default now()
);

create table public.stories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  media_url text,
  caption text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.channels (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.channel_messages (
  id uuid primary key default uuid_generate_v4(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.stories enable row level security;
alter table public.channels enable row level security;
alter table public.channel_messages enable row level security;

-- Profiles: users manage their own row
create policy "Profiles are readable to owners" on public.profiles
  for select using (auth.uid() = id);
create policy "Profiles owners can update" on public.profiles
  for update using (auth.uid() = id);
create policy "Profiles owners can insert" on public.profiles
  for insert with check (auth.uid() = id);

-- Conversations: visible if member
create policy "Conversations read for members" on public.conversations
  for select using (exists (
    select 1 from public.conversation_members m
    where m.conversation_id = conversations.id and m.user_id = auth.uid()
  ));

-- Conversation members: only see your memberships
create policy "Conversation members read own" on public.conversation_members
  for select using (user_id = auth.uid());
create policy "Conversation members insert self" on public.conversation_members
  for insert with check (user_id = auth.uid());

-- Messages: only see messages in conversations you belong to
create policy "Messages readable in member conversations" on public.messages
  for select using (exists (
    select 1 from public.conversation_members m
    where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()
  ));
create policy "Messages insert for members" on public.messages
  for insert with check (exists (
    select 1 from public.conversation_members m
    where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()
  ));

-- Stories: public read, owners write
create policy "Stories readable by anyone" on public.stories
  for select using (true);
create policy "Stories insert/update by owner" on public.stories
  for insert with check (auth.uid() = user_id);
create policy "Stories update by owner" on public.stories
  for update using (auth.uid() = user_id);

-- Channels: visible to members (v1 everyone is member)
create policy "Channels readable by all" on public.channels
  for select using (true);
create policy "Channels insert by authenticated" on public.channels
  for insert with check (auth.uid() is not null);

-- Channel messages: readable by all, write by authenticated
create policy "Channel messages readable by all" on public.channel_messages
  for select using (true);
create policy "Channel messages insert by authenticated" on public.channel_messages
  for insert with check (auth.uid() is not null);
