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


function parseBody(msg) {
    // check for multipart message
    const mParts = test.match(/.+/);
    if (!mParts || !mParts[0].startsWith('--')) return msg;

    const partsSplit = test.split(mParts[0])
    if (partsSplit.length < 2) return msg;

    // parse mutl parts
    const multiParts = [];
    for (let part of partsSplit) {
        part = part.trimStart()
        if ('--' === part) break;

        const mHeaders = part.match(/^(?:.+(\r\n|\n))+\s+/);
        if (!mHeaders) continue;

        const headers = mHeaders[0];
        const body = part.slice(headers.length).trimStart();
        const kvs = Object.fromEntries(
            headers.split('\n')
                .map((h) => h.split(':', 2))
                .filter(([k, v]) => k && v)
                .map(([k, v]) => [k.trim().toLowerCase(), v.trim()])
        );
        multiParts.push({ headers: kvs, body });
    }

    // find part with desired content type
    const findPartWithType = (desired) => {
        return multiParts.find((p) => {
            const contentType = p.headers['content-type'];
            return contentType && contentType.includes(desired);
        });
    };

    // prefer text/html (as text/plain is usually you need an HTML client)
    let part = findPartWithType('text/html');
    if (!part) part = findPartWithType('text/plain');
    if (!part) part = multiParts[0];

    // de-base64 as required
    if (part.headers['content-transfer-encoding'] === 'base64') {
        part = Buffer.from(part.body, 'base64').toString('utf-8');
    }

    return part;
}


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
                content: parseBody(body),
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
