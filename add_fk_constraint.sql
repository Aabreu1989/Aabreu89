-- Adicionar Foreign Key Constraint explicitamente entre posts e profiles se necessário
ALTER TABLE public.posts 
DROP CONSTRAINT IF EXISTS posts_author_id_fkey;

ALTER TABLE public.posts 
ADD CONSTRAINT posts_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Adicionar Foreign Key Constraint entre comments e profiles
ALTER TABLE public.comments 
DROP CONSTRAINT IF EXISTS comments_author_id_fkey;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';
