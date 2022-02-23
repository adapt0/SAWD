/**
 * @file
 * test mail body parser
 *
 * \copyright Copyright (c) 2022 Chris Byrne. All rights reserved.
 * Licensed under the MIT License. Refer to LICENSE file in the project root.
 */

const { expect } = require('chai');
const { parseBody } = require('../src/parse-body');

describe('parse-body', () => {
    test('no multipart', () => {
        expect(parseBody('test')).to.equal('test');
    });

    test('looks like multipart, but not', () => {
        expect(parseBody('--test\ntest')).to.equal('--test\ntest');

        expect(parseBody(`--test
test
--test
test2
--test--`)).to.equal(`--test
test
--test
test2
--test--`);
    });

    test('multipart text/plain', () => {
        expect(parseBody(`--test
Content-Type: text/plain

Hello
--test--`).trim()).to.equal('Hello');
    });

    test('multipart text/html', () => {
        expect(parseBody(`--test
Content-Type: text/plain

Hello
--test
Content-Type: text/html

HTML
--test--`).trim()).to.equal('HTML');
    });

    test('multipart text/html base64', () => {
        expect(parseBody(`--test
Content-Type: text/plain

Hello
--test
Content-Type: text/html
content-transfer-encoding: base64

aGVsbG8K
--test--`).trim()).to.equal('hello');
    });
});
