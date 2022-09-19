import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<Command.Options>({
  description: 'Récupérer la latence du bot',
})
export class PingCommand extends Command {
  public async messageRun(message: Message): Promise<void> {
    const msg = await message.channel.send('Ping?');

    const content = `Pong! Lantence du bot : ${Math.round(this.container.client.ws.ping)}ms. Latence de l'API : ${
      (msg.editedTimestamp ?? msg.createdTimestamp) - (message.editedTimestamp ?? message.createdTimestamp)
    }ms.`;

    await msg.edit(content);
  }
}
