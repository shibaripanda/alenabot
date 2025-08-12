import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './user.schema';
import { BotModule } from 'src/bot/bot.module';
import { TelegramService } from './telegram.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    forwardRef(() => BotModule),
  ],
  providers: [UserService, TelegramService],
  controllers: [],
  exports: [UserService, TelegramService],
})
export class UserModule {}
