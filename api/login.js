const guard = require('./_guard');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  if (!(await guard(req, res))) return;
  res.status(200).json({ ok: true });
};
