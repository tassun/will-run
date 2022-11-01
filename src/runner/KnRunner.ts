import { Service, ServiceBroker, ServiceSchema } from "moleculer";
const fs = require("fs");
const path = require("path");
const Args = require("args");
const os = require("os");
const cluster = require("cluster");
const glob = require("glob").sync;
const _ = require("lodash");

const stopSignals = [
	"SIGHUP",
	"SIGINT",
	"SIGQUIT",
	"SIGILL",
	"SIGTRAP",
	"SIGABRT",
	"SIGBUS",
	"SIGFPE",
	"SIGUSR1",
	"SIGSEGV",
	"SIGUSR2",
	"SIGTERM"
];

export class KnRunner {
    public flags : any = null;
    private configFile : any = null;
    public config : any = null;
    private servicePaths : string[] = [];
    public broker : any = null;
    public worker : any  = null;
	private schema? : ServiceSchema;
	public service? : Service;
	
	constructor(schema?: ServiceSchema) {
		this.schema = schema;
	}
	
	public processFlags(procArgs: string[]) {
		Args.option("config", "Load the configuration from a file")
			.option("repl", "Start REPL mode", false)
			.option("silent", "Silent mode. No logger", false)
			.option("env", "Load .env file from the current directory")
			.option("envfile", "Load a specified .env file")
			.option("instances", "Launch [number] instances node (load balanced)")
			.option("mask", "Filemask for service loading");

		this.flags = Args.parse(procArgs, {
			mri: {
				alias: {
					c: "config",
					r: "repl",
					s: "silent",
					e: "env",
					E: "envfile",
					i: "instances",
					m: "mask"
				},
				boolean: ["repl", "silent", "env"],
				string: ["config", "envfile", "mask"]
			}
		});

		this.servicePaths = Args.sub;
	}

	public loadEnvFile() {
		if (this.flags.env || this.flags.envfile) {
			try {
				const dotenv = require("dotenv");

				if (this.flags.envfile) dotenv.config({ path: this.flags.envfile });
				else dotenv.config();
			} catch (err) {
				throw new Error(
					"The 'dotenv' package is missing! Please install it with 'npm install dotenv --save' command."
				);
			}
		}
	}

	public loadConfigFile() {
		let filePath;
		const configPath = process.env["MOLECULER_CONFIG"] || this.flags.config;

		if (configPath != null) {
			if (path.isAbsolute(configPath)) {
				filePath = this.tryConfigPath(configPath);
			} else {
				filePath = this.tryConfigPath(path.resolve(process.cwd(), configPath));

				if (filePath == null) {
					filePath = this.tryConfigPath(configPath, true);
				}
			}

			if (filePath == null) {
				return Promise.reject(new Error(`Config file not found: ${configPath}`));
			}
		}

		if (filePath == null) {
			filePath = this.tryConfigPath(path.resolve(process.cwd(), "moleculer.config.js"));
		}
		if (filePath == null) {
			filePath = this.tryConfigPath(path.resolve(process.cwd(), "moleculer.config.json"));
		}

		if (filePath != null) {
			const ext = path.extname(filePath);
			switch (ext) {
				case ".json":
				case ".js":
				case ".ts": {
					const content = require(filePath);
					return Promise.resolve()
						.then(() => {
							if (typeof content === "function") return content.call(this);
							else return content;
						})
						.then(res => (this.configFile = res.default != null && res.__esModule ? res.default : res) );
				}
				default:
					return Promise.reject(new Error(`Not supported file extension: ${ext}`));
			}
		}
	}

	public tryConfigPath(configPath: string, startFromCwd = false) {
		let resolveOptions;
		if (startFromCwd) {
			resolveOptions = { paths: [process.cwd()] };
		}
		try {
			return require.resolve(configPath, resolveOptions);
		} catch (_) {
			return null;
		}
	}

	public startWorkers(instances: number | string) {
		let stopping = false;

		cluster.on("exit", function (worker: any, code: any) {
			if (!stopping) {
				// only restart the worker if the exit was by an error
				if (process.env.NODE_ENV === "production" && code !== 0) {
					console.info(`The worker #${worker.id} has disconnected`);
					console.info(`Worker #${worker.id} restarting...`);
					cluster.fork();
					console.info(`Worker #${worker.id} restarted`);
				} else {
					process.exit(code);
				}
			}
		});

		const workerCount = Number.isInteger(instances) && instances > 0 ? instances : os.cpus().length;

		console.info(`Starting ${workerCount} workers...`);

		for (let i = 0; i < workerCount; i++) {
			cluster.fork();
		}

		stopSignals.forEach(function (signal: any) {
			process.on(signal, () => {
				console.info(`Got ${signal}, stopping workers...`);
				stopping = true;
				cluster.disconnect(function () {
					console.info("All workers stopped, exiting.");
					process.exit(0);
				});
			});
		});
	}

