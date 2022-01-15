const fs = require('fs');

function logging(level, message) {
    const date = new Date();
    const timeStamp = date.toLocaleString();
    const logMessage = `${timeStamp} '${level}': ${message}\n`;
    let logPath = "";

    switch (level) {
        case 'info':
            logPath = "./config/log/info.txt";
            break;
        case 'notification':
            logPath = "./config/log/notification.txt";
            break;
        case 'error':
            logPath = "./config/log/err.txt";
            break;
        case 'api':
            logPath = "./config/log/apiLog.txt";
            break;
        default:
            console.log("Wrong log level");
            break;
    }

    fs.appendFile(logPath, logMessage, (err) => {
        if (err) {
            throw err;
        }
    });
}

module.exports = logging;