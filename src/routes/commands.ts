import { FastifyInstance } from 'fastify';
import prisma from '../db';

export async function commandRoutes(fastify: FastifyInstance) {

    // List Commands for a Session
    fastify.get('/sessions/:sessionId/commands', async (request, reply) => {
        const { sessionId } = request.params as { sessionId: string };
        const commands = await prisma.command.findMany({
            where: { sessionId },
            include: { steps: { orderBy: { order: 'asc' } } }
        });
        return commands;
    });

    // Get Single Command
    fastify.get('/commands/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const command = await prisma.command.findUnique({
            where: { id },
            include: { steps: { orderBy: { order: 'asc' } } }
        });
        if (!command) return reply.code(404).send({ error: 'Command not found' });
        return command;
    });

    // Create Command
    fastify.post('/sessions/:sessionId/commands', async (request, reply) => {
        const { sessionId } = request.params as { sessionId: string };
        const { trigger, matchType, frequency, isEnabled, steps } = request.body as any;

        try {
            const command = await prisma.command.create({
                data: {
                    sessionId,
                    trigger,
                    matchType,
                    frequency,
                    isEnabled,
                    steps: {
                        create: steps?.map((step: any, index: number) => ({
                            order: index + 1,
                            type: step.type,
                            content: step.content,
                            options: step.options
                        }))
                    }
                },
                include: { steps: true }
            });
            return command;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to create command' });
        }
    });

    // Update Command
    fastify.put('/commands/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { trigger, matchType, frequency, isEnabled, steps } = request.body as any;

        try {
            // Transaction: Update command fields + Replace steps
            const result = await prisma.$transaction(async (tx) => {
                // 1. Update basic fields
                const cmd = await tx.command.update({
                    where: { id },
                    data: { trigger, matchType, frequency, isEnabled }
                });

                // 2. Delete old steps (if steps provided)
                if (steps) {
                    await tx.flowStep.deleteMany({ where: { commandId: id } });

                    // 3. Create new steps
                    for (let i = 0; i < steps.length; i++) {
                        const step = steps[i];
                        await tx.flowStep.create({
                            data: {
                                commandId: id,
                                type: step.type,
                                content: step.content,
                                options: step.options,
                                order: i + 1
                            }
                        });
                    }
                }

                return tx.command.findUnique({
                    where: { id },
                    include: { steps: { orderBy: { order: 'asc' } } }
                });
            });

            return result;
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to update command' });
        }
    });

    // Delete Command
    fastify.delete('/commands/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        await prisma.command.delete({ where: { id } });
        return { success: true };
    });
}
