/**
 * @file
 * Mail body parser
 *
 * \copyright Copyright (c) 2022 Chris Byrne. All rights reserved.
 * Licensed under the MIT License. Refer to LICENSE file in the project root.
 */

/**
 * parse mail body, checking for multipart and returning the html part
 * @param {string} msg message body
 * @return {string} message part
 */
function parseBody(msg) {
    // check for multipart message
    const mParts = msg.match(/.+/);
    if (!mParts || !mParts[0].startsWith('--')) return msg;

    // attempt to parse multi parts
    const multiParts = [];
    for (let part of msg.split(mParts[0])) {
        part = part.trimStart();
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
    if (0 === multiParts.length) return msg;

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
        return Buffer.from(part.body, 'base64').toString('utf-8');
    } else {
        return part.body;
    }
}

module.exports = { parseBody };
