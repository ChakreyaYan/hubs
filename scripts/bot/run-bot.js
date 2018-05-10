#!/usr/bin/env node
const doc = `
Usage:
    ./run-bot.js [options]

Options:
    -h --host=<host>  Hubs host [default: localhost:8080]
    -r --room=<room>  Room id [default: 234234].
    -h --help         Show this screen.
    -n --bots=<bots>  Number of bots to connect [default: 1].
`;

const docopt = require("docopt").docopt;
const options = docopt(doc);

const puppeteer = require("puppeteer");
const querystring = require("query-string");

async function spawnBot(id) {
  const browser = await puppeteer.launch({
    headless: false,
    ignoreHTTPSErrors: true,
    args: ["--headless"]
  });
  const page = await browser.newPage();
  page.on("console", msg => console.log(`PAGE ${id}: `, msg.text()));
  page.on("error", err => console.error(`ERROR ${id}: `, err));
  page.on("pageerror", err => console.error(`PAGE ERROR: ${id}`, err));

  const params = {
    room: options["--room"],
    bot: true,
    name: `Bot ${id}`,
    allow_multi: true
  };
  const url = `https://${options["--host"]}/hub.html?${querystring.stringify(params)}`;

  const navigate = async () => {
    try {
      await page.goto(url);
      await page.evaluate(() => {
        console.log(navigator.userAgent);
      });
      // Interact with the page so that audio can play.
      await page.mouse.click(100, 100);
      // Signal that the page has been interacted with.
      // If the interacted function has not been defined yet, this will error and restart the process with the
      // setTimeout below.
      await page.evaluate(() => window.interacted());
    } catch (e) {
      console.log("Navigation error", e.toString());
      setTimeout(navigate, 1000);
    }
  };

  await navigate();
  console.log("Spawning bot...");
}

(async function() {
  for (let i = 0; i < options["--bots"]; i++) {
    await spawnBot(i + 1);
  }
})();