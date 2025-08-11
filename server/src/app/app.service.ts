import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AppDocument } from './app.schema';
import { Model } from 'mongoose';

@Injectable()
export class AppService {
  constructor(@InjectModel('App') private appMongo: Model<AppDocument>) {
    console.log('AppService initialized');
  }

  async onModuleInit() {
    await this.appMongo.findOneAndUpdate(
      { appSettings: 'alenabot' },
      { $setOnInsert: { appSettings: 'alenabot' } },
      { upsert: true },
    );
  }

  async getAppSettings(): Promise<AppDocument | null> {
    return await this.appMongo.findOne({ appSettings: 'alenabot' });
  }

  async setHelloText(text: string) {
    await this.appMongo.updateOne(
      { appSettings: 'alenabot' },
      { helloText: text },
    );
  }

  async setHelloPhoto(photoId: string) {
    await this.appMongo.updateOne(
      { appSettings: 'alenabot' },
      { startMessagePhoto: photoId },
    );
  }
}
