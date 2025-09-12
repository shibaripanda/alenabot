import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { AppDocument } from 'src/app/app.schema';
import { UserDocument } from 'src/user/user.schema';
import { Telegraf } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { BotManagerNotificationService } from './bot.managerNotification';

@Injectable()
export class BotMessageService {
  constructor(
    @InjectBot() private bot: Telegraf,
    private readonly config: ConfigService,
    private botManagerNotificationService: BotManagerNotificationService,
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
    // const payloadObject = {
    //   providerToken: this.config.get<string>('ALFA_TOKEN')!,
    // };

    // Преобразуем объект в строку JSON
    // const payloadString = JSON.stringify(payloadObject);
    await this.bot.telegram
      .sendInvoice(telegramId, {
        // chat_id, // Уникальный идентификатор целевого чата или имя пользователя целевого канала
        provider_token: this.config.get<string>('ALFA_TOKEN')!,
        // photo_url: 'https://via.placeholder.com/400',
        // photo_width: 200,
        // photo_height: 200,
        start_parameter: 'get_access', // Уникальный параметр глубинных ссылок. Если оставить поле пустым, переадресованные копии отправленного сообщения будут иметь кнопку «Оплатить», позволяющую нескольким пользователям производить оплату непосредственно из пересылаемого сообщения, используя один и тот же счет. Если не пусто, перенаправленные копии отправленного сообщения будут иметь кнопку URL с глубокой ссылкой на бота (вместо кнопки оплаты) со значением, используемым в качестве начального параметра.
        title: service,
        description: description,
        currency: 'BYN',
        prices: [{ label: service, amount: price }],
        //max_tip_amount: 1300,
        //suggested_tip_amounts: [222, 444, 888],
        payload: payload, //payloadString,
        need_email: true,

        // title: service,
        // description: description,
        // payload: payloadString,
        // provider_token: this.config.get<string>('ALFA_TOKEN')!,
        // currency: 'BYN',
        // prices: [
        //   {
        //     label: service,
        //     amount: price,
        //   },
        // ],
        // provider_data: JSON.stringify({
        //   providerToken: this.config.get<string>('ALFA_TOKEN')!,
        // }),
        // start_parameter: 'pay-service',
        // send_email_to_provider: true,
        // need_email: true,
      })
      .then(async (res) => {
        if (user.lastInvoiceMessageId) {
          await this.deleteOrEditOldMessage(
            telegramId,
            user.lastInvoiceMessageId,
            app.startMessagePhoto,
          );
        }
        user.lastInvoiceMessageId = res.message_id;
        await user.save();
        await this.botManagerNotificationService.simpleNotification(
          user,
          `Получил инвойс:\n${service}\n${price / 100}`,
        );
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
  ): Promise<boolean> {
    try {
      const res = await this.bot.telegram.sendMessage(telegramId, text, {
        reply_markup: { inline_keyboard: buttons },
        parse_mode: 'HTML',
        protect_content: true,
      });

      await this.deleteOrEditOldMessage(
        telegramId,
        user.lastMessageId,
        app.startMessagePhoto,
      );
      await this.deleteOrEditOldMessage(
        telegramId,
        user.lastInvoiceMessageId,
        app.startMessagePhoto,
      );
      user.lastMessageId = res.message_id;
      await user.save();

      return true; // успешная отправка
    } catch (e) {
      console.error('Ошибка sendMessageToUserTextButtons', e);
      return false; // ошибка отправки
    }
  }

  // async sendMessageToUserTextButtons(
  //   telegramId: number,
  //   text: string,
  //   buttons: InlineKeyboardButton[][],
  //   user: UserDocument,
  //   app: AppDocument,
  // ) {
  //   await this.bot.telegram
  //     .sendMessage(telegramId, text, {
  //       reply_markup: {
  //         inline_keyboard: buttons,
  //       },
  //       parse_mode: 'HTML',
  //       protect_content: true,
  //     })
  //     .then(async (res) => {
  //       await this.deleteOrEditOldMessage(
  //         telegramId,
  //         user.lastMessageId,
  //         app.startMessagePhoto,
  //       );
  //       user.lastMessageId = res.message_id;
  //       await user.save();
  //     })
  //     .catch((e) => {
  //       console.log(e);
  //       console.log('Ошибка sendMessageToUserPhotoTextButtons');
  //     });
  // }

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
          await this.deleteOrEditOldMessage(
            telegramId,
            user.lastInvoiceMessageId,
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
          } catch (mediaError) {
            console.log(`Edit message media failed: ${mediaError}`);
          }
        }
      }
    }
  }
}
