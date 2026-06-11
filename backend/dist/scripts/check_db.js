"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        // @ts-ignore
        const count = await prisma.notebookEntry.count();
        console.log('NotebookEntry count:', count);
    }
    catch (error) {
        console.error('Error accessing NotebookEntry:', error.message);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
