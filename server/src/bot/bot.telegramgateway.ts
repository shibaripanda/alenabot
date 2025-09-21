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
import { UseGuards } from '@nestjs/common';
import { AdminGuardAccess } from './guards/access-control.guard';

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
    this.bot.use(async (ctx, next) => {
      console.log(ctx.chat?.id);
      // console.log('Update received:', JSON.stringify(ctx.update, null, 2));
      await next();
    });
  }

  @Start()
  async start(@Ctx() ctx: UserTelegrafContextWithUserMongo) {
    await ctx.deleteMessage();
    await this.botService.startBotMessage(ctx.from.id, ctx.user, ctx.app);
  }

  @On('new_chat_members')
  async onNewChatMember(
    @Ctx() ctx: NarrowedContext<Context, UpdateTelegraf.ChatMemberUpdate>,
  ) {
    const members = (ctx.message as unknown as Message.NewChatMembersMessage)
      .new_chat_members;
    for (const member of members) {
      const user = await this.userService.createOrUpdateUser(member);
      if (user) {
        await this.botService.newUserInGroup(user);
        console.log(
          `Новый пользователь: ${member.first_name} (id: ${member.id})`,
        );
      }
    }
  }

  @On('left_chat_member')
  async onLeftChatMember(
    @Ctx() ctx: NarrowedContext<Context, UpdateTelegraf.ChatMemberUpdate>,
  ) {
    const member = (ctx.message as unknown as Message.LeftChatMemberMessage)
      .left_chat_member;
    const user = await this.userService.createOrUpdateUser(member);
    if (user) {
      await this.botService.leftUserInGroup(user);
      console.log(
        `Пользователь вышел: ${member.first_name} (id: ${member.id})`,
      );
    }
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
      let text = `<b>Продление подписки Jumping Universe</b>`;
      const now = new Date();
      if (
        ctx.user.subscriptionExpiresAt &&
        ctx.user.subscriptionExpiresAt >= now
      ) {
        text =
          text +
          '\nВы подписаны до: ' +
          ctx.user.subscriptionExpiresAt.toLocaleDateString();
      }
      await this.botService.listProductsForOldUsers(
        ctx.from.id,
        text,
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
    let text = '<b>Продление подписки Jumping Universe</b>';
    const now = new Date();
    if (
      ctx.user.subscriptionExpiresAt &&
      ctx.user.subscriptionExpiresAt >= now
    ) {
      text =
        text +
        '\nВы подписаны до: ' +
        ctx.user.subscriptionExpiresAt.toLocaleDateString();
    }
    await this.botService.listProductsForOldUsers(
      ctx.from.id,
      text,
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

      console.log(payment);

      const total_amount = payment.total_amount;
      const payload = payment.invoice_payload.split('|');
      const serviceName = this.botService.priceList.find(
        (s) => s.id === payload[1],
      );
      await this.userService.successfulPayment(
        Number(payload[0]),
        total_amount,
        serviceName?.product + ' ' + serviceName?.description,
        Number(payload[2]),
        payment.provider_payment_charge_id,
        payment.telegram_payment_charge_id,
        payment.order_info?.email ? payment.order_info?.email : '',
      );
    } else {
      console.warn('Update не содержит успешной оплаты');
    }
  }

  @On('pre_checkout_query')
  async onPreCheckoutQuery(@Ctx() ctx: Context) {
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

  @UseGuards(AdminGuardAccess)
  @Action('moneyBook')
  async moneyBook(@Ctx() ctx: UserTelegrafContextWithUserMongo) {
    await this.userService.moneyBook(30);
    console.log('moneyBook');
    await ctx.answerCbQuery();
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

  @UseGuards(AdminGuardAccess)
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
    if (
      text.startsWith('Money ') &&
      ctx.from?.id === Number(this.config.get<number>('SUPERADMIN')!)
    ) {
      const days = text.split(' ')[1];
      console.log(days);
      await this.userService.moneyBook(Number(days));
      // await ctx.reply('✅ Ready');
    }
    await ctx.deleteMessage();
  }

  @UseGuards(AdminGuardAccess)
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

  @UseGuards(AdminGuardAccess)
  @Command('enter')
  commandPanel(@Ctx() ctx: Context) {
    console.log(ctx);
  }
}
