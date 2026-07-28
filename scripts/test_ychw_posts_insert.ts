async function testInsert() {
    const url = "https://ychwhxkxsxmuvabxlyjn.supabase.co/rest/v1/posts";
    const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaHdoeGt4c3htdXZhYnhseWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzc3OTgsImV4cCI6MjA4NzYxMzc5OH0.o3-cCO24KjNrW8NM7HFOycdpxX8D0q4vHeXS0BqFMGc";
    
    console.log("Testing insert on ychw/posts with ANON key...");
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "apikey": key,
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            },
            body: JSON.stringify({
                title: "Test Post",
                content: "Test content",
                category: "AIMA"
            })
        });
        console.log("Status:", res.status, res.statusText);
        const text = await res.text();
        console.log("Body:", text);
    } catch (e) {
        console.error("Fetch failed:", e.message);
    }
}

testInsert();
