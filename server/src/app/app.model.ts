import * as mongoose from 'mongoose';

type appSettings = 'alenabot';

export const AppSchema = new mongoose.Schema(
  {
    appSettings: {
      type: String,
      unique: true,
      require: true,
    },
    startMessagePhoto: {
      type: String,
      default: '',
    },
    helloText: {
      type: String,
      default: 'Hello text',
      require: true,
    },
  },
  { timestamps: true },
);

export interface App {
  appSettings: appSettings;
  startMessagePhoto: string;
  helloText: string;
}

export type AppDocument = App & mongoose.Document;
