import * as mongoose from 'mongoose';

export const AppSchema = new mongoose.Schema(
  {
    link: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

export interface App {
  link?: string;
  name?: string;
}

export type AppDocument = App & mongoose.Document;
