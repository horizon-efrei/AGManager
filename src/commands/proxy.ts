import { userMention } from '@discordjs/builders';
import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import { Command } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { proxies } from '../db';

@ApplyOptions<Command.Options>({
  description: 'Gérer les procurations des membres',
})
export class ProxyCommand extends Command {
  public async messageRun(message: Message<true>, args: Args): Promise<void> {
    if (!message.member!.roles.cache.has(process.env.ROLE_BOARD!)) {
      await message.reply("Vous n'avez pas la permission d'utiliser cette commande.");
      return;
    }

    const subcommand = await args.pickResult('string');
    switch (subcommand.unwrapOr('')) {
      case 'add':
        await this._add(message, args);
        break;
      case 'remove':
        await this._remove(message, args);
        break;
      case 'list':
        await this._list(message);
        break;
      default:
        await message.reply('Sous-commande invalide. Utilise `!proxy add <@par> <@pour> [...<@pour>]`, `!proxy remove <@par> <@pour>` ou `list`.');
        break;
    }
  }

  private async _add(message: Message<true>, args: Args): Promise<void> {
    const memberBy = await args.pickResult('member');
    if (memberBy.isErr()) {
      await message.reply('Procurateur invalide.');
      return;
    }

    const membersFor = await args.repeatResult('member');
    if (membersFor.isErr()) {
      await message.reply('Procuré(s) invalide(s).');
      return;
    }

    const existingBy = await proxies.findOne({ guildId: message.guild.id, byMemberId: memberBy.unwrap().id });
    if (existingBy) {
      await proxies.update({ _id: existingBy._id }, {
        $addToSet: { forMemberIds: { $each: membersFor.unwrap().map(member => member.id) } },
      });
    } else {
      await proxies.insert({
        guildId: message.guild.id,
        byMemberId: memberBy.unwrap().id,
        forMemberIds: membersFor.unwrap().map(member => member.id),
      });
    }

    await message.reply(`Procurations de ${membersFor.unwrap().join(', ')} ajoutées pour ${memberBy.unwrap()}.`);
  }

  private async _remove(message: Message<true>, args: Args): Promise<void> {
    const memberBy = await args.pickResult('member');
    if (memberBy.isErr()) {
      await message.reply('Procurateur invalide.');
      return;
    }

    const memberFor = await args.pickResult('member');
    if (memberFor.isErr()) {
      await message.reply('Procuré invalide.');
      return;
    }

    await proxies.update(
      { guildId: message.guild.id, byMemberId: memberBy.unwrap().id },
      { $pull: { forMemberIds: memberFor.unwrap().id } },
    );
    await message.reply(`Procuration de ${memberFor.unwrap()} retirée pour ${memberBy.unwrap()}.`);
  }

  private async _list(message: Message<true>): Promise<void> {
    const allProxies = await proxies.find({ guildId: message.guild.id });
    if (allProxies.length === 0) {
      await message.reply('Aucune procuration enregistrée.');
      return;
    }

    await message.reply(`**Procurations :**\n${allProxies.map(proxy => `  - ${userMention(proxy.byMemberId)} vote pour ${proxy.forMemberIds.map(memberId => userMention(memberId)).join(', ')}`).join('\n')}`);
  }
}
