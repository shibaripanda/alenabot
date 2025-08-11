import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppService } from 'src/app/app.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class ControlSub {
  constructor(
    private readonly userService: UserService,
    private readonly appService: AppService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
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
        diffMs <= 72 * 60 * 60 * 1000 &&
        diffMs > 24 * 60 * 60 * 1000 &&
        !user.notified72h
      ) {
        await this.userService.controlTreeDaysUserNotification(user, app);
        user.notified72h = true;
        await user.save();
      }

      if (diffMs <= 24 * 60 * 60 * 1000 && diffMs > 0 && !user.notified24h) {
        await this.userService.controlLastUserNotification(user, app);
        user.notified24h = true;
        await user.save();
      }

      if (diffMs <= 0) {
        await this.userService.controlUserForDelete(user);
        user.status = 'new';
        user.notified72h = false;
        user.notified24h = false;
        await user.save();
      }
    }
  }
}
