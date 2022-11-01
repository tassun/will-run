export declare class KnExpress {
    static createApplication(service: Service, port?: number): Application;
}

export declare class KnRunner {
    flags: any;
    private configFile;
    config: any;
    private servicePaths;
    broker: any;
    worker: any;
    private schema?;
    service?: Service;
    constructor(schema?: ServiceSchema);
    processFlags(procArgs: string[]): void;
    loadEnvFile(): void;
    loadConfigFile(): Promise<any> | undefined;
    tryConfigPath(configPath: string, startFromCwd?: boolean): string | null;
    startWorkers(instances: number | string): void;
    loadServices(): void;
    mergeOptions(): void;
    isDirectory(p: string): any;
    isServiceFile(p: string): boolean;
    loadNpmModule(name: string): any;
    getNodeID(): string;
    startBroker(): any;
    run(): Promise<void>;
    start(args: string[]): Promise<void>;
}
