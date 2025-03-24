import { Configuration, App } from '@midwayjs/core';
import { join } from 'path';
import * as web from '@midwayjs/web';

@Configuration({
  imports: [web],
  importConfigs: [join(__dirname, './config/')],
})
export class ContainerConfiguration {
  @App()
  app: web.MidwayWebApplication;

  async onReady() {
    console.log('Midway SSH Server starting...');
  }
}
