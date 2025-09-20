import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop()
  total_amount: number;

  @Prop()
  service: string;

  @Prop()
  email: string;

  @Prop()
  telegram_payment_charge_id: string;

  @Prop()
  provider_payment_charge_id: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
