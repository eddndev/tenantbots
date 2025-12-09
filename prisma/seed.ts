import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Ensure a default session exists
    let session = await prisma.session.findUnique({ where: { phoneNumber: 'default' } });

    // If finding by unique phoneNumber fails or isn't set, try finding first or create
    // Re-checking schema: phoneNumber is @unique but nullable.
    // Let's just create/upsert a known UUID or "default" named session for testing.

    // Actually, Session table: id (uuid), phoneNumber (unique?), name, status...
    // Let's check if we have any sessions, if not create one.
    const sessions = await prisma.session.findMany();
    let sessionId: string;

    if (sessions.length > 0) {
        sessionId = sessions[0].id;
        console.log(`Using existing session: ${sessions[0].name} (${sessionId})`);
    } else {
        const newSession = await prisma.session.create({
            data: {
                name: "Default Bot",
                phoneNumber: "5215512345678", // Dummy
                status: "CONNECTED",
                config: {}
            }
        });
        sessionId = newSession.id;
        console.log(`Created new session: ${sessionId}`);
    }

    // 3. Create "Licencia Permanente" Command Flow
    // Triggers: "info", "licencia", etc.
    const triggers = ['info', 'licencia', 'precio', 'ubicacion', 'informes', 'requisitos', 'permanente'];

    // Check if command exists (checking if any of these triggers are already covered might be complex if we split them)
    // For simplicity in seed, we'll check if a command with the first trigger exists in the list?
    // No, we just check if we have ANY command for now? 
    // Let's just create it if no command has these exact triggers? 
    // Or simpler: Upsert based on a unique constraint? No unique constraint on triggers anymore.
    // Let's just create it.

    console.log(`Creating command with triggers: ${triggers.join(', ')}...`);
    const command = await prisma.command.create({
        data: {
            sessionId,
            triggers: triggers, // JSON array
            matchType: 'CONTAINS',
            frequency: 'ONCE',
            isEnabled: true
    // 1. Initial Delay
    await addStep('DELAY', '3000'); // 3s delay for testing

            // 2. Greeting
            // Note: Logic had dynamic greeting based on time. 
            // Our current `ResponseHandler` is dumb (fixed text). 
            // To support dynamic greeting, we'd need a "DYNAMIC_TEXT" type or handle it in code.
            // For MVP now, let's just put "Hola".
            await addStep('TEXT', 'Hola, disculpe por la demora he tenido muchos clientes\nLe mando la información de la licencia permanente de carro y camioneta\n\nNo tramitamos de moto🚫');

            // 3. Info Body
            await addStep('DELAY', '2000');
            await addStep('TEXT', 'Licencia permanente Auto 🚗🚙\nNosotrs realizamos el trámite en linea...\n(Texto resumido para seed)...');

            // 4. Images
            await addStep('DELAY', '1500');
            await addStep('IMAGE', 'https://app.angelviajero.com.mx/api/static/images/image1.jpg', { caption: 'Le sacaría la licencia física y digital...' });

            await addStep('DELAY', '500');
            await addStep('IMAGE', 'https://app.angelviajero.com.mx/api/static/images/image2.jpg');

            await addStep('DELAY', '500');
            await addStep('IMAGE', 'https://app.angelviajero.com.mx/api/static/images/image3.jpg', { caption: 'Ejemplo de formato de pago...' });

            // 5. Ubicacion
            await addStep('DELAY', '3000');
            await addStep('TEXT', 'La entrega es en módulo oficial semovi... https://share.google/qcZqz98H2TuDoc08D');

            // 6. Audios
            await addStep('DELAY', '3000');
            await addStep('AUDIO', 'https://app.angelviajero.com.mx/api/static/audio/audio1.opus', { ptt: true });

            await addStep('DELAY', '2000');
            await addStep('AUDIO', 'https://app.angelviajero.com.mx/api/static/audio/audio2.opus', { ptt: true });

            // 7. Price
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
