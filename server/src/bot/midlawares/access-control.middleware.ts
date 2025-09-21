import { MiddlewareFn } from 'telegraf';
import { Context } from 'telegraf';
import { ModuleRef } from '@nestjs/core';
import { UserService } from 'src/user/user.service';
import { UserDocument } from 'src/user/user.schema';
import { AppService } from 'src/app/app.service';
import { AppDocument } from 'src/app/app.schema';
import { ConfigService } from '@nestjs/config';

export interface ContextWithUser extends Context {
  user?: UserDocument;
  app?: AppDocument;
}

export const accessControlMiddleware = (): MiddlewareFn<ContextWithUser> => {
  return async (ctx, next) => {
    console.log('accessControlMiddleware');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const moduleRef: ModuleRef | undefined = ctx.state?.moduleRef;
    if (!moduleRef) return next();

    const config = moduleRef.get(ConfigService, { strict: false });

    const from = ctx.from;
    if (!from) return;

    const userService = moduleRef.get(UserService, { strict: false });
    const userDoc = await userService.createOrUpdateUser(from);
    if (!userDoc) return;

    const appService = moduleRef.get(AppService, { strict: false });
    const appDoc = await appService.getAppSettings();
    if (!appDoc || !appDoc.startMessagePhoto) {
      if (!appDoc) {
        console.log('Нет настроек приложения');
        return;
      }
      if (!appDoc.startMessagePhoto)
        console.log('Нет стартового фото sethellophoto, sethellotext');
      if (from.id === Number(config.get<number>('SUPERADMIN')!)) {
        return next();
      }
      return;
    }

    ctx.user = userDoc;
    ctx.app = appDoc;

    await next();
  };
};
