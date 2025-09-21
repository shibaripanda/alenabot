import { MiddlewareFn } from 'telegraf';
import { Context } from 'telegraf';
import { ModuleRef } from '@nestjs/core';
import { UserDocument } from 'src/user/user.schema';
import { AppDocument } from 'src/app/app.schema';
import { ConfigService } from '@nestjs/config';

export interface ContextWithUser extends Context {
  user?: UserDocument;
  app?: AppDocument;
}

export const groupPrivateMiddleware = (): MiddlewareFn<ContextWithUser> => {
  return async (ctx, next) => {
    console.log('groupPrivateMiddleware');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const moduleRef: ModuleRef | undefined = ctx.state?.moduleRef;
    if (!moduleRef) return;

    const config = moduleRef.get(ConfigService, { strict: false });

    if (typeof ctx.update['pre_checkout_query'] !== 'undefined') {
      return next();
    }

    if (
      typeof ctx['message'] !== 'undefined' &&
      (typeof ctx.message['new_chat_members'] !== 'undefined' ||
        ctx.message['left_chat_member'] !== 'undefined')
    ) {
      return next();
    }

    const chat = ctx.chat;
    if (!chat) return;

    if (chat.type === 'private') {
      return next();
    }

    if (
      (chat.type === 'group' || chat.type === 'supergroup') &&
      chat.id === Number(config.get<string>('MANAGER_GROUP')!)
    ) {
      return next();
    }
    return;
  };
};
