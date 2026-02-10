import express from 'express';
import cors from 'cors';
import whatsappRoutes from './api/whatsappRoutes';
import { initializeWhatsApp } from './services/whatsappService';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api', whatsappRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Inicializar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  
  // Inicializar WhatsApp na inicialização do servidor
  try {
    console.log('📱 Inicializando WhatsApp...');
    await initializeWhatsApp();
  } catch (error) {
    console.error('Erro ao inicializar WhatsApp:', error);
  }
});
