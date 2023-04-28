import { createPuppeteerRouter } from "crawlee";
import { getJobData } from "./jobSearch.js";
import { executeScrape } from "./jobSearch.js";

export const router = createPuppeteerRouter();

router.addDefaultHandler(async ({ enqueueLinks, log }) => {
  log.info(`Enqueueing start URLs`);
  const startUrls = await executeScrape();
  await enqueueLinks({
    urls: startUrls,
    label: "detail",
  });
});

router.addHandler("detail", async ({ request, page, log }) => {
    const jobData = await getJobData(request.url);

    log.info("Job Data:", { jobData });
  });
