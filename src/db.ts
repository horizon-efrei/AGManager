import { container } from '@sapphire/framework';
import monk from 'monk';
import type { ProxyDocument, VoiceLogDocument, VoteDocument } from './types/database';

if (!process.env.MONGO_URL)
  throw new Error('MONGO_URL is not defined');

const db = monk(process.env.MONGO_URL);

void db.then(() => {
  container.logger.info('Connected to MongoDB Database');
});

export default db;

export const votes = db.get<VoteDocument>('votes');
export const proxies = db.get<ProxyDocument>('proxies');
export const voiceLogs = db.get<VoiceLogDocument>('voiceLogs');
