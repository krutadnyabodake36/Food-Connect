-- ============================================
-- Food Connect — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('hotel', 'volunteer')),
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  -- Hotel fields
  hotel_name TEXT,
  manager_number TEXT,
  license_number TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  -- Volunteer fields
  age INTEGER,
  vehicle TEXT,
  ngo_name TEXT,
  ngo_number TEXT,
  contact_person TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Donations table
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'completed')),
  pickup_window TEXT,
  image_url TEXT,
  is_urgent BOOLEAN DEFAULT false,
  pickup_code TEXT,
  -- Assigned volunteer
  volunteer_id UUID REFERENCES public.profiles(id),
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Pickup requests table
CREATE TABLE IF NOT EXISTS public.pickup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID REFERENCES public.donations(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_requests ENABLE ROW LEVEL SECURITY;

-- Profiles: read by anyone, insert/update by anyone (simplified for demo)
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (true);

-- Donations: read by anyone, insert/update by anyone
CREATE POLICY "donations_select" ON public.donations FOR SELECT USING (true);
CREATE POLICY "donations_insert" ON public.donations FOR INSERT WITH CHECK (true);
CREATE POLICY "donations_update" ON public.donations FOR UPDATE USING (true);
CREATE POLICY "donations_delete" ON public.donations FOR DELETE USING (true);

-- Pickup requests: read by anyone, insert/update by anyone
CREATE POLICY "requests_select" ON public.pickup_requests FOR SELECT USING (true);
CREATE POLICY "requests_insert" ON public.pickup_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "requests_update" ON public.pickup_requests FOR UPDATE USING (true);

-- ============================================
-- Enable Realtime
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pickup_requests;

-- Default data removed, using live Supabase Auth now.

-- ============================================
-- Authentication Trigger (Sync auth.users to public.profiles)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, name, role, phone, hotel_name, address, manager_number, license_number, age, vehicle
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'Unknown User'),
    COALESCE(new.raw_user_meta_data->>'role', 'volunteer'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'hotelName',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'managerNumber',
    new.raw_user_meta_data->>'licenseNumber',
    NULLIF(new.raw_user_meta_data->>'age', '')::integer,
    new.raw_user_meta_data->>'vehicle'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
