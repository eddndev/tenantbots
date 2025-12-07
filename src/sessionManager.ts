import { WhatsAppService } from './whatsapp';
import prisma from './db';

export class SessionManager {
    private static sessions: Map<string, WhatsAppService> = new Map();

    static async startSession(sessionId: string) {
        // If session exists, check its status
        if (this.sessions.has(sessionId)) {
            const existing = this.sessions.get(sessionId);
            // If it's already connected or connecting, don't create a new one!
            if (existing?.status === 'CONNECTED' || existing?.status === 'CONNECTING') {
                console.log(`Session ${sessionId} already active, skipping re-init.`);
                return existing;
            }
            // If it's disconnected/QR, maybe we want to restart it, 
            // but for now let's just return the existing instance to avoid duplicates
            // unless the user explicitly requested a restart (which would delete -> start).
            return existing;
        }

        console.log(`Starting new session: ${sessionId}`);
        const service = new WhatsAppService(sessionId);
        this.sessions.set(sessionId, service);

        // Wire up events to update DB status
        await service.connect();

        return service;
    }

    static getSessionStatus(sessionId: string) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return { status: 'DISCONNECTED', qr: undefined };
        }
        return {
            status: session.status,
            qr: session.qr
        };
    }

    // Method to restore all sessions on server restart
    static async restoreSessions() {
        // Ensure we handle basic errors if DB isn't ready
        try {
            const activeSessions = await prisma.session.findMany();
            if (activeSessions.length === 0) {
                console.log("No sessions to restore.");
                return;
            }

            for (const s of activeSessions) {
                console.log(`Restoring session ${s.name} (${s.id})...`);
                // Use default if id is missing or ensure schema matches
                await this.startSession(s.id);
            }
        } catch (e) {
            console.error("Failed to restore sessions:", e);
        }
    }

    static async deleteSession(sessionId: string) {
        const service = this.sessions.get(sessionId);
        if (service) {
            console.log(`Stopping session ${sessionId}...`);
            // Call disconnect to close socket properly
            try {
                // @ts-ignore - We will add this method to WhatsAppService shortly
                await service.disconnect();
            } catch (e) {
                console.error(`Error disconnecting session ${sessionId}`, e);
            }
            this.sessions.delete(sessionId);
        }
    }
}
