/* MIMEI test suite.
   The system Chrome is used (`channel: 'chrome'`) so nothing has to be
   downloaded; the site is served by python's http.server on a loopback port,
   which is the same thing ./serve.sh does. */
import { defineConfig } from '@playwright/test';

const PORT = 8928;
export const BASE = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  workers: 2,
  /* One retry: the only failures this suite has ever produced that were not
     real bugs were browser-context launches timing out while other headless
     Chromes (and the user's own) were fighting for the same CPU. */
  retries: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'tools/_out/report' }]],
  use: {
    baseURL: BASE,
    channel: 'chrome',
    locale: 'en-GB',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    viewport: { width: 1600, height: 1000 },
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1600, height: 1000 } } },
    { name: 'narrow', use: { viewport: { width: 940, height: 780 } }, testMatch: /stack|responsive/ },
  ],
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1 --directory .`,
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
