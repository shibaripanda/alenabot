import { Context, NarrowedContext } from 'telegraf';
import { Update as UpdateTelegraf, CallbackQuery } from '@telegraf/types';
import { UserDocument } from 'src/user/user.schema';
import { AppDocument } from 'src/app/app.schema';

export interface UserTelegrafContextWithUserMongo
  extends NarrowedContext<Context, UpdateTelegraf.CallbackQueryUpdate> {
  user: UserDocument;
  app: AppDocument;
  callbackQuery: CallbackQuery.DataQuery; // здесь указываем нужный тип
}
