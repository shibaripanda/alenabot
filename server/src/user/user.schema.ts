import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export type StatusUser = 'old' | 'new' | 'free';

@Schema({ timestamps: true })
export class User {
  @Prop({ unique: true })
  telegramId: number;

  @Prop()
  username: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  lastMessageId: number;

  @Prop({ default: 'new' })
  status: StatusUser;

  @Prop({ default: false })
  isSubscribed: boolean;

  @Prop()
  subscriptionExpiresAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
