import {
  Inject,
  Controller,
  Post,
  Body,
  Config,
  Provide,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { SSHService } from '../service/ssh.service';

@Provide()
@Controller('/SOSNodeServer')
export class SSHController {
  @Inject()
  ctx: Context;

  @Inject()
  sshService: SSHService;

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
      this.ctx.body = { error: 'SSH 连接缺少必要的参数' };
      return;
    }

    const sshConnection = this.sshService.getConnection(authToken);

    try {
      if (!sshConnection.isConnected) {
        const result = await sshConnection.connect(host, username, password);
        this.ctx.body = { message: result };
      } else {
        this.ctx.body = { message: 'SSH 连接已存在' };
      }
    } catch (err) {
      this.ctx.status = 500;
      this.ctx.body = { error: `连接失败: ${err.message || err}` };
    }
  }

  @Post('/close-ssh2', { middleware: ['authMiddleware'] })
  async close() {
    const authToken = this.ctx.get('authorization');
    const sshConnection = this.sshService.getConnection(authToken);

    try {
      const message = sshConnection.close();
      this.ctx.body = { message };
    } catch (err) {
      this.ctx.status = 500;
      this.ctx.body = { error: `关闭 SSH 连接失败: ${err.message || err}` };
    }
  }

  @Post('/check-dir', { middleware: ['authMiddleware'] })
  async checkDir(@Body() body: { dirPath: string }) {
    const { dirPath } = body;
    if (!dirPath) {
      this.ctx.status = 400;
      this.ctx.body = { error: '目录路径不能为空' };
      return;
    }

    const authToken = this.ctx.get('authorization');
    const sshConnection = this.sshService.getConnection(authToken);

    try {
      const exists = await sshConnection.checkDirectoryExists(dirPath);
      this.ctx.body = { exists };
    } catch (err) {
      this.ctx.status = 500;
      this.ctx.body = { error: `检查目录失败: ${err.message || err}` };
    }
  }

  @Post('/run-persistent-command', { middleware: ['authMiddleware'] })
  async runPersistentCommand(@Body() body: { command: string }) {
    const { command } = body;
    if (!command) {
      this.ctx.status = 400;
      this.ctx.body = { error: '命令不能为空' };
      return;
    }

    const authToken = this.ctx.get('authorization');
    const sshConnection = this.sshService.getConnection(authToken);

    try {
      const result = await sshConnection.runPersistentCommand(command);
      this.ctx.body = { output: result };
    } catch (err) {
      this.ctx.status = 500;
      this.ctx.body = { error: `执行命令失败: ${err.message || err}` };
    }
  }
}
