import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';

export class WhatsAppService {
    private sock: WASocket | undefined;
    private logger = pino({ level: 'info' });

    constructor(private sessionId: string = 'default') { }

    async connect() {
        const { state, saveCreds } = await useMultiFileAuthState(
            `auth_info_baileys/${this.sessionId}`
        );

        this.sock = makeWASocket({
            auth: state,
            printQRInTerminal: true, // Useful for local dev
            logger: this.logger,
            browser: ['TenantBot', 'Chrome', '1.0.0'],
        });

        this.sock.ev.on('creds.update', saveCreds);

        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                this.logger.info(`QR Code received for session ${this.sessionId}`);
                // In a real app, emit this QR to the frontend via websocket
            }

            if (connection === 'close') {
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
                this.logger.info(`Session ${this.sessionId} opened successfully`);
            }
        });

        this.sock.ev.on('messages.upsert', async (m) => {
            // Basic echo for testing
            if (m.type === 'notify' || m.type === 'append') {
                for (const msg of m.messages) {
                    if (!msg.key.fromMe && m.type === 'notify') {
                        console.log('Reply to', msg.key.remoteJid);
                        // await this.sock?.sendMessage(msg.key.remoteJid!, { text: 'Hello from TenantBot!' });
                    }
                }
            }
        });
    }
}
