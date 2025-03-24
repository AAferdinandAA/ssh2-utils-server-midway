import { Provide, Scope, ScopeEnum } from "@midwayjs/core";
import { Client } from "ssh2"; // 导入 Client 作为类
import * as iconv from "iconv-lite";

interface SSHConfig {
  host: string;
  port?: number;
  username: string;
  password: string;
}

@Provide()
@Scope(ScopeEnum.Singleton)
export class SSHService {
  private conn: any; // 这里声明 conn 为 Client 类型
  private isSSHConnected = false;
  private isModuleLoaded = false;

  constructor() {
    this.conn = new Client(); // 实例化 Client 类
  }

  async connectSSH(config: SSHConfig): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.isSSHConnected) {
        return resolve("SSH连接已存在");
      }

      if (this.conn["_sock"] && this.conn["_sock"].destroyed) {
        this.isSSHConnected = false;
      }

      if (!this.isSSHConnected) {
        this.conn
          .on("ready", () => {
            this.isSSHConnected = true;
            resolve("ssh2连接成功");
          })
          .on("end", () => {
            this.isSSHConnected = false;
            resolve("ssh2连接关闭");
          })
          .on("error", (err: Error) => {
            // 显式声明 err 为 Error 类型
            this.isSSHConnected = false;
            reject(err.message);
          })
          .connect({
            host: config.host,
            port: config.port || 22,
            username: config.username,
            password: config.password,
            // keepaliveInterval: 10000,
            // keepaliveCountMax: 3,
          });
      } else {
        resolve("ssh2连接已经存在");
      }
    });
  }

  async runPersistentCommand(command: string): Promise<string> {
    if (!this.isSSHConnected) {
      throw new Error("未建立SSH连接");
    }

    return new Promise((resolve, reject) => {
      let result = "";
      this.conn.shell((err: Error, stream: any) => {
        // 显式声明 err 和 stream 类型
        if (err) {
          return reject("创建Shell会话失败: " + err.message);
        }

        stream
          .on("data", (data: Buffer) => {
            // 显式声明 data 类型为 Buffer
            result += data.toString();
          })
          .on("close", () => {
            resolve(result);
          });

        if (!this.isModuleLoaded) {
          stream.write("module load sos\n");
          this.isModuleLoaded = true;
        }
        stream.write(`${command}\n`);
        stream.write("exit\n");
      });
    });
  }

  async checkDirectoryExists(dirPath: string): Promise<boolean> {
    const command = `test -d ${dirPath} && echo "Exists" || echo "Not exists"`;
    return new Promise((resolve, reject) => {
      this.conn.exec(command, (err: Error, stream: any) => {
        // 显式声明 err 和 stream 类型
        if (err) reject(err.message);
        let output = "";
        stream
          .on("data", (data: Buffer) => {
            // 显式声明 data 类型为 Buffer
            output += data.toString().trim();
          })
          .on("close", () => {
            resolve(output === "Exists");
          });
      });
    });
  }

  async createDirectory(dirPath: string): Promise<{ success: boolean }> {
    const command = `mkdir -p ${dirPath}`;
    return new Promise((resolve, reject) => {
      this.conn.exec(command, (err: Error, stream: any) => {
        // 显式声明 err 和 stream 类型
        if (err) reject(err.message);
        stream.on("close", (code: number) => {
          // 显式声明 code 类型
          resolve({ success: code === 0 });
        });
      });
    });
  }

  async runCommand(
    command: string
  ): Promise<{ output: string; stderr: string; code: number }> {
    return new Promise((resolve, reject) => {
      this.conn.exec(command, (err: Error, stream: any) => {
        // 显式声明 err 和 stream 类型
        if (err) reject(err.message);
        let stdout = "";
        let stderr = "";
        stream
          .on("data", (data: Buffer) => (stdout += data.toString())) // 显式声明 data 类型为 Buffer
          .stderr.on("data", (data: Buffer) => (stderr += data.toString())) // 显式声明 data 类型为 Buffer
          .on("close", (code: number) => {
            // 显式声明 code 类型
            resolve({ output: stdout, stderr, code });
          });
      });
    });
  }

  closeSSH(): string {
    if (this.isSSHConnected) {
      this.conn.end();
      this.isSSHConnected = false;
      return "ssh2连接已关闭";
    }
    throw new Error("未建立有效的ssh2连接");
  }
}
