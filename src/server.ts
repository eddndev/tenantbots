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
    // Skip auth for static files and health check
    if (request.url.startsWith('/api/static') || request.url === '/api/health') {
        return;
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) return; // Open if no key configured (dev mode)

    const providedKey = request.headers['x-api-key'];
    if (providedKey !== apiKey) {
        reply.code(401).send({ error: 'Unauthorized: Invalid API Key' });
    }
});

// Serve Static Files (Images, QR codes, etc.)
server.register(fastifyStatic, {
    root: path.join(__dirname, '../public'),
    prefix: '/api/static/', // Access via http://host/api/static/image.jpg
});

import multipart from '@fastify/multipart';
import { uploadRoutes } from './routes/upload';

// ... imports

// ... server setup ...

// Register Multipart (File Uploads)
server.register(multipart);

// Register Routes
server.register(sessionRoutes, { prefix: '/api' });
server.register(require('./routes/commands').commandRoutes, { prefix: '/api' });
server.register(require('./routes/interactions').interactionRoutes, { prefix: '/api' });
server.register(uploadRoutes, { prefix: '/api' });

// Health Check
server.get('/api/health', async () => {
    return { status: 'online', message: 'TenantBots API Running 🚀' };
});

const start = async () => {
    try {
        // Register static files BEFORE listening (Best practice, though fastify allows valid async flow)

        // Restore Sessions
        const { SessionManager } = await import('./sessionManager');
        await SessionManager.restoreSessions();

        const address = await server.listen({ port: 3000, host: '0.0.0.0' });
        console.log(`Server listening on ${address}`);
        console.log(`Static files being served from ${path.join(__dirname, '../public')}`);

    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
