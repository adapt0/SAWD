/**
 * @file
 * SMTP to Discord webhook bridge
 *
 * \copyright Copyright (c) 2022 Chris Byrne. All rights reserved.
 * Licensed under the MIT License. Refer to LICENSE file in the project root.
 */

const packageJson = require('../package.json');
const { parseBody } = require('./parse-body');
const { sendToWebHook } = require('./send-to-webhook');
const SMTPServer = require('smtp-server').SMTPServer;
const { URL } = require('url');

console.log(`
                         @@                                                
                         @@                                                
                         @@                                                
                         @@    .,,,,,,,,,,.                                
   //**/**//**/**/******//%                    ..,,,,,,,,,..               
   //...*/*,*/,***/*,*,**/%,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,  
   // ,/,,/. ,*..*../*././%                        ,,,,,,,,,,,             
                         @@         ,,,,,,,,,,,                            
                         @@,,...                                           
                         @@                                                
                         @@                                               
                                                             SAWD v${packageJson.version}`);

// space delimited WEBHOOKS
const urlWebhooks = (() => {
    const envWebhooks = process.env.WEBHOOKS || process.env.WEBHOOK;
    if (!envWebhooks) return [];
    return envWebhooks.split(' ').map((webhook) => {
        try {
            return new URL(webhook.trim());
        } catch (e) {
            console.error(`${webhook} - ${e}`);
            return undefined;
        }
    }).filter((webhook) => webhook);
})();
urlWebhooks.forEach((webhook) => console.log(`Forwarding to ${webhook.origin}`));
if (0 === urlWebhooks.length) console.warn('No WEBHOOKS were set!');


const server = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
        let out = '';
        stream.on('data', (chunk) => out += chunk);
        stream.on('end', async () => {
            console.log('Received message');
            const m = out.match(/^(?:.+(\r\n|\n))+\s+/);
            if (!m) return callback(new Error('Failed to parse message'));

            const headers = m[0];
            const body = out.slice(headers.length);
            // console.log({ headers, body });

            const content = parseBody(body)
                .replace(/[^\x00-\x7F]/g, '') // remove non-ASCII (https://stackoverflow.com/questions/20856197/remove-non-ascii-character-in-string),
            ;

            const msg = JSON.stringify({ content });

            const errors = [];
            for (const webhook of urlWebhooks) {
                console.log(`Forwarding message to ${webhook.origin}`);
                try {
                    await sendToWebHook(webhook, msg);
                } catch (e) {
                    console.error(webhook.href, e);
                    errors.push(`${webhook} - ${e}`);
                }
            }

            if (errors.length === urlWebhooks.length) {
                console.log('--- Email body ---');
                console.log(body);
                console.log('--- message forwarded ---');
                console.log(msg);
            }

            if (errors.length) {
                callback(new Error(errors.join('\n')));
            } else {
                callback();
            }
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
