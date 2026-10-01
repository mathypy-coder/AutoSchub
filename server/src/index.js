import { createApp } from './app.js';
import { openDb } from './db.js';
import { seedDemo } from './seed.js';

const db = await openDb();
await seedDemo(db);

const port = Number(process.env.PORT) || 3001;
createApp(db).listen(port, () => {
  console.log(`AutoSchub API prête sur http://localhost:${port}`);
  if (!db.isRemote) console.log('Base locale SQLite. Définis TURSO_DATABASE_URL pour une base hébergée.');
});
