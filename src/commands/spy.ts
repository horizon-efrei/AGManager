import { time } from '@discordjs/builders';
import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import { Command } from '@sapphire/framework';
import dayjs from 'dayjs';
import type { GuildMember, Message } from 'discord.js';
import { voiceLogs, votes } from '../db';

@ApplyOptions<Command.Options>({
  description: 'Consulter les logs de connexion des membres',
})
export class SpyCommand extends Command {
  public async messageRun(message: Message<true>, args: Args): Promise<void> {
    if (!message.member!.roles.cache.has(process.env.ROLE_BOARD!)) {
      await message.reply("Vous n'avez pas la permission d'utiliser cette commande.");
      return;
    }

    const member = await args.pick('member');
    await message.reply(await this._contentFor(member));
  }

  private async _contentFor(member: GuildMember): Promise<string> {
    const logs = await voiceLogs.find(
      { guildId: member.guild.id, memberId: member.id },
      { sort: { joinedAt: 1 } },
    );

    const userVotes = await votes.count({ guildId: member.guild.id, memberId: member.id });

    const firstJoin = logs[0]?.joinedAt;
    if (!firstJoin)
      return "Ce membre n'a jamais rejoint un salon vocal.";

    const lastLeave = logs[logs.length - 1]?.leftAt ?? null;
    const totalConnexionDurationMillis = logs.reduce(
      (acc, log) => acc + ((log.leftAt?.getTime() ?? Date.now()) - log.joinedAt?.getTime()),
      0,
    );

    const builder = `
${member}
Première connexion : ${time(firstJoin, 'F')}
Dernière déconnexion : ${lastLeave ? time(lastLeave, 'F') : 'Encore en vocal'}
Durée total de connexion : ${dayjs.duration(totalConnexionDurationMillis, 'milliseconds').humanize()}
Votes participés : ${userVotes}
Sessions (${logs.length}) :
${logs.map((log, index) => `  \`${index + 1}.\` ${time(log.joinedAt, 'F')} - ${log.leftAt ? time(log.leftAt, 'F') : 'maintenant'} (${dayjs.duration((log.leftAt?.getTime() ?? Date.now()) - log.joinedAt.getTime(), 'milliseconds').humanize()})`).join('\n')}
`;

    return builder;
  }
}
