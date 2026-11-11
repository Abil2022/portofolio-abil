const crypto = require('crypto');
const hits = new Map();
const sha = (v) => crypto.createHash('sha256').update(String(v)).digest();

// Cek password dari header x-edit-password. Mengembalikan true jika benar.
module.exports = async function guard(req, res) {
  const real = process.env.EDIT_PASSWORD;
  if (!real) {
    res.status(500).json({ error: 'EDIT_PASSWORD belum diatur' });
    return false;
  }
  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
  const now = Date.now();
  let e = hits.get(ip);
  if (!e || now - e.t > 10 * 60 * 1000) e = { n: 0, t: now };
  hits.set(ip, e);
  if (e.n >= 10) {
    res.status(429).json({ error: 'Terlalu banyak percobaan' });
    return false;
  }
  const ok = crypto.timingSafeEqual(sha(req.headers['x-edit-password'] || ''), sha(real));
  if (!ok) {
    e.n++;
    await new Promise((r) => setTimeout(r, 700));
    res.status(401).json({ error: 'Password salah' });
    return false;
  }
  e.n = 0;
  return true;
};
