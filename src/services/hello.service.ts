import { Context, ServiceSchema } from "moleculer";
const HelloService : ServiceSchema = {
    name: "test",
    actions: {
        hello() {
            return "Hello API Gateway!"
        },
        hi(context:Context<any>) {
            return "Hi, "+context.params.name;
        },
        err() {
            return Promise.reject("My Exception");
        },
        error() {
            return Promise.reject(new Error("API Error"));
        },
        rs() {
            return {rows: { affectedRows: 0 }, columns: null };
        },
        reply() {
            return {model: "api", method:"hello.service"};
        }
    }
};

export = HelloService;
