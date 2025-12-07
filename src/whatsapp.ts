import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    WASocket,
    Browsers,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';

export class WhatsAppService {
    private sock: WASocket | undefined;
    private logger = pino({ level: 'info' });

    public status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'QR' = 'DISCONNECTED';
    public qr: string | undefined;

    constructor(private sessionId: string = 'default') { }

    async connect() {
        this.status = 'CONNECTING';

        const { state, saveCreds } = await useMultiFileAuthState(
            `auth_info_baileys/${this.sessionId}`
        );

        this.sock = makeWASocket({
            auth: state,
            logger: this.logger,
            browser: Browsers.macOS('Desktop'), // More stable signature for v6.7.x
        });

        this.sock.ev.on('creds.update', saveCreds);

        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                this.status = 'QR';
                this.qr = qr;
                // Only log if not already logged recently to avoid noise
                this.logger.info(`QR Code received for session ${this.sessionId}`);
            }

            if (connection === 'close') {
                const shouldReconnect =
                    (lastDisconnect?.error as Boom)?.output?.statusCode !==
                    DisconnectReason.loggedOut;

                // Only change status if we are truly disconnected and not just reconnecting quickly
                if (!shouldReconnect) {
                    this.status = 'DISCONNECTED';
                    this.qr = undefined;
                } else {
                    // We are reconnecting, keep status as CONNECTING or similar if strict, 
                    // but for UI stability, maybe 'CONNECTING' is better so it doesn't flash Red.
                    this.status = 'CONNECTING';
                }

                this.logger.error(
                    { err: lastDisconnect?.error, shouldReconnect },
                    'Connection closed'
                );

                if (shouldReconnect) {
                    // Exponential backoff or simple delay could be added here if needed
                    this.connect();
                }
            } else if (connection === 'open') {
                this.status = 'CONNECTED';
                this.qr = undefined;
                this.logger.info(`Session ${this.sessionId} opened successfully`);
                // Force presence update to ensure online status
                this.sock?.sendPresenceUpdate('available');
            }
        });

        // Message Lock to prevent handling multiple 'debug' triggers simultaneously per JID
        const processing = new Set<string>();

        this.sock.ev.on('messages.upsert', async (m) => {
            if (m.type !== 'notify') return;

            for (const msg of m.messages) {
                if (msg.key.fromMe) continue;

                const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
                const jid = msg.key.remoteJid!;

                // Log every incoming message for debugging
                this.logger.info({ jid, text }, '📩 Incoming Message');

                // Simple mechanism to ignore duplicates or rapid-fire triggers
                if (processing.has(jid)) return;

                // Trigger on 'debug' or words like 'info' to test
                if (text.toLowerCase().trim() === 'debug' || text.toLowerCase().includes('info')) {
                    processing.add(jid);

                    try {
                        await this.sock!.readMessages([msg.key]);

                        // 1. Initial Delay (simulated busy/thinking time)
                        await new Promise(r => setTimeout(r, 1000));

                        // --- Mensaje 1: Info General ---
                        await this.sock?.sendPresenceUpdate('composing', jid);
                        await new Promise(r => setTimeout(r, 3000)); // Escribe largo

                        await this.sock?.sendMessage(jid, {
                            text: `Licencia permanente Auto 🚘🚘\nNosotros realizamos el trámite en linea solo para que usted vaya a tomarse la foto y recoger la licencia permanente al centro semovi autorizado más cercano a usted\n\nSolo se necesita llave CDMX si cuenta con ella, si no la tiene o no sabe que es serían los siguientes datos:\n\n✅Curp\n✅Correo electrónico vigente\n✅Número de celular vigente\n✅Colonia en la que vive\n✅Codigo postal\n✅Una contraseña para ponerle a su cuenta\n\nAl momento de recoger le pedirán INE y comprobante de domicilio`
                        });
                        await this.sock?.sendPresenceUpdate('paused', jid);

                        // --- Retardo entre bloques ---
                        await new Promise(r => setTimeout(r, 2000));

                        // --- Bloque de imagenes ---
                        await this.sock?.sendPresenceUpdate('composing', jid);
                        await new Promise(r => setTimeout(r, 1500));

                        // Imagen 1
                        await this.sock?.sendMessage(jid, {
                            image: { url: 'https://app.angelviajero.com.mx/api/static/images/image1.jpg' },
                            caption: 'Le sacaría la licencia física y digital, si la llega a perder o se la roban, la digital tiene la misma validez , ya no tendría que volver a pagar'
                        });

                        // Imagen 2 (Seguida)
                        await new Promise(r => setTimeout(r, 500));
                        await this.sock?.sendMessage(jid, {
                            image: { url: 'https://app.angelviajero.com.mx/api/static/images/image2.jpg' }
                        });

                        // Imagen 3 (Seguida)
                        await new Promise(r => setTimeout(r, 500));
                        await this.sock?.sendMessage(jid, {
                            image: { url: 'https://app.angelviajero.com.mx/api/static/images/image3.jpg' },
                            caption: 'Le mando EJEMPLO del formato para pagar la licencia al gobierno, es personal sacaría el suyo con su CURP, es un pago seguro es mediante linea de captura al gobierno.'
                        });

                        // --- Mensaje Final: Ubicación ---
                        await new Promise(r => setTimeout(r, 3000));
                        await this.sock?.sendPresenceUpdate('composing', jid);
                        await new Promise(r => setTimeout(r, 3000));

                        await this.sock?.sendMessage(jid, {
                            text: `La entrega es en módulo oficial semovi, usted puede escoger el módulo hay varios, le mando la ubicación del módulo más disponible:\n\n✅Macromódulo de Expedición de Licencias\n\nhttps://share.google/qcZqz98H2TuDoc08D`
                        });

                    } catch (error) {
                        this.logger.error({ err: error }, 'Error in flow');
                    } finally {
                        processing.delete(jid);
                    }
                }
            }
        });
    }

    async disconnect() {
        try {
            await this.sock?.end(new Error('User requested disconnect'));
            this.status = 'DISCONNECTED';
            this.qr = undefined;
        } catch (error) {
            this.logger.error("Error closing socket", error);
        }
    }
}