	public loadServices() {
		const fileMask = this.flags.mask || "**/*.service.js";

		const serviceDir = process.env.SERVICEDIR || "";
		const svcDir = path.isAbsolute(serviceDir)
			? serviceDir
			: path.resolve(process.cwd(), serviceDir);

		let patterns = this.servicePaths;

		if (process.env.SERVICES || process.env.SERVICEDIR) {
			if (this.isDirectory(svcDir) && !process.env.SERVICES) {
				// Load all services from directory (from subfolders too)
				this.broker.loadServices(svcDir, fileMask);
			} else if (process.env.SERVICES) {
				// Load services from env list
				patterns = Array.isArray(process.env.SERVICES)
					? process.env.SERVICES
					: process.env.SERVICES.split(",");
			}
		}

		if (patterns.length > 0) {
			let serviceFiles : string[] = [];

			patterns
				.map(s => s.trim())
				.forEach(p => {
					const skipping = p[0] == "!";
					if (skipping) p = p.slice(1);

					if (p.startsWith("npm:")) {
						// Load NPM module
						this.loadNpmModule(p.slice(4));
					} else {
						let files : string[];
						let svcPath = path.isAbsolute(p) ? p : path.resolve(svcDir, p);
						// Check is it a directory?
						if (this.isDirectory(svcPath)) {
							svcPath = svcPath.replace(/\\/g,"/");
							files = glob(svcPath+"/"+fileMask, { absolute: true });
							if (files.length == 0)
								return this.broker.logger.warn(`There is no service files in directory: '${svcPath}'`);
						} else if (this.isServiceFile(svcPath)) {
							files = [svcPath.replace(/\\/g, "/")];
						} else if (this.isServiceFile(svcPath + ".service.js")) {
							files = [svcPath.replace(/\\/g, "/") + ".service.js"];
						} else {
							// Load with glob
							files = glob(p, { cwd: svcDir, absolute: true });
							if (files.length == 0)
								this.broker.logger.warn(`There is no matched file for pattern: '${p}'`);
						}

						if (files && files.length > 0) {
							if (skipping)
								serviceFiles = serviceFiles.filter(f => files.indexOf(f) === -1);
							else serviceFiles.push(...files);
						}
					}
				});

			_.uniq(serviceFiles).forEach((f:string) => { 
                this.broker.loadService(f);
            });
		}
	}

	public mergeOptions() {
		this.config = _.defaultsDeep(this.configFile, ServiceBroker.defaultOptions);
		if (this.flags.silent) this.config.logger = false;
		if (this.flags.hot) this.config.hotReload = true;
	}

	public isDirectory(p: string) {
		try {
			return fs.lstatSync(p).isDirectory();
		} catch (_) {
			// ignore
		}
		return false;
	}

	public isServiceFile(p: string) {
		try {
			return !fs.lstatSync(p).isDirectory();
		} catch (_) {
			// ignore
		}
		return false;
	}

    public loadNpmModule(name: string) {
		let svc = require(name);
		return this.broker.createService(svc);
	}

    public getNodeID() {
        return os.hostname().toLowerCase() + "-" + process.pid;
    }

    public startBroker() {
		this.worker = cluster.worker;

		if (this.worker) {
			Object.assign(this.config, {
				nodeID: (this.config.nodeID || this.getNodeID()) + "-" + this.worker.id
			});
		}

		this.broker = new ServiceBroker(Object.assign({}, this.config));
		this.broker.runner = this;

		this.loadServices();

		if(this.schema) {
			this.service = this.broker.createService(this.schema);
		}
	
		return this.broker.start().then(() => {
			if (this.flags.repl && (!this.worker || this.worker.id === 1)) this.broker.repl();
			return this.broker;
		});
	}

    public run() : Promise<void> {
		return Promise.resolve()
			.then(() => this.loadEnvFile())
			.then(() => this.loadConfigFile())
			.then(() => this.mergeOptions())
			.then(() => this.startBroker())
			.catch(err => {
				console.error(err);
				process.exit(1);
			});
	}

	public start(args: string[]) : Promise<void> {
		return Promise.resolve()
			.then(() => this.processFlags(args))
			.then(() => {
				if (this.flags.instances !== undefined && cluster.isMaster) {
					return this.startWorkers(this.flags.instances);
				}
				return this.run();
			});
	}

}
