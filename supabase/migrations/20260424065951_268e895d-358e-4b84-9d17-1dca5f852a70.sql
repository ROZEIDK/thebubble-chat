-- 1) Enforce 13+ age check server-side in handle_new_user trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dob date;
  age_years numeric;
begin
  begin
    dob := (new.raw_user_meta_data->>'date_of_birth')::date;
  exception when others then
    raise exception 'A valid date of birth is required';
  end;

  if dob is null then
    raise exception 'A valid date of birth is required';
  end if;

  age_years := extract(year from age(current_date, dob));
  if age_years < 13 then
    raise exception 'You must be at least 13 years old to create an account';
  end if;

  insert into public.profiles (id, username, display_name, date_of_birth)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    dob
  );
  return new;
end;
$$;

-- 2) Restrict friendship UPDATE to addressee only (prevents requester self-accept)
DROP POLICY IF EXISTS "Addressee can accept/update; requester can cancel" ON public.friendships;

CREATE POLICY "Only addressee can accept requests"
  ON public.friendships
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = addressee_id);