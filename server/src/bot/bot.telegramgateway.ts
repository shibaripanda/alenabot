import { Update as UpdateTelegraf } from '@telegraf/types';
import { BotService } from './bot.service';
import {
  Action,
  Command,
  Ctx,
  InjectBot,
  On,
  Start,
  Update,
} from 'nestjs-telegraf';
import { AppService } from 'src/app/app.service';
import { Context, NarrowedContext, Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { Message } from 'telegraf/typings/core/types/typegram';
import { UserTelegrafContextWithUserMongo } from './interfaces/UserTelegrafContextWithUserMongo';
import { UserService } from 'src/user/user.service';

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
    private userService: UserService,
  ) {
    // this.bot.use(async (ctx, next) => {
    //   console.log('Update received:', JSON.stringify(ctx.update, null, 2));
    //   await next();
    // });
  }

  // @On('chat_member')
  // onChatMember(@Ctx() ctx: Context) {
  //   const update = ctx.update as UpdateTelegraf.ChatMemberUpdate;
  //   const member = update.chat_member;
  //   console.log(member);

  // const user = await this.userService.getUserByTelegramId(userId);

  // if (!user || user.subscriptionExpiresAt < new Date()) {
  //   await ctx.telegram.banChatMember(ctx.chat.id, userId);
  //   await ctx.telegram.unbanChatMember(ctx.chat.id, userId); // чтобы мог оплатить
  // }
  // }

  @Start()
  async start(@Ctx() ctx: UserTelegrafContextWithUserMongo) {
    // console.log(ctx.app);
    // console.log(ctx.user);
    await ctx.deleteMessage();
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
    if (ctx.user.isSubscribed || ctx.user.status === 'old') {
      await this.botService.listProductsForOldUsers(
        ctx.from.id,
        'Продление подписки Jumping Universe',
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
  async onPreCheckoutQuery(@Ctx() ctx: Context) {
    const update = ctx.update as UpdateTelegraf.PreCheckoutQueryUpdate;
    console.log(update.pre_checkout_query);
    console.log('pre_checkout_query');
    const total_amount = update.pre_checkout_query.total_amount;
    const payload = update.pre_checkout_query.invoice_payload.split('|');
    await this.userService.successfulPayment(
      Number(payload[0]),
      total_amount,
      payload[1],
      Number(payload[2]),
    );
    // await this.bot.telegram.answerPreCheckoutQuery(
    //   update.pre_checkout_query.id,
    //   true,
    // );
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

    if (
      text.startsWith('sethellotext ') &&
      ctx.from?.id === Number(this.config.get<number>('SUPERADMIN')!)
    ) {
      const helloText = text.replace('sethellotext ', '').trim();
      await this.appService.setHelloText(helloText);
      await ctx.reply('✅ Ready');
    }
    await ctx.deleteMessage();
  }

  @On('photo')
  async workWithPhoto(@Ctx() ctx: Context) {
    const message = ctx.message as Message.PhotoMessage;
    const caption = message.caption;
    const photos = message.photo;

    if (
      caption &&
      caption == 'sethellophoto' &&
      photos &&
      photos.length > 0 &&
      ctx.from?.id === Number(this.config.get<number>('SUPERADMIN')!)
    ) {
      const largestPhoto = photos[photos.length - 1];
      const fileId = largestPhoto.file_id;
      await this.appService.setHelloPhoto(fileId);
      await ctx.reply('✅ Ready');
    }
    await ctx.deleteMessage();
  }

  @Command('enter')
  commandPanel(@Ctx() ctx: Context) {
    console.log(ctx);
  }
}
