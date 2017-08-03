var log4js = require('log4js');
module.exports = function (name) {
    var fs = require('fs');
    if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs');
    }
    log4js.configure({
        appenders: [
            {
                "type": 'dateFile',
                "filename": "logs/" + name + ".log",
                "pattern": "-yyyy-MM-dd",
            }
        ]
    });
    var logger = log4js.getLogger(name);
    logger.setLevel('INFO');
    return logger;
}