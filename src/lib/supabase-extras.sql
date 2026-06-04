-- Run this in Supabase SQL Editor AFTER the main schema

-- Increment XP on profile (used by daily task service)
create or replace function increment_xp(p_user_id uuid, p_amount int)
returns void language plpgsql as $$
begin
  update profiles
  set xp_total = greatest(0, xp_total + p_amount)
  where id = p_user_id;
end;
$$;
