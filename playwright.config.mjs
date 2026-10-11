/**
 * End-to-end tests against the production build.
 *
 * MOCK_NOW pins the mock API's clock so the figures asserted here do not change with
 * the calendar. Locally the installed Chrome is used (PW_CHANNEL=chrome); CI installs
 * Playwright's own Chromium.
 */
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT || 3100);
const channel = process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel } },
    { name: "phone", use: { ...devices["Pixel 7"], channel } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: { MOCK_NOW: "2026-10-11T12:00:00Z" },
    timeout: 120_000,
  },
});
