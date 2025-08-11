import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { AppDocument } from 'src/app/app.schema';
import { UserDocument } from 'src/user/user.schema';
import { Telegraf } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class BotMessageService {
  constructor(
    @InjectBot() private bot: Telegraf,
    private readonly config: ConfigService,
  ) {
    console.log('BotMessageService initialized');
  }

  async sendMessageinvoice(
    telegramId: number,
    service: string,
    description: string,
    price: number,
    payload: string,
    user: UserDocument,
    app: AppDocument,
  ) {
    await this.bot.telegram
      .sendInvoice(telegramId, {
        title: service,
        description: description,
        payload: payload,
        provider_token: this.config.get<string>('ALFA_TOKEN')!,
        currency: 'BYN',
        prices: [
          {
            label: service,
            amount: price,
          },
        ],
        start_parameter: 'pay-service',
        send_email_to_provider: true,
        need_email: true,
      })
      .catch((e) => {
        console.log(e);
        console.log('Ошибка sendMessageinvoice');
      });
    await this.bot.telegram
      .sendMessage(telegramId, 'Вернуться', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Назад', callback_data: 'takeChannel' }]],
        },
      })
      .then(async (res) => {
        await this.deleteOrEditOldMessage(
          telegramId,
          user.lastMessageId,
          app.startMessagePhoto,
        );
        user.lastMessageId = res.message_id;
        await user.save();
      })
      .catch((e) => {
        console.log(e);
        console.log('Ошибка sendMessageinvoice');
      });
  }

  async sendMessageToUserTextButtons(
    telegramId: number,
    text: string,
    buttons: InlineKeyboardButton[][],
    user: UserDocument,
    app: AppDocument,
  ) {
    // await this.bot.telegram.sendChatAction(telegramId, 'typing');
    await this.bot.telegram
      .sendMessage(telegramId, text, {
        reply_markup: {
          inline_keyboard: buttons,
        },
        parse_mode: 'HTML',
        protect_content: true,
      })
      .then(async (res) => {
        await this.deleteOrEditOldMessage(
          telegramId,
          user.lastMessageId,
          app.startMessagePhoto,
        );
        user.lastMessageId = res.message_id;
        await user.save();
      })
      .catch((e) => {
        console.log(e);
        console.log('Ошибка sendMessageToUserPhotoTextButtons');
      });
  }

  async sendMessageToUserPhotoTextButtons(
    telegramId: number,
    photo_file_id: string,
    text: string,
    buttons: InlineKeyboardButton[][],
    user: UserDocument,
    app: AppDocument,
  ) {
    await this.bot.telegram
      .sendPhoto(telegramId, photo_file_id, {
        caption: text,
        reply_markup: {
          inline_keyboard: buttons,
        },
        parse_mode: 'HTML',
        protect_content: true,
      })
      .then(async (res) => {
        if (user.lastMessageId) {
          await this.deleteOrEditOldMessage(
            telegramId,
            user.lastMessageId,
            app.startMessagePhoto,
          );
        }
        user.lastMessageId = res.message_id;
        await user.save();
      })
      .catch((e) => {
        console.log(e);
        console.log('Ошибка sendMessageToUserPhotoTextButtons');
      });
  }

  async deleteOrEditOldMessage(
    telegramId: number,
    message_id: number,
    fileIdForPhoto?: string,
  ) {
    try {
      await this.bot.telegram.deleteMessage(telegramId, message_id);
      console.log(`Message ${message_id} deleted successfully`);
    } catch (deleteError) {
      console.log(`Delete failed: ${deleteError}`);

      try {
        // Пробуем заменить на пустой текст и убрать клавиатуру
        await this.bot.telegram.editMessageText(
          telegramId,
          message_id,
          undefined,
          '',
        );
        await this.bot.telegram.editMessageReplyMarkup(
          telegramId,
          message_id,
          undefined,
          undefined,
        );
        console.log(`Message ${message_id} cleaned by editing text and markup`);
      } catch (editError) {
        console.log(`Edit message text failed: ${editError}`);

        if (fileIdForPhoto) {
          try {
            await this.bot.telegram.editMessageMedia(
              telegramId,
              message_id,
              undefined,
              {
                type: 'photo',
                media: fileIdForPhoto,
                caption: '',
              },
            );
            await this.bot.telegram.editMessageReplyMarkup(
              telegramId,
              message_id,
              undefined,
              undefined,
            );
            console.log(`Message ${message_id} cleaned by editing media`);
          } catch (mediaError) {
            console.log(`Edit message media failed: ${mediaError}`);
          }
        }
      }
    }
  }
}
