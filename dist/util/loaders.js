import { glob, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { predicate as commandPredicate } from '../commands/index.js';
import { predicate as eventPredicate } from '../events/index.js';
/**
 * Loads all the structures in the provided directory
 *
 * @param dir - The directory to load the structures from
 * @param predicate - The predicate to check if the structure is valid
 * @param recursive - Whether to recursively load the structures in the directory
 * @returns
 */
export async function loadStructures(dir, predicate, recursive = true) {
    // Get the stats of the directory
    const statDir = await stat(dir);
    // If the provided directory path is not a directory, throw an error
    if (!statDir.isDirectory()) {
        throw new Error(`The directory '${dir}' is not a directory.`);
    }
    // Create an empty array to store the structures
    const structures = [];
    // Create a glob pattern to match the .js files
    const basePath = dir instanceof URL ? fileURLToPath(dir) : dir.toString();
    const pattern = resolve(basePath, recursive ? '**/*.js' : '*.js');
    // Loop through all the matching files in the directory
    for await (const file of glob(pattern)) {
        // If the file is index.js, skip the file
        if (file.endsWith('/index.js')) {
            continue;
        }
        // Import the structure dynamically from the file
        const { default: structure } = await import(file);
        // If the default export is a valid structure, add it
        if (predicate(structure)) {
            structures.push(structure);
        }
    }
    return structures;
}
export async function loadCommands(dir, recursive = true) {
    return (await loadStructures(dir, commandPredicate, recursive)).reduce((acc, cur) => acc.set(cur.data.name, cur), new Map());
}
export async function loadEvents(dir, recursive = true) {
    return loadStructures(dir, eventPredicate, recursive);
}
//# sourceMappingURL=loaders.js.map