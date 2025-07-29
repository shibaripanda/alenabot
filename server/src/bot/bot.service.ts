import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { AppService } from 'src/app/app.service';
import { Telegraf } from 'telegraf';

@Injectable()
export class BotService {
  constructor(
    @InjectBot() private bot: Telegraf,
    private readonly config: ConfigService,
    private appService: AppService,
  ) {}

  async invoice(userId: number, service: string, price: number) {
    await this.bot.telegram.sendInvoice(userId, {
      title: service,
      description: 'Это описание услуги',
      payload: userId.toString(),
      provider_token: this.config.get<string>('ALFA_TOKEN')!,
      currency: 'BYN',
      prices: [{ label: service, amount: price }],
      start_parameter: 'test-start',
      send_email_to_provider: true,
      need_email: true,
    });
  }

  async setCountryForOrder(userId: number) {
    await this.bot.telegram.sendMessage(userId, 'Выбери', {
      parse_mode: 'HTML',
      protect_content: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Тренер Россия 150 byn',
              callback_data: 'invoice|Тренер Россия 150 byn|15000',
            },
          ],
          [
            {
              text: 'Тренер Беларусь 120 byn',
              callback_data: 'invoice|Тренер Беларусь 120 by|12000',
            },
          ],
          [
            {
              text: 'Тренер Казахстан 120 byn',
              callback_data: 'invoice|Тренер Казахстан 120 byn|12000',
            },
          ],
          [
            {
              text: 'Назад',
              callback_data: 'backToMainMenu',
            },
          ],
        ],
      },
    });
  }

  async startBotMessage(userId: number) {
    if (this.appService.appSettings) {
      if (this.appService.appSettings.startMessagePhoto) {
        await this.bot.telegram.sendPhoto(
          userId,
          this.appService.appSettings.startMessagePhoto,
          {
            caption: this.appService.appSettings.helloText,
            parse_mode: 'HTML',
            protect_content: true,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: 'Канал Jumping Universe',
                    callback_data: 'takeChannel',
                  },
                ],
                [{ text: 'Обучение online', callback_data: 'takeStudy' }],
              ],
            },
          },
        );
        return;
      }
      await this.bot.telegram.sendMessage(
        userId,
        this.appService.appSettings.helloText,
        {
          parse_mode: 'HTML',
          protect_content: true,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Канал Jumping Universe',
                  callback_data: 'takeChannel',
                },
              ],
              [
                {
                  text: 'Обучение online',
                  callback_data: 'takeStudy',
                },
              ],
            ],
          },
        },
      );
      return;
    }
    console.log('Start message nor work');
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

  async sendTextMessage(userId: number, text: string) {
    await this.bot.telegram.sendMessage(userId, text);
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

  async alertUserHaveAccess(userId: string) {
    await this.bot.telegram.sendMessage(
      Number(userId),
      'Выполнен вход в панель администратора',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Закрыть доступ', callback_data: 'closeAccess' }],
          ],
        },
      },
    );
  }

  private isTelegramError(
    error: any,
  ): error is { code: number; description: string } {
    return (
      typeof error === 'object' && 'code' in error && 'description' in error
    );
  }
}
