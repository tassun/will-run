import { ServiceSchema } from "moleculer";
import KnAPI from "will-api";

const APIService : ServiceSchema = {
    name: "api",
    mixins: [KnAPI],
}
export = APIService;
