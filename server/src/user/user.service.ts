import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.model';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private userMongo: Model<UserDocument>) {}

  async createUserOrUpdateUser(user: User) {
    const userRes = await this.userMongo.updateOne({ id: user.id }, user, {
      upsert: true,
    });
    console.log(userRes);
  }
}
