"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function test() {
    try {
        console.log('Testing Notebooks query...');
        const entries = await prisma.notebookPage.findMany({
            where: { facilityId: 'MLP-MERKEZ', year: 2026 },
        });
        console.log('Success! Entries found:', entries.length);
    }
    catch (error) {
        console.error('FAILED:', error.message);
        if (error.stack)
            console.error(error.stack);
    }
    finally {
        await prisma.$disconnect();
    }
}
test();
