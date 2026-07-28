async function probe() {
    const url = "https://ychwhxkxsxmuvabxlyjn.supabase.co/rest/v1/profiles?select=count";
    const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubHp5c2hvenBxbHp1eWplc2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY4NDIwMSwiZXhwIjoyMDkyMjYwMjAxfQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0";
    
    console.log("Probing YCHW with the key provided by the user (which says pnlz)...");
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
