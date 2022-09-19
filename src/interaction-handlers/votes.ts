import { ApplyOptions } from '@sapphire/decorators';
import type { Option } from '@sapphire/framework';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ButtonInteraction, Guild } from 'discord.js';
import pupa from 'pupa';
import { proxies, votes } from '../db';
import messages from '../messages';
import type { VoteDocument } from '../types/database';

const allTypes = ['yes', 'no', 'blank'] as const;

interface VoteResults {
  yesCount: number;
  noCount: number;
  blankCount: number;
  totalVoters: number;
  totalVotes: number;
  totalDenominator: number;
  yesPercentage: number;
  noPercentage: number;
  blankPercentage: number;
  outcome: typeof allTypes[number] | null;
}

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class ButtonHandler extends InteractionHandler {
  public override parse(interaction: ButtonInteraction): Option<null> {
    if (!['vote-yes', 'vote-no', 'vote-blank', 'vote-finish'].includes(interaction.customId))
      return this.none();
    return this.some(null);
  }

  public async run(interaction: ButtonInteraction<'cached'>): Promise<void> {
    switch (interaction.customId) {
      case 'vote-yes':
      case 'vote-no':
      case 'vote-blank': {
        const voteType = interaction.customId.replace('vote-', '') as 'blank' | 'no' | 'yes';

        const hadAlreadyVotedDocument = await votes.findOne({
          messageId: interaction.message.id,
          $or: [
            /* eslint-disable @typescript-eslint/naming-convention */
            { 'votes.yesMemberIds': interaction.user.id },
            { 'votes.noMemberIds': interaction.user.id },
            { 'votes.blankMemberIds': interaction.user.id },
            /* eslint-enable @typescript-eslint/naming-convention */
          ],
        });

        const userProxies = await proxies.findOne({ guildId: interaction.guildId, byMemberId: interaction.user.id });
        const userWeight = 1 + (userProxies?.forMemberIds.length ?? 0);

        if (hadAlreadyVotedDocument) {
          const votedType = allTypes.find(type => hadAlreadyVotedDocument.votes[`${type}MemberIds`].includes(interaction.user.id))!;

          if (votedType === voteType) {
            await interaction.reply({
              content: 'Tu as déjà voté pour cet option pour ce vote.',
              ephemeral: true,
            });
            return;
          }

          await votes.update({ _id: hadAlreadyVotedDocument._id }, {
            $inc: { [`votes.${votedType}Count`]: -1 * userWeight },
            $pull: { [`votes.${votedType}MemberIds`]: interaction.user.id },
          });
        }

        await votes.update(
          { messageId: interaction.message.id },
          {
            $addToSet: { [`votes.${voteType}MemberIds`]: interaction.user.id },
            $inc: { [`votes.${voteType}Count`]: userWeight },
          },
        );

        const document = await votes.findOne({ messageId: interaction.message.id });
        const results = this._computeResults(document!, interaction.guild);
        await interaction.update(this._getContent(results, document!));
        break;
      }
      case 'vote-finish': {
        if (interaction.member.roles.cache.has(process.env.ROLE_VOTE_MANAGER!)) {
          const document = await votes.findOne({ messageId: interaction.message.id });
          const results = this._computeResults(document!, interaction.guild, true);
          await interaction.update({
            content: this._getContent(results, document!),
            components: [],
          });
        } else {
          await interaction.reply({
            content: "Vous n'avez pas la permission de terminer le vote.",
            ephemeral: true,
          });
        }
        break;
      }
    }
  }

  private _getContent(results: VoteResults, document: VoteDocument): string {
    return pupa(results.outcome
      ? messages.voteMessageResult(results.yesCount, results.noCount, results.blankCount)
      : messages.voteMessage,
      {
        ...results,
        yesPercentage: results.yesPercentage.toFixed(0),
        noPercentage: results.noPercentage.toFixed(0),
        blankPercentage: results.blankPercentage.toFixed(0),
        content: document.content,
        result: results.outcome ? messages.results[results.outcome] : '',
      });
  }

  private _computeResults(document: VoteDocument, guild: Guild, final = false): VoteResults {
    const { yesCount, noCount, blankCount } = document.votes;

    const totalVoters = document.votes.yesMemberIds.length
      + document.votes.noMemberIds.length
      + document.votes.blankMemberIds.length;

    const totalVotes = yesCount + noCount + blankCount;
    const totalDenominator = totalVotes || 1;

    let outcome: VoteResults['outcome'] = null;
    if (final) {
      /*
       * Une majorité de votes blancs invalide un vote. (...)
       *
       * Si la majorité des votes ne sont pas blancs, on considère les votes non-blancs : si une majorité absolue de
       * ces votes est "oui", la décision votée est acceptée. Sinon, la décision votée est refusée. En cas d'égalité
       * entre les votes "oui" et "non", la voix du Président compte double.
       */
      if (blankCount >= (yesCount + noCount)) {
        outcome = 'blank';
      } else if (yesCount === noCount) {
        const presidentHasVoted = document.votes.yesMemberIds.includes(process.env.MEMBER_PRESIDENT!)
          || document.votes.noMemberIds.includes(process.env.MEMBER_PRESIDENT!);
        if (presidentHasVoted)
          outcome = document.votes.yesMemberIds.includes(process.env.MEMBER_PRESIDENT!) ? 'yes' : 'no';
        else
          outcome = 'blank';
      } else if (yesCount > noCount) {
        outcome = 'yes';
      } else {
        outcome = 'no';
      }
    }

    return {
      yesCount,
      noCount,
      blankCount,
      totalVoters,
      totalVotes,
      totalDenominator,
      yesPercentage: (yesCount / totalDenominator) * 100,
      noPercentage: (noCount / totalDenominator) * 100,
      blankPercentage: (blankCount / totalDenominator) * 100,
      outcome,
    };
  }
}
