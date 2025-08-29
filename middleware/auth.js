import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export function authRequired(req, res, next) {
  try {
    const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
    if (!token) return res.status(401).json({ message: 'Não autenticado' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Sessão inválida ou expirada' });
  }
}

export function requireRole(...roles) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Não autenticado' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Sem permissão' });
    next();
  };
}

export async function attachUser(req, res, next) {
  // útil para exibir nome no front
  if (!req.user) return next();
  const user = await User.findById(req.user.id).select('name email role');
  req.userDoc = user;
  next();
}
