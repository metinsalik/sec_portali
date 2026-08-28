const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up ISG Defter test data...");
  
  // NotebookItemAction and NotebookItemComment will be deleted automatically due to Cascade delete on NotebookItem.
  // NotebookItem will be deleted automatically due to Cascade delete on NotebookPage.
  // Wait, let's look at schema:
  // NotebookItem has: page NotebookPage @relation(fields: [pageId], references: [id], onDelete: Cascade)
  // NotebookItemAction has: notebookItem NotebookItem @relation(fields: [notebookItemId], references: [id], onDelete: Cascade)
  // So deleting NotebookPage is enough!
  
  const deletedPages = await prisma.notebookPage.deleteMany({});
  console.log(`Deleted ${deletedPages.count} NotebookPage records.`);
  
  console.log("Cleanup complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
