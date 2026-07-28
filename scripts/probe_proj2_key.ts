async function probe() {
    const url = "https://ychwhxkxsxmuvabxlyjn.supabase.co/rest/v1/profiles?select=count";
    const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaHdoeGt4c3htdXZhYnhseWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAzNzc5OCwiZXhwIjoyMDg3NjEzNzk4fQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0";
    
    console.log("Probing ychw with PROJ2 key from compare_projects.ts...");
    try {
        const res = await fetch(url, {
            headers: {
                "apikey": key,
                "Authorization": `Bearer ${key}`
            }
        });
        console.log("Status:", res.status, res.statusText);
        const text = await res.text();
        console.log("Body:", text);
    } catch (e) {
        console.error("Fetch failed:", e.message);
    }
}

probe();
