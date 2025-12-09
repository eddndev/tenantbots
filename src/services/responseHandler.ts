import { WASocket } from '@whiskeysockets/baileys';
import { Command, FlowStep } from '@prisma/client';

export class ResponseHandler {

    static async execute(sock: WASocket, jid: string, command: Command & { steps: FlowStep[] }) {
        if (!sock) return;

        // Sort steps (should be sorted by query, but double check)
        const steps = command.steps.sort((a, b) => a.order - b.order);

        for (const step of steps) {
            await this.executeStep(sock, jid, step);
        }
    }

    private static async executeStep(sock: WASocket, jid: string, step: FlowStep) {
        try {
            switch (step.type) {
                case 'DELAY':
                    const ms = parseInt(step.content, 10) || 1000;
                    // Optional: check if we should show 'composing' during delay? 
                    // Usually delay is just silence, unless specified in options.
                    // Let's implement dynamic options if needed, but for now simple delay.
                    await new Promise(r => setTimeout(r, ms));
                    break;

                case 'TEXT':
                    // Send presence 'composing' briefly before text if not manual delay?
                    // Let's mimic human behavior:
                    // 1. Presence 'composing'
                    // 2. Wait a bit (based on length?)
                    // 3. Send
                    // BUT: user might have configured explicit delays using 'DELAY' step before this.
                    // So we should assume the flow is [DELAY 2000] -> [TEXT "Hi"]
                    // If we add auto-delay here, it might duplicate.
                    // HOWEVER, we need to send 'composing' state.

                    // Check options for 'simulateTyping' or defaulting to true
                    const simulateTyping = (step.options as any)?.simulateTyping ?? true;
                    if (simulateTyping) {
                        await sock.sendPresenceUpdate('composing', jid);
                        // A small delay to show "typing..." on user phone
                        const typingMs = Math.min(2000, step.content.length * 50); // very rough heuristic
                        await new Promise(r => setTimeout(r, typingMs));
                    }

                    await sock.sendMessage(jid, { text: step.content });

                    if (simulateTyping) {
                        await sock.sendPresenceUpdate('paused', jid);
                    }
                    break;

                case 'IMAGE':
                    // Similar logic for media
                    await sock.sendPresenceUpdate('composing', jid);
                    await new Promise(r => setTimeout(r, 1000));

                    await sock.sendMessage(jid, {
                        image: { url: step.content },
                        caption: (step.options as any)?.caption
                    });
                    break;

                case 'AUDIO':
                    await sock.sendPresenceUpdate('recording', jid);
                    // access ptt option
                    const ptt = (step.options as any)?.ptt ?? true;
                    // Simulate recording time?
                    await new Promise(r => setTimeout(r, 2000));

                    await sock.sendMessage(jid, {
                        audio: { url: step.content },
                        mimetype: 'audio/mp4',
                        ptt: ptt
                    });
                    break;

                default:
                    console.warn(`Unknown step type: ${step.type}`);
                    break;
            }
        } catch (error) {
            console.error(`Error executing step ${step.id} type ${step.type}:`, error);
        }
    }
}
