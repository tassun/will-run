import path from 'path';
import KnAPI from "will-api";
import { ServiceBroker } from "moleculer";
import { KnExpress } from "../runner/KnExpress";
import { RouteManager } from '../routers/RouteManager';
import HelloService from "../services/hello.service";

const broker = new ServiceBroker({
    logLevel: "debug"
});

broker.createService(HelloService);

let service = broker.createService({
    name: "api",
    mixins: [KnAPI],
    settings: {
        //when using express must defined server = false
        server: false,
    }
});

let app = KnExpress.createApplication(service);
RouteManager.route(app, path.dirname(__dirname));

broker.start()

.then(() => broker.call("test.hi",{name: "tester" }))
.then(res => console.log("response",res) )

//curl http://localhost:8080/api/test/hello
//curl -v http://localhost:8080/api/test/hi?name=test
//curl -v -X POST "http://localhost:8080/api/test/hi" -d name=testing
//curl -v -X POST -H "Content-Type: application/json" http://localhost:8080/api/test/hi -d "{\"name\":\"testing\"}"
//curl -v -X POST -H "Origin: https://example.com/" http://localhost:8080/api/test/hi?name=test
