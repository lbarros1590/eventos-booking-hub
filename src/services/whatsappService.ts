import { WASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import * as Baileys from '@whiskeysockets/baileys';
import * as fs from 'fs';
import * as path from 'path';
import pino from 'pino';
import QRCode from 'qrcode';

let socket: WASocket | null = null;
let isConnecting = false;
const SESSION_DIR = path.join(process.cwd(), 'whatsapp_session');

// Garantir que o diretório de sessão existe
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

/**
 * Inicializa a conexão com WhatsApp
 */
export async function initializeWhatsApp() {
  if (socket?.user) {
    console.log('WhatsApp já está conectado');
    return socket;
  }

  if (isConnecting) {
    console.log('Conexão em progresso...');
    // Aguardar até 10 segundos pela conexão
    for (let i = 0; i < 20; i++) {
      if (socket?.user) return socket;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  isConnecting = true;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    const { default: makeWASocket, fetchLatestBaileysVersion } = Baileys;

    const { version } = await fetchLatestBaileysVersion();

    socket = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'error' }),
    });

    socket.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('\n');
        console.log('╔═════════════════════════════════════════════════════════════╗');
        console.log('║                                                             ║');
        console.log('║              📱 QR CODE GERADO COM SUCESSO 📱                ║');
        console.log('║                                                             ║');
        console.log('║  📂 Procure pelo arquivo: qrcode.png                         ║');
        console.log('║  📸 Escaneie a imagem com seu WhatsApp                       ║');
        console.log('║  ⚙️  Configurações → Aparelhos conectados → Conectar          ║');
        console.log('║                                                             ║');
        console.log('╚═════════════════════════════════════════════════════════════╝\n');

        // Salvar QR code como arquivo PNG
        const qrPath = path.join(process.cwd(), 'qrcode.png');
        QRCode.toFile(
          qrPath,
          qr,
          {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 500,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          },
          (err) => {
            if (err) {
              console.error('❌ Erro ao salvar QR code:', err);
            } else {
              console.log(`✅ QR code salvo em: ${qrPath}`);
              console.log('⏳ Aguardando confirmação da conexão...\n');
            }
          }
        );
      }

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;

        console.log(
          'Conexão fechada due to ',
          lastDisconnect?.error,
          ', reconectando ',
          shouldReconnect
        );

        if (shouldReconnect) {
          socket = null;
          isConnecting = false;
          setTimeout(() => initializeWhatsApp(), 3000);
        }
      } else if (connection === 'open') {
        console.log('\n\n\n');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('✅ WhatsApp conectado com sucesso!');
        console.log('📨 Pronto para enviar mensagens');
        console.log('═══════════════════════════════════════════════════════════════\n\n\n');
        isConnecting = false;
      } else if (connection === 'connecting') {
        console.log('🔄 Conectando ao WhatsApp...');
      }
    });

    socket.ev.on('creds.update', saveCreds);

    return socket;
  } catch (error) {
    console.error('Erro ao conectar WhatsApp:', error);
    isConnecting = false;
    throw error;
  }
}

interface QueuedMessage {
  phoneNumber: string;
  message: string;
  resolve: (value: boolean) => void;
  reject: (reason: any) => void;
  attempts: number;
}

let messageQueue: QueuedMessage[] = [];
let isProcessingQueue = false;
const MAX_ATTEMPTS = 3;

/**
 * Adiciona uma mensagem à fila e inicia o processamento se necessário
 */
export async function sendTextMessage(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    messageQueue.push({
      phoneNumber,
      message,
      resolve,
      reject,
      attempts: 0
    });

    if (!isProcessingQueue) {
      processQueue();
    }
  });
}

/**
 * Processa a fila de mensagens sequencialmente
 */
async function processQueue() {
  if (isProcessingQueue || messageQueue.length === 0) return;

  isProcessingQueue = true;

  while (messageQueue.length > 0) {
    const item = messageQueue[0];

    try {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📤 [WHATSAPP] Processando fila - Destino: ${item.phoneNumber}`);
      console.log(`📊 [WHATSAPP] Mensagens restantes na fila: ${messageQueue.length - 1}`);

      if (!socket?.user) {
        console.log('⚠️  [WHATSAPP] Socket não está conectado, tentando conectar...');
        await initializeWhatsApp();
      }

      if (!socket?.user) {
        throw new Error('WhatsApp não conectado');
      }

      // Esperar um pequeno intervalo entre mensagens para evitar spam/bloqueio
      await new Promise(resolve => setTimeout(resolve, 2000));

      const jid = item.phoneNumber.includes('@s.whatsapp.net')
        ? item.phoneNumber
        : `${item.phoneNumber}@s.whatsapp.net`;

      const result = await socket.sendMessage(jid, { text: item.message });

      console.log(`✅ [WHATSAPP] Mensagem enviada com sucesso!`);
      console.log(`📦 [WHATSAPP] ID: ${result?.key?.id}`);
      console.log(`${'='.repeat(70)}\n`);

      item.resolve(true);
      messageQueue.shift(); // Remove da fila após sucesso
    } catch (error: any) {
      item.attempts++;
      console.error(`❌ [WHATSAPP] Erro ao enviar mensagem (Tentativa ${item.attempts}/${MAX_ATTEMPTS}):`, error.message);

      if (item.attempts >= MAX_ATTEMPTS) {
        console.error(`💀 [WHATSAPP] Máximo de tentativas atingido para ${item.phoneNumber}`);
        item.resolve(false);
        messageQueue.shift();
      } else {
        // Se falhou por conexão, limpa o socket para forçar reconexão na próxima tentativa
        if (error.message.includes('não conectado') || error.message.includes('closed')) {
          socket = null;
        }
        // Espera um pouco mais antes de tentar o mesmo item novamente
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  isProcessingQueue = false;
}

/**
 * Verifica se o socket está conectado
 */
export function isWhatsAppConnected(): boolean {
  return !!socket?.user;
}

/**
 * Desconecta do WhatsApp
 */
export async function disconnectWhatsApp() {
  if (socket) {
    await socket.end(undefined);
    socket = null;
  }
}

