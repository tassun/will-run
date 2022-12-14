var os = require("os");

module.exports = {
    nodeID: "express-"+os.hostname().toLowerCase() + "-" + process.pid,
    logger: [
        {
            type: "Console",
            options: {
                level: "debug",
                color: true,
                formatter: "full",
            } 
        },                   
        {
            type: "File",
            options: {
                level: "debug",
                formatter: "full",
                folder: "./logs",
                filename: "express-{date}.log",
                eol: "\n",
                interval: 1000,
            }
        }
    ],
    /*
    transporter: "nats://localhost:4222",
    requestTimeout: 5 * 1000,

    circuitBreaker: {
        enabled: true
    },

    metrics: false,
    statistics: true
    */
};
