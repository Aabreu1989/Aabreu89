import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
console.log('SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '[PRESENT]' : '[MISSING]');
