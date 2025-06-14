const path = './src/data/cah-compact.json';

try {
  const raw = fs.readFileSync(path, 'utf-8');
  console.log('Raw data length:', raw.length);
  const json = JSON.parse(raw);
  console.log('Loaded JSON keys:', Object.keys(json));
} catch (e) {
  console.error('Failed to load JSON:', e.message);
}