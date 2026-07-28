async function probe() {
    const url = "https://ychwhxkxsxmuvabxlyjn.supabase.co/rest/v1/profiles?select=*&limit=1";
    const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaHdoeGt4c3htdXZhYnhseWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzc3OTgsImV4cCI6MjA4NzYxMzc5OH0.o3-cCO24KjNrW8NM7HFOycdpxX8D0q4vHeXS0BqFMGc";
    
    console.log("Probing ychw profiles columns...");
    try {
        const res = await fetch(url, {
            headers: {
                "apikey": key,
                "Authorization": `Bearer ${key}`
            }
        });
        const data = await res.json();
        if (data.length > 0) {
            console.log("Columns in ychw profiles:", Object.keys(data[0]));
        } else {
            console.log("No data in ychw.");
        }
    } catch (e) {
        console.error("Probe failed:", e.message);
    }
}

probe();
