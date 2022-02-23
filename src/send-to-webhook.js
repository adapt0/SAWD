/**
 * @file
 * Invoke webhook
 *
 * \copyright Copyright (c) 2022 Chris Byrne. All rights reserved.
 * Licensed under the MIT License. Refer to LICENSE file in the project root.
 */

const https = require('https');

/**
 * invoke webhook with provided message
 * @param {URL} urlWebhook webhook URL to invoke
 * @param {string} msg message to send
 * @return {Promise<void>}
 */
function sendToWebHook(urlWebhook, msg) {
    return new Promise((resolve, reject) => {
        const req = https.request(
            {
                method: 'POST',
                hostname: urlWebhook.hostname,
                path: urlWebhook.path,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': msg.length,
                }
            },
            (res) => {
                let response = '';
                res.on('data', (d) => response += d);
                res.on('end', () => {
                    if (200 === (res.statusCode & 200)) {
                        resolve();
                    } else {
                        reject(new Error(response));
                    }
                });
            }
        );
        req.on('error', (error) => {
            console.error(error);
            reject(error);
        });
        req.write(msg);
        req.end();
    });
}

module.exports = { sendToWebHook };
