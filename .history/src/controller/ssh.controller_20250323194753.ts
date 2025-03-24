import {
  Inject,
  Controller,
  Post,
  Body,
  Config,
  Provide,
} from '@midwayjs/core';
import { Context } from '@midwayjs/web';
import { SSHService } from '../service/ssh.service';

@Provide()
@Controller('${prefix}')
export class SSHController {
  @Inject()
  ctx: Context;

  @Config('prefix')
  prefix: string;

  @Post('/ssh2')
  async connect(
    @Body() body: { host: string; username: string; password: string }
  ) {
    const { host, username, password } = body;
    const authToken = this.ctx.get('authorization');

    if (!host || !username || !password) {
      this.ctx.status = 400;
      return { error: 'ssh2连接缺少必要的参数' };
    }

    const sshService = await this.ctx.requestContext.getAsync(SSHService);
    const sshConnection = sshService.getConnection(authToken);

    try {
      const result = await sshConnection.connect(host, username, password);
      return { output: result };
    } catch (err) {
      this.ctx.status = 500;
      return { error: String(err) };
    }
  }

  @Post('/close-ssh2', { middleware: ['authMiddleware'] })
  async close() {
    return { output: this.ctx.sshConnection.close() };
  }

  @Post('/check-dir', { middleware: ['authMiddleware'] })
  async checkDir(@Body() body: { dirPath: string }) {
    const { dirPath } = body;
    if (!dirPath) {
      this.ctx.status = 400;
      return { error: '目录路径不能为空' };
    }

    try {
      const exists = await this.ctx.sshConnection.checkDirectoryExists(dirPath);
      return { exists };
    } catch (err) {
      this.ctx.status = 500;
      return { error: String(err) };
    }
  }

  @Post('/run-persistent-command', { middleware: ['authMiddleware'] })
  async runPersistentCommand(@Body() body: { command: string }) {
    const { command } = body;
    if (!command) {
      this.ctx.status = 400;
      return { error: '命令不能为空' };
    }

    try {
      const result = await this.ctx.sshConnection.runPersistentCommand(command);
      return { output: result };
    } catch (err) {
      this.ctx.status = 500;
      return { error: String(err) };
    }
  }
}
