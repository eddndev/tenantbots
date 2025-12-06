import Fastify from 'fastify';
import pino from 'pino';
import cors from '@fastify/cors';
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

// Enable CORS
server.register(cors, {
    origin: '*', // Allow all origins (including localhost:4321)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

// Security Middleware
server.addHook('onRequest', async (request, reply) => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return; // Open if no key configured (dev mode)

    const providedKey = request.headers['x-api-key'];
    if (providedKey !== apiKey) {
        reply.code(401).send({ error: 'Unauthorized: Invalid API Key' });
    }
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
