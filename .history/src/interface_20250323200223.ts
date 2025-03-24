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

// SSH Connection implementation details
export interface SSHConnectionImpl {
  conn: any; // We'll refine this in the service
  shellStream: any | null; // We'll refine this in the service
  isConnected: boolean;
  sshInfo: SSHInfo;
}

// SSH2 configuration type (we'll define the actual type in the service)
export interface SSH2Config {
  host: string;
  port: number;
  username: string;
  password: string;
  keepaliveInterval?: number;
  keepaliveCountMax?: number;
  [key: string]: any; // Allow additional properties
}
