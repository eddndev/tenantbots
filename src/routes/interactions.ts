import { FastifyInstance } from 'fastify';
import prisma from '../db';

export async function interactionRoutes(fastify: FastifyInstance) {

    // Get Stats for a Session (Top commands, Total users)
    fastify.get('/sessions/:sessionId/stats', async (request, reply) => {
        const { sessionId } = request.params as { sessionId: string };

        // 1. Total Interactions
        // We need to join with Command to filter by SessionId
        const commands = await prisma.command.findMany({
            where: { sessionId },
            select: { id: true }
        });
        const commandIds = commands.map(c => c.id);

        const totalInteractions = await prisma.userInteraction.count({
            where: { commandId: { in: commandIds } }
        });

        // 2. Unique Users
        const uniqueUsers = await prisma.userInteraction.groupBy({
            by: ['userJid'],
            where: { commandId: { in: commandIds } }
        });

        // 3. Interactions per Command
        const interactionsPerCommand = await prisma.userInteraction.groupBy({
            by: ['commandId'],
            where: { commandId: { in: commandIds } },
            _count: {
                _all: true
            }
        });

        // Map back to command names
        const stats = await Promise.all(interactionsPerCommand.map(async (item) => {
            const cmd = await prisma.command.findUnique({ where: { id: item.commandId } });
            return {
                command: cmd?.trigger || 'Unknown',
                count: item._count._all
            };
        }));

        return {
            totalInteractions,
            uniqueUsers: uniqueUsers.length,
            breakdown: stats
        };
    });

    // Get List of Interactions (Logs)
    fastify.get('/sessions/:sessionId/interactions', async (request, reply) => {
        const { sessionId } = request.params as { sessionId: string };
        const { limit = 50, offset = 0 } = request.query as any;

        const commands = await prisma.command.findMany({
            where: { sessionId },
            select: { id: true }
        });
        const commandIds = commands.map(c => c.id);

        const logs = await prisma.userInteraction.findMany({
            where: { commandId: { in: commandIds } },
            take: Number(limit),
            skip: Number(offset),
            orderBy: { createdAt: 'desc' },
            include: { command: true }
        });

        return logs.map(log => ({
            id: log.id,
            userJid: log.userJid,
            command: log.command.trigger,
            createdAt: log.createdAt
        }));
    });
}
