/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { APIClient } from '@heroku-cli/command';
import { IOptions } from '@heroku-cli/command/lib/api-client';
import { Dyno as APIDyno } from '@heroku-cli/schema';
import { HTTP } from 'http-call';
import * as net from 'net';
import { Duplex } from 'stream';
import * as tls from 'tls';
import { URL } from 'url';
interface HerokuApiClientRun extends APIClient {
    options: IOptions & {
        rejectUnauthorized?: boolean;
    };
}
interface DynoOpts {
    'exit-code'?: boolean;
    'no-tty'?: boolean;
    app: string;
    attach?: boolean;
    command: string;
    dyno?: string;
    env?: string;
    heroku: APIClient;
    listen?: boolean;
    notify?: boolean;
    showStatus?: boolean;
    size?: string;
    type?: string;
}
export default class Dyno extends Duplex {
    opts: DynoOpts;
    get _useSSH(): boolean;
    dyno?: APIDyno;
    heroku: HerokuApiClientRun;
    input: any;
    p: any;
    reject?: (reason?: any) => void;
    resolve?: (value?: unknown) => void;
    uri?: URL;
    legacyUri?: {
        [key: string]: any;
    };
    unpipeStdin: any;
    useSSH: any;
    private _notified?;
    private _startedAt?;
    constructor(opts: DynoOpts);
    /**
     * Starts the dyno
     */
    start(): Promise<void>;
    _doStart(retries?: number): Promise<HTTP<unknown>>;
    attach(): any;
    _rendezvous(): Promise<unknown>;
    _ssh(retries?: number): Promise<unknown>;
    _connect(): Promise<unknown>;
    _handle(localServer: net.Server): void;
    _isDebug(): boolean;
    _env(): {
        [key: string]: any;
    };
    _status(status: any): string;
    _readData(c?: tls.TLSSocket): (data: any) => void;
    _readStdin(c: any): void;
    _read(): void;
    _write(chunk: any, encoding: any, callback: any): void;
    _notify(): void;
}
export {};
