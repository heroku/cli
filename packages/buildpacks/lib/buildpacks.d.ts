import { APIClient } from '@heroku-cli/command';
import { BuildpackRegistry } from '@heroku/buildpack-registry';
export declare type BuildpackResponse = {
    buildpack: {
        url: string;
        name: string;
    };
    ordinal: number;
};
export declare class BuildpackCommand {
    heroku: APIClient;
    registry: BuildpackRegistry;
    constructor(heroku: APIClient);
    fetch(app: string): Promise<any[]>;
    mapBuildpackResponse(buildpacks: {
        body: any;
    }): BuildpackResponse[];
    display(buildpacks: BuildpackResponse[], indent: string): void;
    registryNameToUrl(buildpack: string): Promise<string>;
    findUrl(buildpacks: BuildpackResponse[], buildpack: string): Promise<number>;
    validateUrlNotSet(buildpacks: BuildpackResponse[], buildpack: string): Promise<void>;
    findIndex(buildpacks: BuildpackResponse[], index?: number): number;
    mutate(app: string, buildpacks: BuildpackResponse[], spliceIndex: number, buildpack: string, command: 'add' | 'set' | 'remove'): Promise<BuildpackResponse[]>;
    put(app: string, buildpackUpdates: {
        buildpack: string;
    }[]): Promise<BuildpackResponse[]>;
    displayUpdate(app: string, remote: string, buildpacks: BuildpackResponse[], action: 'added' | 'set' | 'removed'): void;
    registryUrlToName(buildpack: string, registryOnly?: boolean): string;
    clear(app: string, command: 'clear' | 'remove', action: 'cleared' | 'removed'): Promise<void>;
    validateIndexInRange(buildpacks: BuildpackResponse[], index: number): void;
    validateIndex(index: number): void;
}
