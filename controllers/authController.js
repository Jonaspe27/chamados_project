import jwt from 'jsonwebtoken';
import Joi from 'joi';
import User from '../models/user.js';

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '3d',
  });
}

export async function seedAdmin() {
  const count = await User.countDocuments({ role: 'admin' });
  if (count === 0) {
    const name = process.env.SEED_ADMIN_NAME || 'Admin';
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@local';
    const password = process.env.SEED_ADMIN_PASSWORD || '1234';
    await User.create({ name, email, password, role: 'admin' });
    console.log('Usuário admin criado:', email);
  }
}

export async function register(req, res) {
  try {
    const schema = Joi.object({
      name: Joi.string().min(2).max(80).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(4).required(),
      role: Joi.string().valid('admin', 'agent', 'user').default('user'),
    });
    const data = await schema.validateAsync(req.body);

    // Somente admin pode definir role diferente de user
    if (data.role !== 'user' && req.user?.role !== 'admin') {
      data.role = 'user';
    }

    const exists = await User.findOne({ email: data.email });
    if (exists) return res.status(409).json({ message: 'Email já cadastrado' });

    const user = await User.create(data);
    return res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function login(req, res) {
  try {
    const schema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() });
    const { email, password } = await schema.validateAsync(req.body);

    const user = await User.findOne({ email, active: true });
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Credenciais inválidas' });

    const token = signToken(user);
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 3, // 3 dias
      path: '/',
    };
    res.cookie('token', token, cookieOptions);
    return res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function logout(req, res) {
  res.clearCookie('token', { path: '/' });
  return res.json({ message: 'Logout efetuado' });
}

export async function me(req, res) {
  if (!req.user) return res.status(401).json({ message: 'Não autenticado' });
  const user = await User.findById(req.user.id).select('name email role');
  return res.json(user);
}
