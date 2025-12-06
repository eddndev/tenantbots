import Fastify from 'fastify';
import pino from 'pino';
import { WhatsAppService } from './whatsapp';
import { sessionRoutes } from './routes/sessions';

import fastifyStatic from '@fastify/static';
import path from 'path';

// ... imports

const server = Fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    },
});

// Register Routes
server.register(sessionRoutes);

// Root Route
server.get('/', async () => {
    return { status: 'online', message: 'TenantBots API Running 🚀' };
});

const start = async () => {
    try {
        const address = await server.listen({ port: 3000, host: '0.0.0.0' });
        console.log(`Server listening on ${address}`);

        // Initialize default session for testing
        // In prod this would be triggered via API
        // const wa = new WhatsAppService();
        // await wa.connect();
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
