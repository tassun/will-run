# will-run

Runner for moleculer services and express application framework

## Installation

    npm install will-run

#### KnExpress
KnExpress wrap up express application framework settings

```typescript
import KnAPI from "will-api";
import { KnExpress } from "will-run";
import { ServiceBroker } from "moleculer";
import { RouteManager } from '../routers/RouteManager';

const broker = new ServiceBroker({
    logLevel: "debug"
});

broker.createService({
    name: "test",
    actions: {
        hello() {
            return "Hello API Gateway!"
        },
        hi(context:any) {
            return "Hi, "+context.params.name;
        },
    }
});

let service = broker.createService({
    name: "api",
    mixins: [KnAPI],
    settings: {
        //when using express must defined server = false
        server: false,
    }
});

let app = KnExpress.createApplication(service);
//this is private route manager binding services
RouteManager.route(app, __dirname);

broker.start()
.then(() => broker.call("test.hi",{name: "tester" }))
.then(res => console.log("response",res) )
```

#### KnRunner
Like moleculer-runner `KnRunner` can run with express application

```typescript
import KnAPI from "will-api";
import { KnExpress } from "will-run";
import { KnRunner } from "will-run";
import { ServiceSchema } from "moleculer";
import { RouteManager } from '../routers/RouteManager';

const ExpressService : ServiceSchema = {
    name: "api",
    mixins: [KnAPI],
    settings: {
        //when using express must defined server = false
        server: false,
    }
};
const runner = new KnRunner(ExpressService);
runner.start(process.argv).then(() => {
    if(runner.service) {
        let app = KnExpress.createApplication(runner.service);
        //this is private route manager binding services
        RouteManager.route(app, __dirname);
    }
});
```
