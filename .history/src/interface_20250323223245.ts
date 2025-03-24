import { Client } from 'ssh2';

export class SSHConnection {
  private conn: Client;
  private shellStream: any | null;
  private isConnected: boolean = false;
  private sshInfo = { host: '', username: '', password: '', port: 22 };

  constructor() {
    this.conn = new Client();
    this.shellStream = null;
  }

  // 通过 getter 访问连接状态
  get isConnectedStatus(): boolean {
    return this.isConnected;
  }

  async connect(
    host: string,
    username: string,
    password: string
  ): Promise<string> {
    this.sshInfo = { host, username, password, port: 22 };

    return new Promise((resolve, reject) => {
      if (this.isConnected && this.shellStream?.writable) {
        return resolve('SSH 连接已存在');
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
            if (err) return reject('创建 Shell 会话失败: ' + err.message);

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
              resolve('SSH 连接和模块加载成功');
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
        });
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

  close(): string {
    if (this.isConnected && this.shellStream) {
      this.shellStream.end();
      this.conn.end();
      this.shellStream = null;
      this.isConnected = false;
      return 'SSH 连接已关闭';
    }
    return '未建立有效的 SSH 连接';
  }
}
