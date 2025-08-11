import { Update as UpdateTelegraf } from '@telegraf/types';
import { BotService } from './bot.service';
import {
  Action,
  // Command,
  Ctx,
  InjectBot,
  // Hears,
  On,
  Start,
  Update,
} from 'nestjs-telegraf';
import { AppService } from 'src/app/app.service';
import { Context, NarrowedContext, Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { Message } from 'telegraf/typings/core/types/typegram';
import { UserTelegrafContextWithUserMongo } from './interfaces/UserTelegrafContextWithUserMongo';

export type UserTelegrafContext = NarrowedContext<
  Context,
  UpdateTelegraf.MessageUpdate
>;

@Update()
export class TelegramGateway {
  constructor(
    @InjectBot() private bot: Telegraf,
    private botService: BotService,
    private appService: AppService,
    private readonly config: ConfigService,
  ) {}

  @Start()
  async start(@Ctx() ctx: UserTelegrafContextWithUserMongo) {
    console.log('Your ID:', ctx.from.id);
    console.log(ctx.user);
    console.log(ctx.app);
    await this.botService.startBotMessage(ctx.from.id, ctx.user, ctx.app);
  }

  @Action('backToMainMenu')
  async backToMainMenu(@Ctx() ctx: UserTelegrafContextWithUserMongo) {
    console.log('backToMainMenu');
    await this.botService.startBotMessage(ctx.from.id, ctx.user, ctx.app);
    await ctx.answerCbQuery();
  }

  @Action('takeChannel')
  async takeChannel(@Ctx() ctx: UserTelegrafContextWithUserMongo) {
    console.log('takeChannel');
    if (ctx.user.isSubscribed) {
      await this.botService.listProductsForOldUsers(
        ctx.from.id,
        'Из какой вы страны?',
        ctx.user,
        ctx.app,
      );
    } else {
      await this.botService.listProducts(ctx.from.id, ctx.user, ctx.app);
    }
    await ctx.answerCbQuery();
  }

  @Action('takeChannelLong')
  async takeChannelLong(@Ctx() ctx: UserTelegrafContextWithUserMongo) {
    console.log('takeChannelLong');
    await this.botService.listProductsForOldUsers(
      ctx.from.id,
      'Продление подписки Jumping Universe',
      ctx.user,
      ctx.app,
    );
    await ctx.answerCbQuery();
  }

  @On('successful_payment')
  async onSuccessfulPayment(@Ctx() ctx: Context) {
    console.log('successful_payment');
    const update = ctx.update as UpdateTelegraf.MessageUpdate;
    if (
      update.message &&
      'successful_payment' in update.message &&
      update.message.successful_payment
    ) {
      const message = update.message as Message.SuccessfulPaymentMessage;
      const payment = message.successful_payment;

      await ctx.reply(
        `Спасибо за оплату на сумму ${payment.total_amount / 100} ${payment.currency}!`,
      );
    } else {
      console.warn('Update не содержит успешной оплаты');
    }
  }

  @On('pre_checkout_query')
  async onPreCheckoutQuery(@Ctx() ctx: UserTelegrafContextWithUserMongo) {
    console.log('pre_checkout_query');
    console.log(ctx.update['pre_checkout_query']);
    await ctx.answerPreCheckoutQuery(true).then((res) => {
      console.log(res);
      console.log(
        new Date(Date.now()).toLocaleString('ru-RU', {
          dateStyle: 'short',
          timeStyle: 'medium',
        }),
      );
    });
  }

  @On('callback_query')
  async invoice(@Ctx() ctx: UserTelegrafContextWithUserMongo) {
    const data = ctx.callbackQuery.data;
    if (!data) return;

    if (!data) return;
    const invoice = data.split('|');

    if (invoice[0] === 'invoice') {
      const productId = invoice[1];
      if (ctx.from)
        await this.botService.invoice(
          ctx.from.id,
          productId,
          ctx.user,
          ctx.app,
        );
    } else if (invoice[0] === 'long') {
      const productId = invoice[1];
      if (ctx.from)
        await this.botService.listProductsLong(
          ctx.from.id,
          Number(productId),
          ctx.user,
          ctx.app,
        );
    }
    await ctx.answerCbQuery();
  }

  @On('text')
  async Context(@Ctx() ctx: Context) {
    const message = ctx.message as Message.TextMessage;
    const text = message.text;

    if (text.startsWith('sethellotext ')) {
      const helloText = text.replace('sethellotext ', '').trim();
      await this.appService.setHelloText(helloText);
      await ctx.reply('✅ Ready');
    }
  }

  @On('photo')
  async workWithPhoto(@Ctx() ctx: Context) {
    const message = ctx.message as Message.PhotoMessage;
    const caption = message.caption;
    const photos = message.photo;

    if (caption && caption == 'sethellophoto' && photos && photos.length > 0) {
      const largestPhoto = photos[photos.length - 1];
      const fileId = largestPhoto.file_id;
      await this.appService.setHelloPhoto(fileId);
      await ctx.reply('✅ Ready');
    }
  }

  // @Command('enter')
  // async getAuthLink(@Ctx() ctx: UserTelegrafContext) {
  //   if (ctx && ctx.from) {
  //     await ctx.reply(this.appService.getAuthLink(ctx.from.id));
  //   }
  // }

  // @On('pre_checkout_query')
  // async onCheckout(@Ctx() ctx: Context) {
  //   await ctx.answerPreCheckoutQuery(true);
  // }

  // @On('text')
  // async onText(@Ctx() ctx: UserTelegrafContext) {
  //   const message = ctx.message as Message.TextMessage;
  //   const text = message.text;

  //   if (text === '/pay') {
  //     await ctx.replyWithInvoice({
  //       title: 'Тестовая услуга',
  //       description: 'Это описание услуги',
  //       payload: 'test-payload-123',
  //       provider_token: this.config.get<string>('ALFA_TOKEN')!,
  //       currency: 'BYN',
  //       prices: [{ label: 'Услуга', amount: 1500 }],
  //       start_parameter: 'test-start',
  //       send_email_to_provider: true,
  //       need_email: true,
  //     });
  //   }
  // }

  // @On('successful_payment')
  // async onPayment(@Ctx() ctx: UserTelegrafContext) {
  //   const message = ctx.message as Message.SuccessfulPaymentMessage;

  //   const payment = message.successful_payment;
  //   await ctx.reply(
  //     `✅ Платёж на сумму ${payment.total_amount / 100} ${payment.currency} прошёл успешно!`,
  //   );
  // }

  // @On('chat_member')
  // async onChatMemberUpdate(
  //   @Ctx() ctx: NarrowedContext<Context, UpdateTelegraf.ChatMemberUpdate>,
  // ) {
  //   const update = ctx.update.chat_member;
  //   const user = update.new_chat_member.user;
  //   const chatId = update.chat.id;

  //   if (!user || !chatId || update.new_chat_member.status !== 'member') return;

  //   const telegramId = user.id;

  //   // Проверка оплаты через сервис доступа
  //   const hasAccess = true; //await this.accessService.hasAccess(telegramId) || true;

  //   if (!hasAccess) {
  //     // Удаляем пользователя, если нет доступа
  //     await ctx.telegram.banChatMember(chatId, telegramId);
  //     await ctx.telegram.unbanChatMember(chatId, telegramId);
  //     await ctx.telegram.sendMessage(
  //       telegramId,
  //       '❌ У вас нет доступа. Оплатите подписку, чтобы вступить в канал.',
  //     );
  //   } else {
  //     // Можно отправить приветствие, если хочешь
  //     await ctx.telegram.sendMessage(
  //       telegramId,
  //       '👋 Добро пожаловать в канал!',
  //     );
  //   }
  // }

  // @Hears('hi')
  // async hears(@Ctx() ctx: UserTelegrafContext) {
  //   await ctx.reply('get hi');
  // }

  // @On('photo')
  // async addNewOrderImages(@Ctx() ctx: UserTelegrafContext) {
  //   await ctx.reply('get photo');
  // }

  // @Action('closeAccess')
  // async closeAccess(@Ctx() ctx: UserTelegrafContext) {
  //   console.log('Access close');
  //   if (ctx.from) {
  //     await this.botService.sendTextMessage(ctx.from.id, 'Доступ закрыт');
  //   }
  // }
}
