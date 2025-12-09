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
        // Keep track of users we already served to prevent double replying
        const respondedUsers = new Set<string>();

        this.sock.ev.on('messages.upsert', async (m) => {
            if (m.type !== 'notify') return;

            for (const msg of m.messages) {
                if (msg.key.fromMe) continue;

                // JID of the sender
                const jid = msg.key.remoteJid!;

                // Extract text from various message types (including ephemeral/disappearing messages)
                let text =
                    msg.message?.conversation ||
                    msg.message?.extendedTextMessage?.text ||
                    msg.message?.imageMessage?.caption ||
                    msg.message?.videoMessage?.caption ||
                    '';

                // Handle Ephemeral Messages (Disappearing mode)
                if (!text && msg.message?.ephemeralMessage?.message) {
                    const m = msg.message.ephemeralMessage.message;
                    text = m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || '';
                }

                if (!text) continue;

                // Log every incoming message for debugging
                this.logger.info({ jid, text }, '📩 Incoming Message');

                // Locked processing per JID to avoid race conditions
                if (processing.has(jid)) return;

                try {
                    processing.add(jid);

                    // 1. Resolve Command
                    const { CommandResolver } = await import('./services/commandResolver');
                    const command = await CommandResolver.resolve(this.sessionId, text);

                    if (command) {
                        this.logger.info(`✅ Matched command: ${(command.triggers as string[])[0]}`);

                        // 2. Check Persistence / Frequency Rules
                        const { PersistenceLayer } = await import('./services/persistenceLayer');
                        const shouldRespond = await PersistenceLayer.shouldRespond(jid, command.id, command.frequency);

                        if (shouldRespond) {
                            // 3. Mark Interaction
                            await PersistenceLayer.logInteraction(jid, command.id);

                            // 4. Execute Flow
                            const { ResponseHandler } = await import('./services/responseHandler');
                            // We need to cast or fetch command with steps included. 
                            // CommandResolver.resolve already includes steps.
                            // @ts-ignore
                            await ResponseHandler.execute(this.sock!, jid, command);
                        } else {
                            this.logger.info(`⏭️ Skipping response for ${jid} (Frequency: ${command.frequency})`);
                        }
                    }

                } catch (error) {
                    this.logger.error({ err: error }, 'Error in message flow');
                } finally {
                    processing.delete(jid);
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
