import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AppDocument = App & Document;

export type appSettings = 'alenabot';

@Schema({ timestamps: true })
export class App {
  @Prop({ required: true, unique: true })
  appSettings: appSettings;

  @Prop({ default: '' })
  startMessagePhoto: string;

  @Prop({ required: true, default: 'Добро пожаловать в бот SLEDI_ZAMNOI' })
  helloText: string;
}

export const AppSchema = SchemaFactory.createForClass(App);
