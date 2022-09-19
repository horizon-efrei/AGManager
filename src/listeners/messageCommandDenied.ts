import type { Events, MessageCommandDeniedPayload, UserError } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';

export class MessageCommandDeniedEvent extends Listener<typeof Events.MessageCommandDenied> {
  public async run({ context, message: content }: UserError, { message }: MessageCommandDeniedPayload): Promise<void> {
    // eslint-disable-next-line no-new-object
    if (Reflect.get(new Object(context), 'silent'))
      return;

    await message.reply({ content, allowedMentions: { users: [message.author.id], roles: [] } });
  }
}
