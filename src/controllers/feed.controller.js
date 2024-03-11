const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Parser = require('rss-parser');
const parser = new Parser();

let latestData = []; // To store the latest fetched data

exports.getFeed = catchAsync(async (req, res, next) => {
  try {
    if (latestData.length === 0) {
      // Fetch and save data for the first time
      await fetchAndStoreData();
    }

    // Schedule the data refresh at regular intervals (e.g., every 1 hour)
    setInterval(fetchAndStoreData, 60 * 60 * 1000);

    res.status(200).json({
      message: "Latest data fetched successfully.",
      data: {
        latestItems: latestData,
      },
    });
  } catch (error) {
    console.error('An error occurred:', error.message);
    next(new AppError('An error occurred. Please try again.', 500));
  }
});

async function fetchAndStoreData() {
  try {
    const feedURLs = [
      'http://feeds.bbci.co.uk/news/health/rss.xml',
      // Add more RSS feed URLs here as needed
    ];

    const fetchPromises = feedURLs.map(url => parser.parseURL(url));
    const results = await Promise.all(fetchPromises);

    const newData = [];

    for (const feed of results) {
      if (feed && feed.items && feed.items.length > 0) {
        for (const item of feed.items) {
          newData.push({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
          });
        }
      }
    }

    if (newData.length > 0) {
      latestData = newData;
      console.log('Latest data fetched successfully.');
      console.log('Latest Data:', latestData);
    } else {
      console.log('No items found in the feeds.');
    }
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}
