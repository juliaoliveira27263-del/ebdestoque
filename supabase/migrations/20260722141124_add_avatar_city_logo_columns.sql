/*
# Add avatar_url, city to profiles and logo_url to industries

1. Modified Tables
- `profiles`: add `avatar_url` (text, nullable) — URL to user avatar image stored in Supabase Storage 'avatars' bucket
- `profiles`: add `city` (text, nullable) — user's city
- `industries`: add `logo_url` (text, nullable) — URL to industry logo image

2. Security
- No RLS policy changes. Existing policies on profiles and industries remain unchanged.
- All new columns are nullable with no defaults, so existing rows are unaffected.

3. Notes
- This migration is idempotent: uses DO $$ ... IF NOT EXISTS ... END $$ to avoid errors on re-run.
- No data is lost or transformed.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'city') THEN
    ALTER TABLE profiles ADD COLUMN city text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'industries' AND column_name = 'logo_url') THEN
    ALTER TABLE industries ADD COLUMN logo_url text;
  END IF;
END $$;
