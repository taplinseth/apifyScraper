import { Actor } from "apify";
import { PuppeteerCrawler } from "crawlee";
import { router } from "./routes.js";
import { executeScrape } from "./jobSearch.js";

// Initialize the Apify SDK
await Actor.init();

// Call executeScrape to generate start URLs
const startUrls = await executeScrape();

// const proxyConfiguration = await Actor.createProxyConfiguration();

const crawler = new PuppeteerCrawler({
  // proxyConfiguration,
  requestHandler: router,
});

await crawler.run(startUrls);

// Exit successfully
await Actor.exit();