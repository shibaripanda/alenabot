import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { BotMessageService } from './bot.message';
import { AppDocument } from 'src/app/app.schema';
import { UserDocument } from 'src/user/user.schema';

@Injectable()
export class BotService {
  constructor(
    @InjectBot() private bot: Telegraf,
    private readonly config: ConfigService,
    private botMessageService: BotMessageService,
  ) {
    console.log('BotService initialized');
  }

  priceList = [
    {
      id: 'service1',
      product: '🇷🇺 Тренер Россия 150 ',
      description: 'Jumping Universe',
      price: 15000,
      currency: 'BYN',
    },
    {
      id: 'service2',
      product: '🇧🇾 Тренер Беларусь 120',
      description: 'Jumping Universe',
      price: 12000,
      currency: 'BYN',
    },
    {
      id: 'service3',
      product: '🇰🇿 Тренер Казахстан 120',
      description: 'Jumping Universe',
      price: 12000,
      currency: 'BYN',
    },
  ];
  priceListLong = [
    {
      long: 1,
      price: [
        {
          id: 'service4',
          product: '🇷🇺 Тренер Россия 95',
          description: 'Jumping Universe',
          price: 9500,
          currency: 'BYN',
        },
        {
          id: 'service5',
          product: '🇧🇾 Тренер Беларусь 70',
          description: 'Jumping Universe',
          price: 7000,
          currency: 'BYN',
        },
        {
          id: 'service6',
          product: '🇰🇿 Тренер Казахстан 70',
          description: 'Jumping Universe',
          price: 7000,
          currency: 'BYN',
        },
      ],
    },
    {
      long: 3,
      price: [
        {
          id: 'service7',
          product: '🇷🇺 Тренер Россия 260',
          description: 'Jumping Universe',
          price: 26000,
          currency: 'BYN',
        },
        {
          id: 'service8',
          product: '🇧🇾 Тренер Беларусь 195',
          description: 'Jumping Universe',
          price: 19500,
          currency: 'BYN',
        },
        {
          id: 'service9',
          product: '🇰🇿 Тренер Казахстан 195',
          description: 'Jumping Universe',
          price: 19500,
          currency: 'BYN',
        },
      ],
    },
    {
      long: 6,
      price: [
        {
          id: 'service10',
          product: '🇷🇺 Тренер Россия 480',
          description: 'Jumping Universe',
          price: 48000,
          currency: 'BYN',
        },
        {
          id: 'service11',
          product: '🇧🇾 Тренер Беларусь 370',
          description: 'Jumping Universe',
          price: 37000,
          currency: 'BYN',
        },
        {
          id: 'service12',
          product: '🇰🇿 Тренер Казахстан 370',
          description: 'Jumping Universe',
          price: 37000,
          currency: 'BYN',
        },
      ],
    },
  ];

  async invoice(
    userId: number,
    productId: string,
    user: UserDocument,
    app: AppDocument,
  ) {
    const list = this.priceList.concat(
      this.priceListLong.map((l) => l.price).flat(),
    );
    const product = list.find((p) => p.id === productId)!;
    await this.botMessageService.sendMessageinvoice(
      userId,
      product.product,
      product.description,
      product.price,
      `${userId}|${product.id}|${Date.now()}`,
      user,
      app,
    );
  }

  async listProductsLong(
    userId: number,
    long: number,
    user: UserDocument,
    app: AppDocument,
  ) {
    const text = 'Выбирай';
    const buttons = [
      ...this.priceListLong
        .find((l) => l.long === long)!
        .price.map((prod) => [
          {
            text: `${prod.product} ${prod.currency}`,
            callback_data: `invoice|${prod.id}`,
          },
        ]),
    ];
    buttons.push([
      {
        text: 'Назад',
        callback_data: 'takeChannelLong',
      },
    ]);
    await this.botMessageService.sendMessageToUserTextButtons(
      userId,
      text,
      buttons,
      user,
      app,
    );
  }

