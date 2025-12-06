import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    WASocket,
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
            printQRInTerminal: true,
            logger: this.logger,
            browser: ['TenantBot', 'Chrome', '1.0.0'],
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
            if (m.type === 'notify' || m.type === 'append') {
                for (const msg of m.messages) {
                    if (!msg.key.fromMe && m.type === 'notify') {
                        console.log('Reply to', msg.key.remoteJid);
                    }
                }
            }
        });
    }
}
