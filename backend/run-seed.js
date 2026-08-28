require('ts-node').register();
require('./src/seed-isg-categories').seedCategories().catch(console.error);
