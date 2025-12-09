import prisma from '../db';
import { proto } from '@whiskeysockets/baileys';

export class PersistenceLayer {
    /**
     * Checks if a user has already interacted with a "ONCE" frequency command.
     */
    static async shouldRespond(userJid: string, commandId: string, frequency: string): Promise<boolean> {
        if (frequency === 'ALWAYS') {
            return true;
        }

        if (frequency === 'ONCE') {
            const existing = await prisma.userInteraction.findFirst({
                where: {
                    userJid,
                    commandId,
                },
            });
            // If exists, do NOT respond
            return !existing;
        }

        return true;
    }

    /**
     * Logs the interaction in the database.
     */
    static async logInteraction(userJid: string, commandId: string) {
        try {
            await prisma.userInteraction.create({
                data: {
                    userJid,
                    commandId,
                },
            });
        } catch (error) {
            console.error('Failed to log interaction', error);
        }
    }
}
