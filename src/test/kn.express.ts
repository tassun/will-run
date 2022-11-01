import KnAPI from "will-api";
import { ServiceSchema } from "moleculer";
import { KnExpress } from "../runner/KnExpress";
import { KnRunner } from "../runner/KnRunner";
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
        RouteManager.route(app, __dirname);
    }
});
