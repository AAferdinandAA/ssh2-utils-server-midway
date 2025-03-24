import { Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { Client, ConnectConfig } from 'ssh2'; // Import only what's needed

@Provide()
@Scope(ScopeEnum.Singleton)
export class SSHService {
  private connections = new Map<string, SSHConnection>(); // authToken -> SSHConnection

  getConnection(authToken: string): SSHConnection {
    if (!this.connections.has(authToken)) {
      this.connections.set(authToken, new SSHConnection());
    }
    return this.connections.get(authToken);
  }
}

class SSHConnection {
  private conn: Client;
  private shellStream: any | null; // Temporarily using any until we properly type this
  private isConnected: boolean = false;
  private sshInfo = { host: '', username: '', password: '', port: 22 };

  constructor() {
    this.conn = new Client();
    this.shellStream = null;
  }

  async connect(
    host: string,
    username: string,
    password: string
  ): Promise<string> {
    this.sshInfo = { host, username, password, port: 22 };

    return new Promise((resolve, reject) => {
      if (this.isConnected && this.shellStream?.writable) {
        return resolve('SSH连接已存在');
      }

      if (this.conn['_sock'] && this.conn['_sock'].destroyed) {
        this.isConnected = false;
        this.shellStream = null;
        this.conn.end();
      }

      this.conn
        .on('ready', () => {
          this.isConnected = true;
          this.conn.shell((err, stream) => {
            if (err) return reject('创建Shell会话失败: ' + err.message);

            this.shellStream = stream;
            let initOutput = '';

            stream
              .on('data', data => (initOutput += data.toString()))
              .on('close', () => {
                this.isConnected = false;
                this.shellStream = null;
              });

            stream.write('module load sos\n');
            setTimeout(() => {
              resolve('SSH连接和模块加载成功');
            }, 1000);
          });
        })
        .on('error', err => reject(err.message))
        .connect({
          host,
          port: 22,
          username,
          password,
          keepaliveInterval: 5000,
          keepaliveCountMax: 10,
        } as ConnectConfig);
    });
  }

  async runPersistentCommand(command: string): Promise<string> {
    if (!this.isConnected || !this.shellStream || !this.shellStream.writable) {
      await this.connect(
        this.sshInfo.host,
        this.sshInfo.username,
        this.sshInfo.password
      );
    }

    return new Promise(resolve => {
      let result = '';
      const dataHandler = data => (result += data.toString());

      this.shellStream.on('data', dataHandler);
      this.shellStream.write(`${command}\n`);

      setTimeout(() => {
        this.shellStream.removeListener('data', dataHandler);
        resolve(result);
      }, 1000);
    });
  }

  async checkDirectoryExists(dirPath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const command = `test -d ${dirPath} && echo "Exists" || echo "Not exists"`;
      this.conn.exec(command, (err, stream) => {
        if (err) reject(err);
        let output = '';
        stream
          .on('data', data => (output += data.toString().trim()))
          .on('close', () => resolve(output === 'Exists'));
      });
    });
  }

  async createDirectory(
    dirPath: string
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve, reject) => {
      const command = `mkdir -p ${dirPath}`;
      this.conn.exec(command, (err, stream) => {
        if (err) reject(err);
        let stderr = '';
        stream
          .on('stderr', data => (stderr += data.toString()))
          .on('close', code => {
            code === 0
              ? resolve({ success: true })
              : reject({ success: false, error: stderr });
          });
      });
    });
  }

  close(): string {
    if (this.isConnected && this.shellStream) {
      this.shellStream.end();
      this.conn.end();
      this.shellStream = null;
      this.isConnected = false;
      return 'ssh2连接已关闭';
    }
    return '未建立有效的ssh2连接';
  }
}
