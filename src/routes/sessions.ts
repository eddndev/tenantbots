import { FastifyInstance } from 'fastify';
import prisma from '../db';
import { SessionManager } from '../sessionManager';

const manager = new SessionManager();

export async function sessionRoutes(fastify: FastifyInstance) {

    // List all sessions
    fastify.get('/sessions', async () => {
        return await prisma.session.findMany();
    });

    // Create/Start a session
    fastify.post<{ Body: { name: string } }>('/sessions', async (request, reply) => {
        const { name } = request.body;

        // Create DB record if not exists
        let session = await prisma.session.findFirst({ where: { name } });
        if (!session) {
            session = await prisma.session.create({
                data: { name, status: 'DISCONNECTED' }
            });
        }

        // Start the bot
        await manager.startSession(session.id);

        return { status: 'starting', sessionId: session.id };
    });

    // Get QR or Status
    fastify.get<{ Params: { id: string } }>('/sessions/:id', async (request) => {
        const { status, qr } = manager.getSessionStatus(request.params.id);
        return { status, qr };
    });
}
