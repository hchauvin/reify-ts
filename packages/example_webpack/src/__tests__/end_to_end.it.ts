/**
 * @license
 * Copyright (c) Hadrien Chauvin
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import anyTest, { TestInterface } from 'ava';
import * as puppeteer from 'puppeteer';
import { WebpackDevServer } from './webpack_dev_server_resource';
import { TypeEntry, Kind, STRING, NUMBER, BOOLEAN } from 'reify-ts/lib/types';

const test = anyTest as TestInterface<{
  browser: puppeteer.Browser;
  webpackDevServer: WebpackDevServer;
  page: puppeteer.Page;
}>;

test.beforeEach(async t => {
  console.log('Server started');
  const browser = await puppeteer.launch({
    args: [
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--disable-translate',
      '--headless',
      '--hide-scrollbars',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-first-run',
      '--safebrowsing-disable-auto-update',
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--ignore-certificate-errors-spki-list',
    ],
  });
  console.log('Browser launched');
  const webpackDevServer = new WebpackDevServer('web', 3979);
  await webpackDevServer.setup();
  const page = await browser.newPage();
  console.log('New page opened');
  page.goto(webpackDevServer.getUrlBase());

  t.context = { browser, webpackDevServer, page };
});

test.afterEach.always(async t => {
  await t.context.browser.close();
  await t.context.webpackDevServer.teardown();
});

test('headless browser tests', async t => {
  const handle = await t.context.page.waitForSelector('#type_json');
  const typeJson = await t.context.page.evaluate(
    (el: HTMLPreElement) => el.textContent,
    handle,
  );

  if (!typeJson) {
    throw t.fail();
  }

  const type: TypeEntry = JSON.parse(typeJson);
  t.truthy(type.name);
  t.assert(type.name.endsWith('#Person'));
  t.deepEqual(type.type, {
    kind: Kind.record,
    fields: {
      name: {
        type: STRING,
      },
      age: {
        type: NUMBER,
      },
      rememberMe: {
        type: BOOLEAN,
      },
    },
  });
});
