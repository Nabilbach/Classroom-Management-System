(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/lessons');
    const data = await res.json();
    console.log('Status:', res.status);
    if (Array.isArray(data)) console.log('Lessons count:', data.length);
    else console.log('Response:', data);
  } catch (e) {
    console.error('Fetch failed:', e.message);
  }
})();
