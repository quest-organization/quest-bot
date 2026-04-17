import { z } from 'zod';
/**
 * Defines the schema for an event.
 */
export const schema = z.object({
    name: z.string(),
    once: z.boolean().optional().default(false),
    execute: z.function(),
});
/**
 * Defines the predicate to check if an object is a valid Event type.
 */
export const predicate = (structure) => schema.safeParse(structure).success;
//# sourceMappingURL=index.js.map