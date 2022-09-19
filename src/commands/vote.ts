import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import { Command } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { MessageActionRow, MessageButton } from 'discord.js';
import { MessageButtonStyles } from 'discord.js/typings/enums';
import pupa from 'pupa';
import { votes } from '../db';
import messages from '../messages';

@ApplyOptions<Command.Options>({
  description: "Création d'un vote d'assemblée générale",
})
export class VoteCommand extends Command {
  public async messageRun(message: Message<true>, args: Args): Promise<void> {
    if (!message.member!.roles.cache.has(process.env.ROLE_VOTE_MANAGER!)) {
      await message.reply("Vous n'avez pas la permission d'utiliser cette commande.");
      return;
    }

    const voteContent = await args.rest('string');
    const reply = await message.channel.send({
      content: 'Création...',
      components: [
        new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId('vote-yes')
            .setLabel('Pour')
            .setStyle(MessageButtonStyles.SUCCESS),
          new MessageButton()
            .setCustomId('vote-no')
            .setLabel('Contre')
            .setStyle(MessageButtonStyles.DANGER),
          new MessageButton()
            .setCustomId('vote-blank')
            .setLabel('Blanc')
            .setStyle(MessageButtonStyles.PRIMARY),
          new MessageButton()
            .setCustomId('vote-finish')
            .setLabel('Mettre fin au vote')
            .setStyle(MessageButtonStyles.SECONDARY),
        ),
      ],
    });

    await votes.insert({
      content: voteContent,
      messageId: reply.id,
      channelId: reply.channelId,
      guildId: message.guildId,
      authorId: message.author.id,
      votes: {
        yesMemberIds: [],
        noMemberIds: [],
        blankMemberIds: [],
        yesCount: 0,
        noCount: 0,
        blankCount: 0,
      },
      finished: false,
      finishedAt: null,
      outcome: null,
    });

    await reply.edit(pupa(messages.voteMessage, {
      yesCount: 0,
      yesPercentage: 0,
      noCount: 0,
      noPercentage: 0,
      blankCount: 0,
      blankPercentage: 0,
      totalVoters: 0,
      totalVotes: 0,
      content: voteContent,
    }));

    await message.delete();
  }
}
