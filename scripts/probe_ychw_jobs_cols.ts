async function probeColumns() {
    const url = "https://ychwhxkxsxmuvabxlyjn.supabase.co/rest/v1/job_posts?select=*&limit=1";
    const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaHdoeGt4c3htdXZhYnhseWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzc3OTgsImV4cCI6MjA4NzYxMzc5OH0.o3-cCO24KjNrW8NM7HFOycdpxX8D0q4vHeXS0BqFMGc";
    
    console.log("Probing job_posts columns on ychw...");
    try {
        const res = await fetch(url, {
            headers: {
                "apikey": key,
                "Authorization": `Bearer ${key}`
            }
        });
        console.log("Status:", res.status);
        const data = await res.json();
        if (data.length > 0) {
            console.log("Columns:", Object.keys(data[0]));
        } else {
            console.log("No data found to infer columns.");
        }
    } catch (e) {
        console.error("Probe failed:", e.message);
    }
}

probeColumns();
