import '@sapphire/plugin-logger/register';
import 'reflect-metadata';
import 'dotenv/config';
import 'dayjs/locale/fr';
import { LogLevel, SapphireClient } from '@sapphire/framework';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Intents } from 'discord.js';

dayjs.locale('fr');
dayjs.extend(duration);
dayjs.extend(relativeTime);

const client = new SapphireClient({
  defaultPrefix: '-',
  caseInsensitiveCommands: true,
  loadDefaultErrorListeners: true,
  loadMessageCommandListeners: true,
  logger: {
    level: LogLevel.Debug,
  },
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.MESSAGE_CONTENT,
  ],
});

for (const envVar of ['ROLE_BOARD', 'ROLE_VOTE_MANAGER', 'MEMBER_PRESIDENT', 'CHANNEL_VOICE']) {
  if (!process.env[envVar])
    throw new Error(`Missing environment variable: ${envVar}`);
}

async function main(): Promise<void> {
  try {
    await client.login(process.env.DISCORD_TOKEN);
    client.logger.info('Logged in');
  } catch (error) {
    client.logger.fatal(error);
    client.destroy();
    // eslint-disable-next-line node/no-process-exit
    process.exit(1);
  }
}

void main();
