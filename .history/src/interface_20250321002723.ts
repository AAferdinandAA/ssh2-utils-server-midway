/**
 * @description User-Service parameters
 */
export interface IUserOptions {
  uid: number;
}

export interface SSHConfig {
  host: string;
  username: string;
  password: string;
  port?: number;
}

export interface CommandRequest {
  command: string;
}

export interface DirRequest {
  dirPath: string;
}
