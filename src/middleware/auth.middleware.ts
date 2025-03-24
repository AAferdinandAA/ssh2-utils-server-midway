import { Middleware } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import { SSHService } from '../service/ssh.service';

@Middleware()
export class AuthMiddleware {
  async resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const authToken = ctx.get('authorization');
      if (!authToken) {
        ctx.status = 401;
        ctx.body = { error: '缺少Authorization头' };
        return;
      }

      const sshService = await ctx.requestContext.getAsync(SSHService);
      ctx.sshConnection = sshService.getConnection(authToken);
      await next();
    };
  }
}
