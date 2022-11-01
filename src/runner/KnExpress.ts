import { Service } from "moleculer";
import { Application } from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';
import express from 'express';
import cors from 'cors';
import session from 'express-session';

export class KnExpress {
    
    public static createApplication(service: Service, port?: number) : Application {
        const app : Application = express();
        app.set('view engine','ejs'); 
        app.use(express.json());
        app.use(express.urlencoded());
        app.use(express.static("public"));
        app.use(cors({
            credentials: false,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']
        }));
        app.use(
            session({
              secret: 'WillExpressGateWaySecretSettings',
              resave: true,
              saveUninitialized: true,
              cookie: {
                  maxAge: 30*60*60*1000, //30 mins. expired
              },
            })
        );
        app.disable('x-powered-by');  
        app.use("/", service.express());

        let httpport = parseInt(process.env.HTTP_PORT || "8080") || 8080;
        if(port) httpport = port;
        const server : Server = app.listen(httpport, function () {
            let addr = server.address() as AddressInfo;
            console.log("address",addr);
            const host = addr.address == "::" || addr.address == "0.0.0.0" ? "localhost" : addr.address;
            let port = addr.port;
            console.log("working directory : "+__dirname);
            console.log("Server running at http://%s:%s", host, port);
        }); 

        return app;
    }

}
