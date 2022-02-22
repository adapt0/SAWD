/////////////////////////////////////////////////////////////////////////////
/** @file
SMTP to Discord webhook bridge

\copyright Copyright (c) 2022 Chris Byrne. All rights reserved.
Licensed under the MIT License. Refer to LICENSE file in the project root. */
/////////////////////////////////////////////////////////////////////////////

const https = require('https');
const SMTPServer = require("smtp-server").SMTPServer;
const url = require('url');

const urlWebhook = (() => {
    try {
        return url.parse(process.env.WEBHOOK);
    } catch (e) {
        throw new Error('Expected WEBHOOK environment');
    }
})();
console.log(`Forwarding to ${urlWebhook.host}`);

function sendToWebHook(msg) {
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
                res.on('data', d => response += d)
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

const server = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
        let out = '';
        stream.on('data', (chunk) => out += chunk);
        stream.on('end', () => {
            const m = out.match(/^(?:.+(\r\n|\n))+\s+/);
            if (!m) return callback(new Error('Failed to parse message'));

            const headers = m[0];
            const body = out.slice(headers.length);
            // console.log({ headers, body });

            sendToWebHook(JSON.stringify({
                content: body,
            })).then(() => {
                callback();
            }).catch((e) => {
                callback(e);
            });
        });
    }
});

// begin listening for SMTP connections
const port = process.env.PORT || 25;
server.listen(
    port,
    () => {
        console.log(`SMTP listening on port ${port}`);
    }
);
