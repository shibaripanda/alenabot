import * as mongoose from 'mongoose';

interface Payment {
  status: boolean;
  amount: number;
  date: Date;
  info: string;
  id: string;
}

type StatusUser = 'paid' | 'not paid' | 'free';

export const UserSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      require: true,
      unique: true,
    },
    first_name: {
      type: String,
      require: true,
      default: 'not set',
    },
    username: {
      type: String,
      require: true,
      default: 'not set',
    },
    language_code: {
      type: String,
      require: true,
      default: 'not set',
    },
    payments: {
      type: Array,
      require: true,
      default: [],
    },
    paidStatus: {
      type: String,
      require: true,
      default: 'not paid',
    },
  },
  { timestamps: true },
);

export interface User {
  id: number;
  first_name?: string;
  username?: string;
  language_code?: string;
  payments?: Payment[];
  paidStatus?: StatusUser;
}

export type UserDocument = User & mongoose.Document;
