import { WhatsAppService } from './whatsapp';
import prisma from './db';

export class SessionManager {
    private static sessions: Map<string, WhatsAppService> = new Map();

    static async startSession(sessionId: string) {
        if (this.sessions.has(sessionId)) {
            return this.sessions.get(sessionId);
        }

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
            for (const s of activeSessions) {
                console.log(`Restoring session ${s.name}...`);
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
            // Ideally call service.disconnect() or similar if implemented
            this.sessions.delete(sessionId);
        }
    }
}
