const fs = require('fs');

function logging(level, message) {
    const date = new Date();
    const timeStamp = date.toLocaleString();
    const errLogPath = './config/log/err.txt';
    const infoLogPath = './config/log/info.txt';
    const logMessage = `${timeStamp} '${level}': ${message}\n`;
  
    // re exception
    if (level === 'error') {
        fs.appendFile(errLogPath, logMessage, (err) => {
            if (err) {
                throw err;
            }
        });
    }
    else {
        fs.appendFile(infoLogPath, logMessage, (err) => {
            if (err) {
                throw err;
            }
        });
    }
}

module.exports = logging;