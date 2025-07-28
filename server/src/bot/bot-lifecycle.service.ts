import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';

@Injectable()
export class BotLifecycleService implements OnModuleInit, OnModuleDestroy {
  constructor(@InjectBot() private readonly bot: Telegraf) {}

  onModuleInit() {
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  onModuleDestroy() {
    this.bot.stop('Application shutdown');
    console.log('🛑 BotLifecycleService stopped bot');
  }
}
