import express from 'express';
import crypto from 'crypto';

const router = express.Router();

function getToken() {
  const password = process.env.APP_PASSWORD || 'Optima1234';
  return crypto.createHash('sha256').update(password).digest('hex');
}

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === (process.env.APP_PASSWORD || 'Optima1234')) {
    res.json({ token: getToken() });
  } else {
    res.status(401).json({ error: 'パスワードが違います' });
  }
});

export { getToken };
export default router;
