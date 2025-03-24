import { Configuration, App } from '@midwayjs/core';
import { join } from 'path';
import * as koa from '@midwayjs/koa';

@Configuration({
  imports: [koa],
  importConfigs: [join(__dirname, './config/')],
})
export class ContainerConfiguration {
  @App()
  app: koa.IMidwayKoaApplication;

  async onReady() {
    console.log('Midway SSH Server (Koa) starting...');

    // Add Koa-specific middleware if needed
    this.app.use(async (ctx, next) => {
      // Custom Koa middleware
      await next();
    });
  }
}
