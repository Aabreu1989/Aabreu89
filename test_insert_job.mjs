import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf8');
const urlMatch = envText.match(/VITE_SUPABASE_URL\s*=\s*(.+)/);
const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.+)/);

const url = urlMatch[1].trim().replace(/['"]/g, '');
const key = keyMatch[1].trim().replace(/['"]/g, '');
const supabase = createClient(url, key);

async function testInsert() {
  const testJob = {
    title: 'Engenheiro de Software / IA (m/f) - Vaga Urgente',
    company: 'Empresa Tecnológica Lisboa',
    location: 'Lisboa',
    source_name: 'MIRA Direct Jobs',
    source_url: 'https://miraimigrante.pt/jobs/' + Date.now(),
    category: 'Trabalho & Carreira',
    work_topic: 'Tecnologia, Dados & IA',
    is_active: true,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('job_posts').insert([testJob]).select();
  console.log('Insert test result:');
  console.log('Error:', error);
  console.log('Inserted Data:', data);
}

testInsert();
