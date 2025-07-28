import { forwardRef, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BotModule } from 'src/bot/bot.module';
import { UserModule } from 'src/user/user.module';
import { AppGateway } from './app.gateway';
import { AppSchema } from './app.model';
import { JwtModule } from '@nestjs/jwt';
import { SocketAuthMiddleware } from './auth-guards/socket-auth.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.dev', '.env.prod'],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_TOKEN', { infer: true })!,
      }),
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('LIFI_TIME_TOKEN'),
        },
      }),
    }),
    MongooseModule.forFeature([{ name: 'App', schema: AppSchema }]),
    forwardRef(() => BotModule),
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppGateway, SocketAuthMiddleware],
  exports: [AppService],
})
export class AppModule {}