  async listProductsForOldUsers(
    telegramId: number,
    text: string,
    user: UserDocument,
    app: AppDocument,
  ) {
    const endText = (index: number) => {
      if (index === 1) return 'месяц 🚀';
      if (index === 3) return 'месяца 🚀🚀🚀';
      if (index === 6) return 'месяцев 🚀🚀🚀🚀🚀🚀';
    };
    const buttons = [
      ...this.priceListLong.map((prod) => [
        {
          text: `Подписка на ${prod.long} ${endText(prod.long)}`,
          callback_data: `long|${prod.long}`,
        },
      ]),
    ];
    buttons.push([
      {
        text: 'Назад',
        callback_data: 'backToMainMenu',
      },
    ]);
    await this.botMessageService.sendMessageToUserTextButtons(
      telegramId,
      text,
      buttons,
      user,
      app,
    );
  }

  async listProducts(telegramId: number, user: UserDocument, app: AppDocument) {
    const text = 'Выбирай';
    const buttons = [
      ...this.priceList.map((prod) => [
        {
          text: `${prod.product} ${prod.currency}`,
          callback_data: `invoice|${prod.id}`,
        },
      ]),
    ];
    buttons.push([
      {
        text: 'Назад',
        callback_data: 'backToMainMenu',
      },
    ]);
    await this.botMessageService.sendMessageToUserTextButtons(
      telegramId,
      text,
      buttons,
      user,
      app,
    );
  }

  async startBotMessage(userId: number, user: UserDocument, app: AppDocument) {
    const photo = app.startMessagePhoto;
    const text = app.helloText;
    const buttons = [
      [
        {
          text: 'Канал Jumping Universe',
          callback_data: 'takeChannel',
        },
      ],
      [{ text: 'Обучение online', callback_data: 'takeStudy' }],
    ];

    await this.botMessageService.sendMessageToUserPhotoTextButtons(
      userId,
      photo,
      text,
      buttons,
      user,
      app,
    );
  }

  async isUserActive(userId: number): Promise<boolean> {
    try {
      await this.bot.telegram.sendChatAction(userId, 'typing');
      return true;
    } catch (error: any) {
      if (this.isTelegramError(error)) {
        if (error.code === 403 || error.code === 400) {
          console.warn(
            `Пользователь ${userId} недоступен: ${error.description}`,
          );
          return false;
        }
      }

      console.error(`Ошибка при проверке пользователя ${userId}:`, error);
      return false;
    }
  }

  async isUserMember(userId: number, chatId: string): Promise<boolean> {
    try {
      const res = await this.bot.telegram.getChatMember(chatId, userId);
      const status = res.status;
      return status !== 'left' && status !== 'kicked';
    } catch (error) {
      console.error('Ошибка проверки участника:', error);
      return false;
    }
  }

  async sendOneTimeInvite(userId: number) {
    const chatId = this.config.get<string>('ID_CHANNEL')!;
    const time = Number(this.config.get<string>('TIME_LIFE_LINK')!);
    const expireDate = (Math.floor(Date.now() / 1000) + 3600) * time;
    const inviteLink = await this.bot.telegram.createChatInviteLink(chatId, {
      member_limit: 1,
      expire_date: expireDate,
      name: `Invite for user ${userId}`,
    });
    await this.bot.telegram.sendMessage(
      userId,
      `Ваша персональная ссылка для вступления в канал (действует следующее количество часов: ${time}):\n${inviteLink.invite_link}`,
    );
  }

  async removeAndUnbanUser(telegramId: number) {
    try {
      const chat = this.config.get<string>('ID_CHANNEL')!;
      await this.bot.telegram.banChatMember(chat, telegramId);
      await this.bot.telegram.unbanChatMember(chat, telegramId);
      return true;
    } catch (er) {
      console.log(er);
      return false;
    }
  }

  private isTelegramError(
    error: any,
  ): error is { code: number; description: string } {
    return (
      typeof error === 'object' && 'code' in error && 'description' in error
    );
  }
}
