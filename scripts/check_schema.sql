SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'job_posts', 'services', 'courses', 'posts', 'comments', 'reports');
