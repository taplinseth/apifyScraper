import puppeteer from "puppeteer-extra";
import pluginStealth from "puppeteer-extra-plugin-stealth";
import { executablePath } from "puppeteer";
import dotenv from "dotenv";
import fetch from "node-fetch";
const { Headers } = fetch;
import FormData from "form-data";

puppeteer.use(pluginStealth());
const launchOptions = { headless: false, executablePath: executablePath(), slowMo: 50 };

export async function getJobData(searchTerm, location, remote, experience, last24H) {
  const url = `https://www.indeed.com/jobs?q=${searchTerm}&l=${location}&sc=0kf%3A${remote}explvl%28${experience}%29%3B&radius=50${last24H}&vjk=2b9775de01edc6d0`;

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      ...launchOptions
    });
    const page = await browser.newPage();

    await page.goto(url);
    await page.waitFor(1000);

    await page.waitForSelector('.jobsearch-JobCountAndSortPane-jobCount');
    const numberOfJobs = await page.evaluate(() => {
      const element = document.querySelector(
        ".jobsearch-JobCountAndSortPane-jobCount span"
      ).innerText;
      let jobsNumber = element.replace(/[^0-9]/g, "");
      console.log(jobsNumber)
      return jobsNumber;
    });

    await browser.close();
    return {
      numberOfJobs,
      timeStamp: new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }),
    };
  } catch (error) {
    console.log(`Error scraping data: ${error}`);
    throw error;
  }
}

const requestOptions = {
  method: "GET",
  redirect: "follow",
};

const last24H = "&fromage=1";

dotenv.config();
const TOKEN = process.env.TOKEN;

export async function executeScrape() {
  try {
    const response = await fetch(
      "https://learning.careers/version-test/api/1.1/obj/search",
      requestOptions
    );
    const searchData = await response.json();
    const startUrls = searchData.response.results.map((searchItem) => {
      let searchTerm = searchItem.term;
      let location = searchItem.location;
      let remote = searchItem.remote;
      let experience = searchItem.experience;
      let searchId = searchItem.searchId;

      if (experience === "entryLevel") {
        experience = "ENTRY_LEVEL";
      } else if (experience === "midLevel") {
        experience = "MID_LEVEL";
      } else {
        experience = "SENIOR_LEVEL";
      }

      if (remote === true) {
        remote = "attr%28DSQF7%29"; //this is the text needed for remote a job search
      } else {
        remote = "";
      }

      return `https://www.indeed.com/jobs?q=${searchTerm}&l=${location}&sc=0kf%3A${remote}explvl%28${experience}%29%3B&radius=50${last24H}&vjk=2b9775de01edc6d0`;
    });

    searchData.response.results.forEach(async (searchData) => {
      let searchTerm = searchData.term;
      let location = searchData.location;
      let remote = searchData.remote;
      let experience = searchData.experience;
      let searchId = searchData.searchId;

      try {
        // calls scraper function
        const jobData = await getJobData(
          searchTerm,
          location,
          remote,
          experience,
          last24H
        );

        const timeStamp = jobData.timeStamp;
        const myHeaders = new Headers();
        myHeaders.append("Authorization", `Bearer ${TOKEN}`);

        const formdata = new FormData();
        formdata.append("jobValue", jobData.numberOfJobs);
        formdata.append("searchDate", timeStamp);
        formdata.append("searchId", searchId);

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: formdata,
          redirect: "follow",
        };

        // fetch request to post jobData
        // const postResponse = await fetch(
        //   "https://learning.careers/version-test/api/1.1/obj/jobData",
        //   requestOptions
        // );

        // const postResult = await postResponse.text();
        // console.log(postResult);
      } catch (error) {
        console.log("Error:", error);
      }
    });
    
    return startUrls;
  } catch (error) {
    console.log("Error fetching search data:", error);
    throw error;
  }
}