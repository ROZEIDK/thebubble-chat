-- Track when a user last read DMs from another user
CREATE TABLE public.dm_reads (
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  last_read_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, friend_id)
);

ALTER TABLE public.dm_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own read markers - select"
  ON public.dm_reads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage their own read markers - insert"
  ON public.dm_reads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own read markers - update"
  ON public.dm_reads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own read markers - delete"
  ON public.dm_reads FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);