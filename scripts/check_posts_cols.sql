SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' AND table_schema = 'public';
