const crypto = require('crypto');
const { put } = require('@vercel/blob');
const guard = require('./_guard');

function readBody(req) {
  return new Promise((ok, no) => {
    const c = [];
    req.on('data', (d) => c.push(d));
    req.on('end', () => ok(Buffer.concat(c)));
    req.on('error', no);
  });
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).end();
    if (!(await guard(req, res))) return;
    const buf = Buffer.isBuffer(req.body) ? req.body : await readBody(req);
    if (!buf || !buf.length || buf.length > 4 * 1024 * 1024) {
      return res.status(400).json({ error: 'Ukuran file tidak valid' });
    }
    if (buf[0] !== 0xff || buf[1] !== 0xd8) {
      return res.status(400).json({ error: 'Harus JPEG' });
    }
    const name = 'portfolio/img-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex') + '.jpg';
    const b = await put(name, buf, {
      access: 'public',
      contentType: 'image/jpeg',
      addRandomSuffix: false,
      cacheControlMaxAge: 31536000,
    });
    res.status(200).json({ url: b.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};
