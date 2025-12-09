import { WASocket } from '@whiskeysockets/baileys';
import { Command, FlowStep } from '@prisma/client';
import path from 'path';

export class ResponseHandler {

    static async execute(sock: WASocket, jid: string, command: Command & { steps: FlowStep[] }) {
        if (!sock) return;

        // Sort steps (should be sorted by query, but double check)
        const steps = command.steps.sort((a, b) => a.order - b.order);

        for (const step of steps) {
            await this.executeStep(sock, jid, step);
        }
    }

    private static resolveContent(content: string): string {
        // If it looks like a relative uploaded path
        if (content.startsWith('/api/static/')) {
            // Convert /api/static/uploads/foo.jpg -> public/uploads/foo.jpg
            const relativePath = content.replace('/api/static/', '');
            // Process CWD in Docker is /app (or the root of the project)
            // 'public' is at the root.
            const localPath = path.join(process.cwd(), 'public', relativePath);
            return localPath;
        }
        return content;
    }

    private static async executeStep(sock: WASocket, jid: string, step: FlowStep) {
        try {
            switch (step.type) {
                case 'DELAY':
                    const ms = parseInt(step.content, 10) || 1000;
                    await new Promise(r => setTimeout(r, ms));
                    break;

                case 'TEXT':
                    let content = step.content;
                    const variants = (step.options as any)?.timeVariants;

                    if (Array.isArray(variants)) {
                        const now = new Date();
                        const utcHour = now.getUTCHours();
                        const mexicoHour = (utcHour - 6 + 24) % 24; // Mexico City is UTC-6 (Standard Time)

                        // Find matching variant
                        const match = variants.find((v: any) => {
                            const start = parseInt(v.startHour);
                            const end = parseInt(v.endHour);
                            // Handle wrapping ranges (e.g. 22 to 5)
                            if (start <= end) {
                                return mexicoHour >= start && mexicoHour <= end;
                            } else {
                                return mexicoHour >= start || mexicoHour <= end;
                            }
                        });

                        if (match) {
                            content = match.content;
                        }
                    }

                    const simulateTyping = (step.options as any)?.simulateTyping ?? true;
                    if (simulateTyping) {
                        await sock.sendPresenceUpdate('composing', jid);
                        const typingMs = Math.min(2000, content.length * 50); // very rough heuristic
                        await new Promise(r => setTimeout(r, typingMs));
                    }

                    await sock.sendMessage(jid, { text: content });

                    if (simulateTyping) {
                        await sock.sendPresenceUpdate('paused', jid);
                    }
                    break;

                case 'IMAGE':
                    await sock.sendPresenceUpdate('composing', jid);
                    await new Promise(r => setTimeout(r, 1000));

                    await sock.sendMessage(jid, {
                        image: { url: this.resolveContent(step.content) },
                        caption: (step.options as any)?.caption
                    });
                    break;

                case 'AUDIO':
                    await sock.sendPresenceUpdate('recording', jid);
                    const ptt = (step.options as any)?.ptt ?? true;
                    // Simulate recording time?
                    await new Promise(r => setTimeout(r, 2000));

                    await sock.sendMessage(jid, {
                        audio: { url: this.resolveContent(step.content) },
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
