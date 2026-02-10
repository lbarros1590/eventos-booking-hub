import express from 'express';
import { sendTextMessage, isWhatsAppConnected, initializeWhatsApp } from '../services/whatsappService';

const router = express.Router();

// Rota para enviar mensagem WhatsApp
router.post('/send-whatsapp', async (req, res) => {
  try {
    console.log('\n🔔 [API] Requisição de envio de mensagem recebida');
    console.log('📦 [API] Body:', req.body);
    
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      console.error('❌ [API] Parâmetros faltando');
      return res.status(400).json({
        success: false,
        error: 'phoneNumber e message são obrigatórios',
      });
    }

    console.log(`📱 [API] Telefone: ${phoneNumber}`);
    console.log(`💬 [API] Mensagem: ${message.substring(0, 50)}...`);

    // Garantir que o WhatsApp está conectado
    if (!isWhatsAppConnected()) {
      console.log('⚠️  [API] WhatsApp não está conectado, inicializando...');
      await initializeWhatsApp();
    }

    console.log('📤 [API] Enviando mensagem...');
    // Enviar a mensagem
    const success = await sendTextMessage(phoneNumber, message);

    if (success) {
      console.log('✅ [API] Mensagem enviada com sucesso');
      return res.status(200).json({
        success: true,
        message: 'Mensagem enviada com sucesso',
      });
    } else {
      console.error('❌ [API] Erro ao enviar mensagem');
      return res.status(500).json({
        success: false,
        error: 'Erro ao enviar mensagem',
      });
    }
  } catch (error: any) {
    console.error('❌ [API] Erro na rota de envio:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor',
    });
  }
});

// Rota para enviar notificação de nova reserva
router.post('/send-whatsapp-notification', async (req, res) => {
  try {
    console.log('\n🔔 [API] Notificação de reserva recebida');
    
    const { clientName, bookingDate, total } = req.body;

    if (!clientName || !bookingDate || total === undefined) {
      console.error('❌ [API] Parâmetros faltando');
      return res.status(400).json({
        success: false,
        error: 'clientName, bookingDate e total são obrigatórios',
      });
    }

    // Número da proprietária
    const phoneNumber = '5565992860607';
    
    // Formatar mensagem
    const message = `Olá! 🎉 Nova reserva solicitada:\n\n*Nome do Cliente:* ${clientName}\n*Data da Reserva:* ${bookingDate}\n*Valor Total:* R$ ${total},00\n\nPor favor, entre em contato para confirmar.`;

    console.log(`📱 [API] Enviando notificação para: ${phoneNumber}`);
    console.log(`💬 [API] Cliente: ${clientName}`);
    console.log(`📅 [API] Data: ${bookingDate}`);
    console.log(`💰 [API] Total: R$ ${total},00`);

    // Garantir que o WhatsApp está conectado
    if (!isWhatsAppConnected()) {
      console.log('⚠️  [API] WhatsApp não está conectado, inicializando...');
      await initializeWhatsApp();
    }

    console.log('📤 [API] Enviando mensagem...');
    // Enviar a mensagem
    const success = await sendTextMessage(phoneNumber, message);

    if (success) {
      console.log('✅ [API] Notificação enviada com sucesso');
      return res.status(200).json({
        success: true,
        message: 'Notificação enviada com sucesso',
      });
    } else {
      console.error('❌ [API] Erro ao enviar notificação');
      return res.status(500).json({
        success: false,
        error: 'Erro ao enviar notificação',
      });
    }
  } catch (error: any) {
    console.error('❌ [API] Erro na rota de notificação:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor',
    });
  }
});

// Rota para verificar status da conexão
router.get('/whatsapp-status', (req, res) => {
  const connected = isWhatsAppConnected();
  res.json({
    connected,
    message: connected ? 'WhatsApp conectado' : 'WhatsApp desconectado',
  });
});

export default router;
