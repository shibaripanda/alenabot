import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { BotService } from './bot.service';
import * as path from 'path';
import * as fs from 'node:fs/promises';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private readonly botService: BotService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_11AM)
  // @Cron(CronExpression.EVERY_30_SECONDS)
  async dailyBackup() {
    const adminChatId = this.config.get<number>('MANAGER_GROUP')!;
    await this.backupMongoAndSendTelegram(adminChatId);
  }

  async backupMongoAndSendTelegram(chatId: number) {
    try {
      const backupDir = path.join(__dirname, '..', 'backups');

      // Создаём папку рекурсивно
      await fs.mkdir(backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `backup-${timestamp}.gz`);

      const mongoUri = this.config.get<string>('MONGO_TOKEN')!;

      await execAsync(
        `mongodump --uri="${mongoUri}" --archive="${backupFile}" --gzip`,
      );

      this.logger.log(`Backup создан: ${backupFile}`);

      await this.botService.sendDocument(chatId, backupFile, {
        caption: `Бекап базы данных на ${new Date().toLocaleString()}`,
      });

      // Удаляем файл асинхронно
      await fs.unlink(backupFile);
      this.logger.log(`Временный файл удален: ${backupFile}`);
    } catch (err) {
      this.logger.error('Ошибка при бекапе MongoDB', err);
    }
  }
}
