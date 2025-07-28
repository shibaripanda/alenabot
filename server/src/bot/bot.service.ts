import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class BotService {
  constructor(
    @InjectBot() private bot: Telegraf,
    private readonly config: ConfigService,
  ) {}

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
