import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import ticketRoutes from './routes/tickets.js';
import { seedAdmin } from './controllers/authController.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Segurança básica e utilitários
app.use(helmet());
app.use(morgan('tiny'));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// CORS
const CORS_ORIGIN = process.env.CORS_ORIGIN || undefined; // se não setado, usa origem do request com credenciais = false
app.use(
  cors({
    origin: CORS_ORIGIN || true,
    credentials: true,
  })
);

// Rate limit para rotas de auth
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/auth', authLimiter);

// Rotas API
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);

// Servir estáticos (frontend)
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Conexão MongoDB
const uri = process.env.MONGODB_URI
  ?.replace('$DB_USER', process.env.DB_USER)
  ?.replace('$DB_PASS', process.env.DB_PASS)
  ?.replace('$DB_HOST', process.env.DB_HOST)
  ?.replace('$DB_NAME', process.env.DB_NAME);

async function start() {
  try {
    await mongoose.connect(uri, { dbName: process.env.DB_NAME || 'chamadosdb' });
    console.log('MongoDB conectado');

    // Criar admin padrão se não existir
    await seedAdmin();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Servidor ouvindo na porta ${PORT}`));
  } catch (err) {
    console.error('Erro ao iniciar servidor:', err);
    process.exit(1);
  }
}

start();
