import { createApp } from './app.js';
import { openDb } from './db.js';
import { seedIfEmpty } from './seed.js';

const db = openDb();
if (process.env.SEED !== '0') seedIfEmpty(db);

const port = Number(process.env.PORT) || 3001;
createApp(db).listen(port, () => {
  console.log(`AutoSchub API prête sur http://localhost:${port}`);
});
