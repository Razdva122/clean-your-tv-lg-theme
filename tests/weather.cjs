"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path"),
  t = require("../lib/toolkit.cjs");
test("synthetic weather fixture has four bounded daily ranges and no IP metadata", () => {
  const f = require("../lib/weather-preview.cjs");
  assert.equal(f.fixture("forecast").daily.time.length, 4);
  assert.equal(f.fixture("search").results[0].name, "Berlin");
  assert(!JSON.stringify(f.fixture("auto")).includes('"ip"'));
});
test(
  "author weather controls render both editions without provider requests",
  { skip: !process.env.CYTV_THEME_RUNTIME || !process.env.CYTV_THEME_BROWSER },
  async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ctv-weather-author-"));
    let browser;
    try {
      t.init(path.join(dir, "theme"));
      const file = path.join(dir, "theme/theme.json"),
        m = JSON.parse(fs.readFileSync(file));
      m.layout.weather = {
        formats: ["text", "current", "details", "forecast"],
        scale: 1,
        padding: 24,
        icons: "monochrome",
      };
      fs.writeFileSync(file, JSON.stringify(m));
      browser = await require("playwright").chromium.launch({
        headless: true,
        executablePath: process.env.CYTV_THEME_BROWSER,
      });
      for (const edition of ["no-root", "root"]) {
        const p = await t.preview(
          path.join(dir, "theme"),
          t.runtime(process.env.CYTV_THEME_RUNTIME),
          { edition },
        );
        let page;
        try {
          page = await browser.newPage({
            viewport: { width: 1440, height: 900 },
          });
          let providers = 0;
          page.on("request", (r) => {
            if (/open-meteo|geojs/.test(r.url())) providers++;
          });
          await page.goto(p.url);
          const frame = page
            .frames()
            .find((f) => f.url().includes("/runtime/"));
          await frame.waitForFunction(
            () => window.HomeWeather && window.RootLauncherRendered,
          );
          await page.locator("#weatherFormat").selectOption("forecast");
          await frame.locator("#homeWeather .weather-row").last().waitFor();
          assert.equal(
            await frame.locator("#homeWeather .weather-row").count(),
            4,
          );
          await page.locator("#weatherUnits").selectOption("imperial");
          await frame.waitForFunction(
            () => HomeWeather.store.state().units === "imperial",
          );
          await frame.waitForFunction(() =>
            /27/.test(
              document.querySelector("#homeWeather .weather-temp").textContent,
            ),
          );
          await page.locator("#weatherFormat").selectOption("off");
          await frame.locator("#homeWeather").waitFor({ state: "hidden" });
          assert.equal(
            providers,
            0,
            "synthetic preview never dispatches city/IP/forecast requests",
          );
        } finally {
          if (page) await page.close();
          p.server.closeAllConnections();
          await new Promise((r) => p.server.close(r));
        }
      }
    } finally {
      if (browser) await browser.close();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  },
);

test("weather refuses old contracts and compilers that drop its declaration", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ctv-weather-contract-"));
  try {
    const source = path.join(dir, "theme");
    t.init(source);
    const file = path.join(source, "theme.json"),
      m = JSON.parse(fs.readFileSync(file));
    m.layout.weather = { formats: ["text"] };
    fs.writeFileSync(file, JSON.stringify(m));
    fs.writeFileSync(
      path.join(dir, "compiler.cjs"),
      "exports.compileSource=()=>({manifest:{layout:{},requires:{capabilities:[]}}});",
    );
    fs.writeFileSync(
      path.join(dir, "contract.json"),
      JSON.stringify({ optionalCapabilities: {} }),
    );
    const rt = {
      root: dir,
      meta: { compiler: "compiler.cjs", contract: "contract.json" },
      inventory: new Map([["contract.json", {}]]),
    };
    await assert.rejects(t.compile(source, rt), /update-runtime:.*weather-v1/);
    fs.writeFileSync(
      path.join(dir, "contract.json"),
      JSON.stringify({ optionalCapabilities: { "weather-v1": {} } }),
    );
    await assert.rejects(
      t.compile(source, rt),
      /update-runtime:.*did not preserve.*weather/,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
