import Fastify from 'fastify';
import pino from 'pino';
import { WhatsAppService } from './whatsapp';

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

server.get('/', async (request, reply) => {
    return { status: 'ok', uptime: process.uptime() };
});

const start = async () => {
    try {
        const address = await server.listen({ port: 3000, host: '0.0.0.0' });
        console.log(`Server listening on ${address}`);

        // Initialize WhatsApp Connection
        const wa = new WhatsAppService();
        await wa.connect();
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
