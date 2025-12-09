import prisma from '../db';
import { Command } from '@prisma/client';

export class CommandResolver {
    /**
     * Finds a matching command for the given text within a session.
     */
    static async resolve(sessionId: string, text: string): Promise<Command | null> {
        const lowerText = text.toLowerCase().trim();

        // 1. Fetch all enabled commands for this session
        // Optimization: In a real high-scale app, we might cache this usually
        // or query only commands that might match (e.g. using regex in DB if supported, or full text search)
        // For now, fetching all (likely small number) and filtering in memory is fine for MVP.
        const commands = await prisma.command.findMany({
            where: {
                sessionId: sessionId, // Assuming we link commands to a session, but schema links to Session ID? 
                // Ah, in schema we added `sessionId` to Command. 
                // But wait, `sessionId` in `WhatsAppService` is a string (often 'default' or UUID).
                // Ensure `Session` exists. If not, we might fail to find commands.
                // We'll rely on the Session existing in DB.
                isEnabled: true
            },
            include: {
                steps: {
                    orderBy: {
                        order: 'asc'
                    }
                }
            }
        });

        // 2. Perform Matching
        // Priority: EXACT > STARTS_WITH > CONTAINS
        // But we just return the first match for now, or sort by matchType preference/specificity?
        // Let's iterate and pick the "best" match.

        let bestMatch: Command | null = null;
        let bestScore = 0; // 3 = Exact, 2 = Starts, 1 = Contains

        for (const cmd of commands) {
            const triggers = cmd.triggers as string[]; // Prisma JSON is any, cast to string[]

            if (!Array.isArray(triggers)) continue;

            for (const triggerRaw of triggers) {
                const trigger = triggerRaw.toLowerCase();
                let match = false;
                let score = 0;

                if (cmd.matchType === 'EXACT' && lowerText === trigger) {
                    match = true;
                    score = 3;
                } else if (cmd.matchType === 'STARTS_WITH' && lowerText.startsWith(trigger)) {
                    match = true;
                    score = 2;
                } else if (cmd.matchType === 'CONTAINS' && lowerText.includes(trigger)) {
                    match = true;
                    score = 1;
                }

                if (match && score > bestScore) {
                    bestMatch = cmd;
                    bestScore = score;
                }
            }
        }

        return bestMatch;
    }
}
