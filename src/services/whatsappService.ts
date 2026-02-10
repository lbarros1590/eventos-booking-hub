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

/**
 * Envia uma mensagem de texto para um contato
 */
export async function sendTextMessage(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📤 [WHATSAPP] Tentando enviar mensagem para: ${phoneNumber}`);
    console.log(`${'='.repeat(70)}`);
    
    console.log(`🔍 [DEBUG] Socket conectado: ${!!socket?.user}`);
    console.log(`🔍 [DEBUG] Socket user ID: ${socket?.user?.id || 'N/A'}`);
    
    if (!socket?.user) {
      console.log('⚠️  [WHATSAPP] Socket não está conectado, tentando conectar...');
      await initializeWhatsApp();
    }

    if (!socket?.user) {
      console.error('❌ [WHATSAPP] WhatsApp não conectado após inicialização');
      throw new Error('WhatsApp não conectado');
    }

    // Formatar número para o padrão do WhatsApp (adicionar @s.whatsapp.net)
    const jid = phoneNumber.includes('@s.whatsapp.net')
      ? phoneNumber
      : `${phoneNumber}@s.whatsapp.net`;

    console.log(`📝 [WHATSAPP] JID destino: ${jid}`);
    console.log(`💬 [WHATSAPP] Mensagem: ${message.substring(0, 100)}...`);
    console.log(`📊 [WHATSAPP] Comprimento da mensagem: ${message.length} caracteres`);
    
    const result = await socket.sendMessage(jid, { text: message });
    
    console.log(`✅ [WHATSAPP] Mensagem enviada com sucesso!`);
    console.log(`📦 [WHATSAPP] ID da mensagem: ${result?.key?.id || 'desconhecido'}`);
    console.log(`${'='.repeat(70)}\n`);
    return true;
  } catch (error: any) {
    console.error(`${'='.repeat(70)}`);
    console.error(`❌ [WHATSAPP] ERRO ao enviar mensagem!`);
    console.error(`❌ [WHATSAPP] Código de erro: ${error?.code || 'desconhecido'}`);
    console.error(`❌ [WHATSAPP] Mensagem de erro: ${error?.message || error}`);
    console.error(`❌ [WHATSAPP] Stack: ${error?.stack || 'N/A'}`);
    console.error(`${'='.repeat(70)}\n`);
    return false;
  }
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
    await socket.end();
    socket = null;
  }
}
