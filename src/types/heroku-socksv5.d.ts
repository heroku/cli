declare module '@heroku/socksv5' {
  import net from 'net'

  interface SocksConnectionInfo {
    cmd: string;
    dstAddr: string;
    dstPort: number;
    srcAddr: string;
    srcPort: number;
  }

  type AcceptFn = (intercept?: boolean) => false | net.Socket;
  type DenyFn = () => void;
  type ConnectionListener = (info: SocksConnectionInfo, accept: AcceptFn, deny: DenyFn) => void;

  interface AuthHandler {
    METHOD: number;
    client: (stream: net.Socket, cb: (result: Error | boolean) => void) => void;
    server: (stream: net.Socket, cb: (result: Error | boolean) => void) => void;
  }

  interface Server {
    address(): net.AddressInfo | null | string;
    close(cb?: () => void): this;
    listen(port: number, host: string, callback?: () => void): this;
    useAuth(auth: AuthHandler): this;
  }

  function createServer(listener: ConnectionListener): Server;
  function createServer(options: object, listener: ConnectionListener): Server;

  const auth: {
    [key: string]: (...args: unknown[]) => AuthHandler;
    None: () => AuthHandler;
  }
}
