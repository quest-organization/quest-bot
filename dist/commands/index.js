import { z } from 'zod';
/**
 * Defines the schema for a command
 */
export const schema = z.object({
    data: z.record(z.any()),
    execute: z.function(),
});
/**
 * Defines the predicate to check if an object is a valid Command type.
 */
export const predicate = (structure) => schema.safeParse(structure).success;
//# sourceMappingURL=index.js.map