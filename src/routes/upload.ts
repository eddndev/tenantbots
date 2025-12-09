import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { pipeline } from 'stream';

const pump = util.promisify(pipeline);

export async function uploadRoutes(fastify: FastifyInstance) {
    fastify.post('/upload', async (req, reply) => {
        const data = await req.file();

        if (!data) {
            return reply.status(400).send({ error: 'No file uploaded' });
        }

        // Create filename with timestamp to avoid collisions
        const timestamp = Date.now();
        const safeName = data.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}_${safeName}`;

        // Ensure uploads directory exists
        const uploadDir = path.join(__dirname, '../../public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const savePath = path.join(uploadDir, filename);

        // Save file
        await pump(data.file, fs.createWriteStream(savePath));

        // Return URL
        // Assuming server is serving 'public' at /api/static
        const fileUrl = `/api/static/uploads/${filename}`;

        return { url: fileUrl, filename: filename };
    });
}
