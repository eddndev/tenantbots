import { WhatsAppService } from './whatsapp';
import prisma from './db';

export class SessionManager {
    private sessions: Map<string, WhatsAppService> = new Map();

    async startSession(sessionId: string) {
        if (this.sessions.has(sessionId)) {
            return this.sessions.get(sessionId);
        }

        const service = new WhatsAppService(sessionId);
        this.sessions.set(sessionId, service);

        // Wire up events to update DB status
        // Note: We need to modify WhatsAppService to expose events or callbacks
        await service.connect();

        return service;
    }

    getSessionStatus(sessionId: string) {
        // Return status from memory or DB
        return this.sessions.get(sessionId) ? 'ACTIVE' : 'INACTIVE';
    }

    // Method to restore all sessions on server restart
    async restoreSessions() {
        const activeSessions = await prisma.session.findMany();
        for (const s of activeSessions) {
            console.log(`Restoring session ${s.name}...`);
            this.startSession(s.id);
        }
    }
}
