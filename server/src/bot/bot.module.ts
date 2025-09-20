import { forwardRef, Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramGateway } from './bot.telegramgateway';
import { BotLifecycleService } from './bot-lifecycle.service';
import { ConfigService } from '@nestjs/config';
import { UserModule } from 'src/user/user.module';
import { BotMessageService } from './bot.message';
import { ModuleRef } from '@nestjs/core';
import { accessControlMiddleware } from './access-control.middleware';
import { BotManagerNotificationService } from './bot.managerNotification';
import { BotUserNotificationService } from './bot.userNotification';
import { ScheduleModule } from '@nestjs/schedule';
import { ControlSub } from './controlSub.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    forwardRef(() => UserModule),
    TelegrafModule.forRootAsync({
      imports: [UserModule],
      inject: [ConfigService, ModuleRef],
      useFactory: (config: ConfigService, moduleRef: ModuleRef) => ({
        token: config.get<string>('BOT_TOKEN')!,
        dropPendingUpdates: true,
        allowedUpdates: [
          'message',
          'callback_query',
          'pre_checkout_query',
          'successful_payment',
          'chat_member',
          'my_chat_member',
          'new_chat_members',
        ],
        middlewares: [
          (ctx, next) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            ctx.state.moduleRef = moduleRef;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            return accessControlMiddleware()(ctx, next);
          },
        ],
      }),
    }),
  ],
  controllers: [],
  providers: [
    BotService,
    BotLifecycleService,
    TelegramGateway,
    BotMessageService,
    BotManagerNotificationService,
    BotUserNotificationService,
    ControlSub,
  ],
  exports: [
    BotService,
    BotManagerNotificationService,
    BotUserNotificationService,
  ],
})
export class BotModule {}
