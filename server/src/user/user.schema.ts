import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Payment, PaymentSchema } from './payment.schema';

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

  @Prop()
  lastInvoiceMessageId: number;

  @Prop({ default: 'new' })
  status: StatusUser;

  @Prop({ default: false })
  isSubscribed: boolean;

  @Prop()
  subscriptionExpiresAt: Date;

  @Prop({ default: false })
  notified72h: boolean;

  @Prop({ default: false })
  notified24h: boolean;

  @Prop({ type: [PaymentSchema], default: [] })
  payments: Payment[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ subscriptionExpiresAt: 1, status: 1 });
