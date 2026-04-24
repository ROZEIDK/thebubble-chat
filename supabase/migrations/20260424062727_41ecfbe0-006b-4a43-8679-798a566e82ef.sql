ALTER TABLE public.friendships
  DROP CONSTRAINT IF EXISTS friendships_requester_id_fkey,
  DROP CONSTRAINT IF EXISTS friendships_addressee_id_fkey;

ALTER TABLE public.friendships
  ADD CONSTRAINT friendships_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT friendships_addressee_id_fkey FOREIGN KEY (addressee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'friendships_unique_pair'
  ) THEN
    ALTER TABLE public.friendships ADD CONSTRAINT friendships_unique_pair UNIQUE (requester_id, addressee_id);
  END IF;
END $$;