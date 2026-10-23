-- Persisted chat assistant history
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created
  ON public.chat_messages(user_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_select" ON public.chat_messages;
CREATE POLICY "owner_select" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_insert" ON public.chat_messages;
CREATE POLICY "owner_insert" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_delete" ON public.chat_messages;
CREATE POLICY "owner_delete" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);
