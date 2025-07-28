import { Update as UpdateTelegraf } from '@telegraf/types';
import { BotService } from './bot.service';
import {
  Action,
  Command,
  Ctx,
  Hears,
  On,
  Start,
  Update,
} from 'nestjs-telegraf';
import { AppService } from 'src/app/app.service';
import { UserService } from 'src/user/user.service';
import { Context, NarrowedContext } from 'telegraf';

@Update()
export class TelegramGateway {
  constructor(
    private botService: BotService,
    private appService: AppService,
    private userService: UserService,
  ) {}

  @On('chat_member')
  async onChatMemberUpdate(
    @Ctx() ctx: NarrowedContext<Context, UpdateTelegraf.ChatMemberUpdate>,
  ) {
    const update = ctx.update.chat_member;
    const user = update.new_chat_member.user;
    const chatId = update.chat.id;

    if (!user || !chatId || update.new_chat_member.status !== 'member') return;

    const telegramId = user.id;

    // Проверка оплаты через сервис доступа
    const hasAccess = true; //await this.accessService.hasAccess(telegramId) || true;

    if (!hasAccess) {
      // Удаляем пользователя, если нет доступа
      await ctx.telegram.banChatMember(chatId, telegramId);
      await ctx.telegram.unbanChatMember(chatId, telegramId);
      await ctx.telegram.sendMessage(
        telegramId,
        '❌ У вас нет доступа. Оплатите подписку, чтобы вступить в канал.',
      );
    } else {
      // Можно отправить приветствие, если хочешь
      await ctx.telegram.sendMessage(
        telegramId,
        '👋 Добро пожаловать в канал!',
      );
    }
  }

  @Hears('hi')
  async hears(@Ctx() ctx: Context) {
    await ctx.reply('get hi');
  }

  @On('photo')
  async addNewOrderImages(@Ctx() ctx: Context) {
    await ctx.reply('get photo');
  }

  @Start()
  async start(@Ctx() ctx: Context) {
    console.log(ctx.from);
    if (ctx.from) {
      await this.userService.createUserOrUpdateUser(ctx.from);
    }
    await ctx.reply('get start');
  }

  @Action('closeAccess')
  async closeAccess(@Ctx() ctx: Context) {
    console.log('Access close');
    if (ctx.from) {
      await this.botService.sendTextMessage(ctx.from.id, 'Доступ закрыт');
    }
  }

  @Command('enter')
  async getAuthLink(@Ctx() ctx: Context) {
    if (ctx && ctx.from) {
      await ctx.reply(this.appService.getAuthLink(ctx.from.id));
    }
  }
}
