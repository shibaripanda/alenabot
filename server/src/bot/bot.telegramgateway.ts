import { Message, Update as UpdateTelegraf } from '@telegraf/types';
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
import { ConfigService } from '@nestjs/config';

export type UserTelegrafContext = NarrowedContext<
  Context,
  UpdateTelegraf.MessageUpdate
>;

@Update()
export class TelegramGateway {
  constructor(
    private botService: BotService,
    private appService: AppService,
    private userService: UserService,
    private readonly config: ConfigService,
  ) {}

  @Start()
  async start(@Ctx() ctx: UserTelegrafContext) {
    console.log('Your Chat ID:', ctx.chat.id);
    await this.userService.createUserOrUpdateUser(ctx.from);
    await ctx.reply('get start');
  }

  @Command('enter')
  async getAuthLink(@Ctx() ctx: UserTelegrafContext) {
    if (ctx && ctx.from) {
      await ctx.reply(this.appService.getAuthLink(ctx.from.id));
    }
  }

  @On('pre_checkout_query')
  async onCheckout(@Ctx() ctx: Context) {
    await ctx.answerPreCheckoutQuery(true);
  }

  @On('text')
  async onText(@Ctx() ctx: UserTelegrafContext) {
    const message = ctx.message as Message.TextMessage;
    const text = message.text;

    if (text === '/pay') {
      await ctx.replyWithInvoice({
        title: 'Тестовая услуга',
        description: 'Это описание услуги',
        payload: 'test-payload-123',
        provider_token: this.config.get<string>('ALFA_TOKEN')!,
        currency: 'BYN',
        prices: [{ label: 'Услуга', amount: 1500 }],
        start_parameter: 'test-start',
        send_email_to_provider: true,
        need_email: true,
      });
    }
  }

  @On('successful_payment')
  async onPayment(@Ctx() ctx: UserTelegrafContext) {
    const message = ctx.message as Message.SuccessfulPaymentMessage;

    const payment = message.successful_payment;
    await ctx.reply(
      `✅ Платёж на сумму ${payment.total_amount / 100} ${payment.currency} прошёл успешно!`,
    );
  }

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
  async hears(@Ctx() ctx: UserTelegrafContext) {
    await ctx.reply('get hi');
  }

  @On('photo')
  async addNewOrderImages(@Ctx() ctx: UserTelegrafContext) {
    await ctx.reply('get photo');
  }

  @Action('closeAccess')
  async closeAccess(@Ctx() ctx: UserTelegrafContext) {
    console.log('Access close');
    if (ctx.from) {
      await this.botService.sendTextMessage(ctx.from.id, 'Доступ закрыт');
    }
  }
}
