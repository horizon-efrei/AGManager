import { ApplyOptions } from '@sapphire/decorators';
import type { Events } from '@sapphire/framework';
import { Listener } from '@sapphire/framework';

@ApplyOptions<Listener.Options>({ once: true })
export class ReadyEvent extends Listener<typeof Events.ClientReady> {
  public run(): void {
    this.container.logger.info('Ready to use !');
  }
}
