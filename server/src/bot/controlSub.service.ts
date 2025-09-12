import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppService } from 'src/app/app.service';
import { UserService } from 'src/user/user.service';
import { BotService } from './bot.service';

@Injectable()
export class ControlSub {
  constructor(
    private readonly userService: UserService,
    private readonly appService: AppService,
    private readonly config: ConfigService,
    private readonly botService: BotService,
  ) {}

  // @Cron(CronExpression.EVERY_MINUTE)
  async checkSubscriptions() {
    console.log('cron');
    const now = new Date();
    const app = await this.appService.getAppSettings();

    if (!app) {
      console.error(`[Cron] Пропуск — нет настроек приложения`);
      return;
    }
    // const appUsers = await this.userService.getUsers();
    // console.log(appUsers);
    const users = await this.userService.getUsersControl();
    console.log('users: ', users);

    for (const user of users) {
      const diffMs = user.subscriptionExpiresAt.getTime() - now.getTime();

      if (
        diffMs <=
          Number(this.config.get<number>('TIME_3DAYS_CONTROL')!) *
            60 *
            60 *
            1000 &&
        diffMs >
          Number(this.config.get<number>('TIME_1DAY_CONTROL')!) *
            60 *
            60 *
            1000 &&
        !user.notified72h
      ) {
        console.log('3 day');
        await this.userService.controlTreeDaysUserNotification(user, app);
        user.notified72h = true;
        await user.save();
      }

      if (
        diffMs <=
          Number(this.config.get<number>('TIME_1DAY_CONTROL')!) *
            60 *
            60 *
            1000 &&
        diffMs > 0 &&
        !user.notified24h
      ) {
        console.log('1 day');
        await this.userService.controlLastUserNotification(user, app);
        user.notified24h = true;
        await user.save();
      }

      if (diffMs <= 0) {
        console.log('delete');
        const res = await this.userService.controlUserForDelete(user);
        user.status = 'new';
        user.notified72h = false;
        user.notified24h = false;
        if (res) user.isSubscribed = false;
        await this.botService.startBotMessage(user.telegramId, user, app);
        await user.save();
      }
      console.log(user);
    }
  }
}
