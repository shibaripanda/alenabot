import { Injectable } from '@nestjs/common';
// import { TokenData } from './interfaces/tokenData';
// import { v4 as uuidv4 } from 'uuid';
// import { ConfigService } from '@nestjs/config';
// import { JwtService } from '@nestjs/jwt';
// import { TokenAndUserId } from './interfaces/tokenAndUserId';
import { InjectModel } from '@nestjs/mongoose';
import { AppDocument } from './app.model';
import { Model } from 'mongoose';

@Injectable()
export class AppService {
  // private tokens = new Map<string, TokenData>();

  constructor(
    // private readonly config: ConfigService,
    // private jwt: JwtService,
    @InjectModel('App') private appMongo: Model<AppDocument>,
  ) {
    console.log('AppService initialized');
  }
  appSettings: AppDocument | null;

  async onModuleInit() {
    await this.appMongo.findOneAndUpdate(
      { appSettings: 'alenabot' },
      { $setOnInsert: { appSettings: 'alenabot' } },
      { upsert: true },
    );

    this.appSettings = await this.appMongo.findOne({ appSettings: 'alenabot' });
    console.log(this.appSettings);
  }

  async setHelloText(text: string) {
    if (!this.appSettings) {
      throw new Error('appSettings not initialized');
    }
    this.appSettings.helloText = text;
    await this.appSettings.save();
  }

  async setHelloPhoto(photoId: string) {
    if (!this.appSettings) {
      throw new Error('appSettings not initialized');
    }
    this.appSettings.startMessagePhoto = photoId;
    await this.appSettings.save();
  }

  // getAuthLink(userId: number): string {
  //   const token = this.generateToken(String(userId));
  //   return `${this.config.get<string>('WEB_URL')}/?token=${token}`;
  // }

  // generateToken(userId: string): string {
  //   const token: string = uuidv4();
  //   const expiresAt = Date.now() + 10 * 60 * 1000; // 10 минут
  //   this.tokens.set(token, { userId, used: false, expiresAt });
  //   console.log(this.tokens);
  //   return token;
  // }

  // async validateToken(token: string): Promise<TokenAndUserId | null> {
  //   console.log(this.tokens);
  //   console.log(token);
  //   const data: TokenData | undefined = this.tokens.get(token);
  //   if (!data || data.used || data.expiresAt < Date.now()) return null;

  //   data.used = true;
  //   this.tokens.set(token, data);
  //   return {
  //     token: await this.jwt.signAsync({ userId: data.userId }),
  //     userId: data.userId,
  //   };
  // }
}
