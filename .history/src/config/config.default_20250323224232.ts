import { MidwayConfig } from '@midwayjs/core';

export default {
  // use for cookie sign key, should change to your own and keep security
  keys: '1742487732607_4551',
  koa: {
    port: 7001,
  },
  ssh: {
    defaultPort: 22,
    keepaliveInterval: 10000,
    keepaliveCountMax: 3,
  },
} as MidwayConfig;
