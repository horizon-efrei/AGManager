import type { Events } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';
import type { VoiceState } from 'discord.js';
import { voiceLogs } from '../db';

export class VoiceStateUpdateEvent extends Listener<typeof Events.VoiceStateUpdate> {
  public async run(oldState: VoiceState, newState: VoiceState): Promise<void> {
    if (oldState.channelId === newState.channelId)
      return;

    if (newState.channelId === process.env.CHANNEL_VOICE!) {
      await voiceLogs.insert({
        guildId: oldState.guild.id,
        memberId: oldState.id,
        joinedAt: new Date(),
        leftAt: null,
      });
    } else {
      await voiceLogs.update({
        guildId: oldState.guild.id,
        memberId: oldState.id,
        leftAt: null,
      }, {
        $set: { leftAt: new Date() },
      });
    }
  }
}
