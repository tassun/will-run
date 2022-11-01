import { Application, Request, Response } from 'express';
import { Utilities } from 'will-util';

export class RouteManager {
    public static route(app: Application, dir: string) {
        
        app.get('/home', function(req: Request, res: Response) {
            console.log('working '+dir+' - send /public/index.html');
            let parent = Utilities.getWorkingDir(dir);
            console.log("parent path : "+parent);
            res.sendFile(parent + '/public/index.html');
        });
        
        //try to bind other router services
		//app.use("/other",otherrouter);        
		
    }
}