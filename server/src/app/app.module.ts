import { Global, Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BotModule } from 'src/bot/bot.module';
import { UserModule } from 'src/user/user.module';
import { AppSchema } from './app.schema';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.dev', '.env'],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_TOKEN', { infer: true })!,
      }),
    }),
    MongooseModule.forFeature([{ name: 'App', schema: AppSchema }]),
    BotModule,
    UserModule,
  ],
  controllers: [],
  providers: [AppService],
  exports: [AppService],
})
export class AppModule {}
