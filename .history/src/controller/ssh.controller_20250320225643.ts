// src/controller/ssh.controller.ts
import { Inject, Controller, Get, Post, Body, Config } from "@midwayjs/core";
import { SSHService } from "../service/ssh.service";
import { SSHConfig, CommandRequest, DirRequest } from "../interface";

@Controller("/SOSNodeServer/api")
export class HomeController {
  @Get("/")
  async home() {
    return "Hello Midwayjs!";
  }
}

@Controller("${prefix}") // 使用配置中的 prefix
export class SSHController {
  @Inject()
  sshService: SSHService;

  @Config() // 获取全部配置
  config: {
    prefix: string;
    port: number;
    ssh: {
      defaultPort: number;
      keepaliveInterval: number;
      keepaliveCountMax: number;
    };
  };

  @Post("/ssh2")
  async connectSSH(@Body() config: SSHConfig) {
    try {
      // 使用配置中的默认 SSH 参数
      const sshConfig = {
        port: this.config.ssh.defaultPort,
        ...config,
      };
      const result = await this.sshService.connectSSH(sshConfig);
      return { output: result };
    } catch (err) {
      throw new Error(String(err));
    }
  }

  @Post("/close-ssh2")
  async closeSSH() {
    try {
      const result = this.sshService.closeSSH();
      return { output: result };
    } catch (err) {
      throw new Error(String(err));
    }
  }

  @Post("/check-dir")
  async checkDirectory(@Body() dir: DirRequest) {
    if (!dir.dirPath) throw new Error("目录路径不能为空");
    const exists = await this.sshService.checkDirectoryExists(dir.dirPath);
    return { exists };
  }

  @Post("/create-dir")
  async createDirectory(@Body() dir: DirRequest) {
    if (!dir.dirPath) throw new Error("目录路径不能为空");
    const result = await this.sshService.createDirectory(dir.dirPath);
    return {
      success: result.success,
      output: result.success ? `目录创建成功：${dir.dirPath}` : "目录创建失败",
    };
  }

  @Post("/run-command")
  async runCommand(@Body() cmd: CommandRequest) {
    if (!cmd.command) throw new Error("无命令信息");
    const result = await this.sshService.runCommand(cmd.command);
    return result;
  }

  @Post("/run-persistent-command")
  async runPersistentCommand(@Body() cmd: CommandRequest) {
    if (!cmd.command) throw new Error("命令不能为空");
    const result = await this.sshService.runPersistentCommand(cmd.command);
    return { output: result };
  }
}
