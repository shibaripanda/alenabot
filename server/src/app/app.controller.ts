import { Controller, ForbiddenException, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { BotService } from 'src/bot/bot.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private botService: BotService,
  ) {}

  // @Get()
  // handleToken1() {
  //   console.log('Test');
  // }

  @Get('access/:token')
  async checkToken(@Param('token') startToken: string) {
    const res = await this.appService.validateToken(startToken);
    if (!res) {
      console.log('Close');
      throw new ForbiddenException('Недействительный токен');
    }
    console.log('Open');
    await this.botService.alertUserHaveAccess(res.userId);
    return { token: res.token };
  }
}
