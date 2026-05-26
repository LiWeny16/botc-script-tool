-- BotC Image Gen — API Key table
-- No auth framework. Just one table.

CREATE TABLE IF NOT EXISTS public.api_keys (
  key       TEXT PRIMARY KEY,
  total     INTEGER NOT NULL DEFAULT 500,
  used      INTEGER NOT NULL DEFAULT 0,
  email     TEXT,
  plan      TEXT DEFAULT 'standard',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Atomic increment: only succeeds if quota remains
-- Returns the updated row, or empty if quota exceeded
CREATE OR REPLACE FUNCTION public.consume_quota(p_key TEXT)
RETURNS TABLE(ok BOOLEAN, remaining BIGINT) AS $$
DECLARE
  r api_keys%ROWTYPE;
BEGIN
  UPDATE api_keys
  SET used = used + 1
  WHERE key = p_key AND used < total
  RETURNING * INTO r;

  IF FOUND THEN
    ok := true;
    remaining := r.total - r.used;
  ELSE
    ok := false;
    remaining := 0;
  END IF;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: only service_role can read/write
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
-- No SELECT policy for anon users = no data leaks
