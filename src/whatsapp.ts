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
                this.logger.info(`QR Code received for session ${this.sessionId}`);
            }

            if (connection === 'close') {
                this.status = 'DISCONNECTED';
                this.qr = undefined;

                const shouldReconnect =
                    (lastDisconnect?.error as Boom)?.output?.statusCode !==
                    DisconnectReason.loggedOut;

                this.logger.error(
                    { err: lastDisconnect?.error, shouldReconnect },
                    'Connection closed'
                );

                if (shouldReconnect) {
                    this.connect();
                }
            } else if (connection === 'open') {
                this.status = 'CONNECTED';
                this.qr = undefined;
                this.logger.info(`Session ${this.sessionId} opened successfully`);
            }
        });

        this.sock.ev.on('messages.upsert', async (m) => {
            if (m.type === 'notify') {
                for (const msg of m.messages) {
                    if (!msg.key.fromMe) {
                        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

                        if (text.toLowerCase().trim() === 'debug') {
                            const jid = msg.key.remoteJid!;

                            // Acknowledge receipt (optional, but good UX)
                            await this.sock!.readMessages([msg.key]);

                            // 1. Initial Delay: 30 seconds
                            // Simulate "thinking" or inactivity, then typing
                            await new Promise(r => setTimeout(r, 25000)); // Wait 25s entirely idle

                            // Start typing for 5 seconds
                            await this.sock?.sendPresenceUpdate('composing', jid);
                            await new Promise(r => setTimeout(r, 5000));

                            // Send First Message
                            await this.sock?.sendMessage(jid, {
                                text: 'Este es un mensaje de prueba de la API 🤖'
                            });
                            // Stop typing (sendMessage auto-stops usually, but explicit is safer)
                            await this.sock?.sendPresenceUpdate('paused', jid);

                            // 2. Second Message Logic
                            // Wait 2 seconds
                            await new Promise(r => setTimeout(r, 2000));
                            // Type for 1 second
                            await this.sock?.sendPresenceUpdate('composing', jid);
                            await new Promise(r => setTimeout(r, 1000));

                            await this.sock?.sendMessage(jid, {
                                text: 'Este es el segundo mensaje en lista tras haber escuchado debug ⏱️'
                            });

                            // 3. Third Message Logic
                            // Wait 2 seconds
                            await new Promise(r => setTimeout(r, 2000));
                            // Type for 1 second
                            await this.sock?.sendPresenceUpdate('composing', jid);
                            await new Promise(r => setTimeout(r, 1000));

                            await this.sock?.sendMessage(jid, {
                                text: 'El código es poesía, y los bugs son solo rimas no deseadas. 📜✨'
                            });
                        }
                    }
                }
            }
        });
    }
}
