const { put, list } = require('@vercel/blob');
const guard = require('./_guard');

const PATH = 'portfolio/data.json';

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ prefix: PATH, limit: 5 });
      const b = blobs.find((x) => x.pathname === PATH);
      if (!b) return res.status(404).json({ error: 'Belum ada data' });
      const r = await fetch(b.url + '?v=' + new Date(b.uploadedAt).getTime());
      const text = await r.text();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(text);
    }

    if (req.method === 'PUT') {
      if (!(await guard(req, res))) return;
      let data = req.body;
      if (typeof data === 'string') data = JSON.parse(data);
      if (!data || !Array.isArray(data.projects)) {
        return res.status(400).json({ error: 'Data tidak valid' });
      }
      await put(PATH, JSON.stringify(data), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 60,
      });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PUT');
    res.status(405).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};
