import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram/tl/index.js';
import input from 'input'; // npm install input

// ⚠️ Получи эти данные в https://my.telegram.org
const apiId = 123456;
const apiHash = 'your_api_hash';

// Можно оставить пустым — для первой авторизации будет запрос кода
const stringSession = new StringSession('');

(async () => {
  console.log('Авторизация...');
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text('Введи номер телефона: '),
    password: async () => await input.text('Введи 2FA пароль (если включён): '),
    phoneCode: async () => await input.text('Введи код из Telegram: '),
    onError: (err) => console.log(err),
  });

  console.log('String session:', client.session.save()); // сохрани и используй повторно

  // 👇 сюда вставь username или id приватного канала
  const channel = await client.getEntity('https://t.me/c/XXXXXXXXX');

  const allMembers = [];
  let offset = 0;

  while (true) {
    const result = await client.invoke(
      new Api.channels.GetParticipants({
        channel,
        filter: new Api.ChannelParticipantsRecent(),
        offset,
        limit: 100, // максимум за один вызов
        hash: 0,
      }),
    );

    if (!result.users.length) break;

    for (const user of result.users) {
      allMembers.push({
        telegramId: user.id.valueOf(),
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      });
    }

    offset += result.users.length;
  }

  console.log('Всего участников:', allMembers.length);
  console.log(allMembers);
})();
