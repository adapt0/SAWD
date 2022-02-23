/**
 * @file
 * test webhook invocation
 *
 * \copyright Copyright (c) 2022 Chris Byrne. All rights reserved.
 * Licensed under the MIT License. Refer to LICENSE file in the project root.
 */

const { expect } = require('chai');
const { sendToWebHook } = require('../src/send-to-webhook');
const { URL } = require('url');

let mockHttpRes;
let mockHttpResWritten;
jest.mock('https', () => {
    return {
        request(options, callback) {
            const handlers = { };
            mockHttpRes = {
                statusCode: 0,
                on(event, handler) {
                    handlers[event] = handler;
                },
            };
            callback(mockHttpRes);
            return {
                on: jest.fn(),
                end() {
                    mockHttpRes.statusCode = 200;
                    handlers.end();
                },
                write(msg) {
                    mockHttpResWritten = msg;
                }
            };
        }
    };
});

const testUrl = new URL('https://localhost/test');

describe('send-to-webhook', () => {
    test('invoke', async () => {
        await sendToWebHook(testUrl, 'test');
        expect(mockHttpRes.statusCode).to.equal(200);
        expect(mockHttpResWritten).to.equal('test');
    });
});
