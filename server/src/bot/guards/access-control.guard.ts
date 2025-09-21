import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Context as TelegrafContext } from 'telegraf';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuardAccess implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const ctx = context.getArgByIndex<TelegrafContext>(0);
    const userId = ctx?.from?.id;

    if (!userId) return false;

    return userId === Number(this.config.get<number>('SUPERADMIN')!);
  }
}
