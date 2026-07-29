import os, re, urllib.request, json

with open('.env', 'r', encoding='utf-8') as f:
    text = f.read()

url_match = re.search(r'VITE_SUPABASE_URL\s*=\s*(.+)', text)
key_match = re.search(r'VITE_SUPABASE_ANON_KEY\s*=\s*(.+)', text)

if url_match and key_match:
    url = url_match.group(1).strip().strip('"\'')
    key = key_match.group(1).strip().strip('"\'')
    
    req_url = f"{url}/rest/v1/job_posts?select=id,title,date_posted,created_at&limit=10"
    req = urllib.request.Request(req_url, headers={
        'apikey': key,
        'Authorization': f'Bearer {key}'
    })
    
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print('Latest 10 jobs in Supabase:')
            for j in data:
                print(j)
    except Exception as e:
        print('Error:', e)
