import mongoose from 'mongoose';
import { config } from './config.js';
import { createApp } from './app.js';

mongoose.set('strictQuery', true);

try {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });
} catch (err) {
  console.error(`Could not connect to MongoDB at ${config.mongoUri.replace(/\/\/.*@/, '//***@')}\n${err.message}`);
  process.exit(1);
}
// Make sure indexes (unique email, table-slot guard, ...) exist before accepting traffic.
await mongoose.syncIndexes();

const server = createApp().listen(config.port, () => {
  console.log(`Aurelia API listening on http://localhost:${config.port}`);
});

const shutdown = () => server.close(() => mongoose.disconnect().then(() => process.exit(0)));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
