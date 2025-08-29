import { Router } from 'express';
import { login, logout, me, register } from '../controllers/authController.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/logout', authRequired, logout);
router.get('/me', authRequired, me);

// cadastro de usuário (apenas admin)
router.post('/register', authRequired, requireRole('admin'), register);

export default router;
