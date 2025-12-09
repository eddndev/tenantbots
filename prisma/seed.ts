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

    // 2. Create "Licencia Permanente" Command Flow
    // Trigger: "info", "licencia", etc.
    const keywords = "info,informes,licencia,requisitos,ubicacion,precio,permanente";

    // Clean existing commands for this session with these triggers to avoid dups during dev
    // For now, just create new one if not exists.

    // We'll Create ONE main command that triggers on "info" (and others via regex or multiple entries? 
    // Our resolver logic checks "CONTAINS". So "info" covers "informacion".
    // "licencia" covers matched.
    // Let's create one command with trigger "info" that matches "CONTAINS".
    // Note: The original logic had MANY keywords. 
    // Ideally we should have multiple commands pointing to same flow, OR one command with a regex trigger?
    // Current Command model has `trigger` string. 
    // Let's create multiple commands that point to the SAME flow steps? 
    // Or just create one generic command for now: "licencia".

    const triggers = ['info', 'licencia', 'precio', 'ubicacion'];

    for (const trigger of triggers) {
        // Check exist
        const exists = await prisma.command.findFirst({
            where: { sessionId, trigger }
        });

        if (exists) {
            console.log(`Command '${trigger}' already exists. Skipping.`);
            continue;
        }

        console.log(`Creating command '${trigger}'...`);
        const command = await prisma.command.create({
            data: {
                sessionId,
                trigger,
                matchType: 'CONTAINS',
                frequency: 'ONCE', // Important: The requirement said "Already served check" -> ONCE
                isEnabled: true
            }
        });

        // 3. Add Steps (The big flow)
        // We add them in order.

        // Step 0: Random Initial Delay (3-5 min in logic, but hardcoded in steps? 
        // The logic in whatsapp.ts had Math.random. 
        // Our FlowStep table handles fixed delays. 
        // For now, let's put a fixed delay of 5 seconds for testing, or 3 minutes?
        // User might hate waiting 3 mins during test. Let's put 5 seconds (5000ms).
        // We can update to 180000 later.

        let order = 1;
        const addStep = async (type: string, content: string, options: any = {}) => {
            await prisma.flowStep.create({
                data: {
                    commandId: command.id,
                    type,
                    content,
                    options,
                    order: order++
                }
            });
        };

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
        await addStep('DELAY', '2000');
        await addStep('TEXT', 'El precio es de 2000. Paga 1500 al gobierno y 500 a mí.');

        // 8. Closing
        await addStep('DELAY', '1000');
        await addStep('TEXT', '¿Tiene alguna duda?');
    }

    console.log('✅ Seed completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
