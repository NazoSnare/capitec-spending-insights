import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const money = (s) => new RegExp(s.replace(/[  ]/g, "[\\s\\u00a0]").replace(".", "\\."));

test.beforeEach(async ({ page }) => {
  // Every test starts as a first visit: no saved preferences.
  await page.addInitScript(() => { if (!sessionStorage.getItem("e2e")) { localStorage.clear(); sessionStorage.setItem("e2e", "1"); } });
});

test("the overview shows the customer, the figures, the breakdown and the budgets", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Thandiwe");
  await expect(page.getByText("Total spent")).toBeVisible();
  await expect(page.getByRole("list", { name: "Spending by category" }).getByRole("listitem").first()).toBeVisible();
  await expect(page.getByRole("progressbar").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent transactions" })).toBeVisible();
});

test("changing the period refetches, and the choice survives a reload", async ({ page }) => {
  await page.goto("/");
  const total = page.locator("text=Total spent").locator("xpath=ancestor::div[contains(@class,'rounded')][1]");
  const before = await total.innerText();
  const summary = page.waitForResponse((r) => r.url().includes("/spending/summary?period=90d") && r.ok());
  await page.getByRole("radio", { name: "90 days" }).click();
  await summary;
  await expect(total).not.toHaveText(before);
  await expect(page.getByText("vs previous 90 days").first()).toBeVisible();

  await page.reload();
  await expect(page.getByRole("radio", { name: "90 days" })).toHaveAttribute("aria-checked", "true");
});

test("hide amounts hides every rand figure and is remembered", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/R\d/).first()).toBeVisible();
  await page.getByRole("button", { name: /hide amounts/i }).click();
  await expect(page.getByLabel("Amount hidden").first()).toBeVisible();
  await expect(page.locator("main").getByText(money("R4 6"))).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("button", { name: /show amounts/i })).toHaveAttribute("aria-pressed", "true");
});

test("choosing a category opens its transactions, filtered", async ({ page }) => {
  await page.goto("/");
  const first = page.getByRole("list", { name: "Spending by category" }).getByRole("link").first();
  const name = (await first.locator("span.truncate").innerText()).trim();
  await first.click();
  await expect(page).toHaveURL(/\/transactions$/);
  await expect(page.getByLabel("Category")).toHaveValue(name);
  const rows = page.locator("main ul li");
  await expect(rows.first()).toBeVisible();
  for (const text of await rows.allInnerTexts()) expect(text).toContain(name);
});

test("the transaction list pages and sorts", async ({ page }) => {
  await page.goto("/transactions");
  await expect(page.getByText(/^1–20 of/)).toBeVisible();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText(/^21–40 of/)).toBeVisible();
  await page.getByLabel("Sort by").selectOption("amount_desc");
  await expect(page.getByText(/^1–20 of/)).toBeVisible();
});

test("the trend can be read as a table", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("radio", { name: /table/i }).click();
  await expect(page.getByRole("table", { name: "Monthly spending" }).getByRole("row")).toHaveCount(13);
});

test("no horizontal scrolling at any width", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Total spent")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

for (const path of ["/", "/transactions"]) {
  test(`no serious accessibility problems on ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await page.waitForLoadState("networkidle");
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = violations.filter((v) => ["serious", "critical"].includes(v.impact));
    expect(serious.map((v) => `${v.id}: ${v.nodes.length} × ${v.help}`)).toEqual([]);
  });
}

test("switching customer by searching", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Thandiwe");
  await page.getByRole("button", { name: /viewing as/i }).click();
  await page.getByRole("combobox", { name: /search viewing as/i }).fill("merwe");
  await expect(page.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Pieter");
  await expect(page.getByRole("button", { name: /viewing as: pieter/i })).toBeFocused();
});

test("a customer with no budgets sees the empty state, not an empty card", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /viewing as/i }).click();
  await page.getByRole("combobox").fill("fatima");
  await page.keyboard.press("Enter");
  await expect(page.getByText("No budgets set")).toBeVisible();
});

test("everything clickable shows a pointer, and a disabled button does not", async ({ page }) => {
  await page.goto("/transactions");
  await expect(page.getByText(/^1–20 of/)).toBeVisible();
  const cursor = (loc) => loc.evaluate((el) => getComputedStyle(el).cursor);
  expect(await cursor(page.getByRole("button", { name: "Next page" }))).toBe("pointer");
  expect(await cursor(page.getByRole("button", { name: /viewing as/i }))).toBe("pointer");
  expect(await cursor(page.getByLabel("Sort by"))).toBe("pointer");
  expect(await cursor(page.getByRole("link", { name: "Overview" }))).toBe("pointer");
  expect(await cursor(page.getByRole("button", { name: "Previous page" }))).toBe("not-allowed");
});

test("clicking a slice of the donut opens that category's transactions", async ({ page, isMobile }) => {
  await page.goto("/");
  const first = page.getByRole("list", { name: "Spending by category" }).getByRole("link").first();
  const name = (await first.locator("span.truncate").innerText()).trim();
  // The first slice is the largest category, drawn clockwise from twelve o'clock. Aim
  // at a point on the ring just past twelve: the centre of a curved slice's bounding box
  // usually falls in the donut's hole.
  const chart = page.locator("figure svg").first();
  await expect(chart).toBeVisible();
  // On a phone the donut is below the fold.
  await chart.scrollIntoViewIfNeeded();
  const box = await chart.boundingBox();
  const r = box.width * 0.37;
  const angle = (15 * Math.PI) / 180;
  const x = box.x + box.width / 2 + r * Math.sin(angle);
  const y = box.y + box.height / 2 - r * Math.cos(angle);
  if (isMobile) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
  await expect(page).toHaveURL(/\/transactions$/);
  await expect(page.getByLabel("Category")).toHaveValue(name);
});
