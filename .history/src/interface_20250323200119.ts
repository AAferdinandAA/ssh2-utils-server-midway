import { Client, ClientChannel, ConnectConfig } from 'ssh2';

// SSH connection configuration
export interface SSHInfo {
  host: string;
  username: string;
  password: string;
  port: number;
}

// SSH Connection interface
export interface ISSHConnection {
  connect(host: string, username: string, password: string): Promise<string>;
  runPersistentCommand(command: string): Promise<string>;
  checkDirectoryExists(dirPath: string): Promise<boolean>;
  createDirectory(
    dirPath: string
  ): Promise<{ success: boolean; error?: string }>;
  close(): string;
}

// Type definitions for SSH implementation
export interface SSHConnectionImpl {
  conn: Client;
  shellStream: ClientChannel | null;
  isConnected: boolean;
  sshInfo: SSHInfo;
}

// SSH2 configuration type
export type SSH2Config = ConnectConfig;
