const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const User = require('../models/User');
const router = express.Router();
const request = require('request');
const collegeData = require('../data/collegeCriteria.json');
require('dotenv').config();
const rateLimit = require('express-rate-limit');

// Set up rate limiter: maximum of 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Fetch redirected URL
async function fetchRedirectedUrl(url) {
  return new Promise((resolve, reject) => {
    request.get(url, function (err, res, body) {
      if (err) {
        reject(err);
      } else {
        resolve(this.uri.href);
      }
    });
  });
}

// Fetch data from SkillRack profile
async function fetchData(url) {
  try {
    // Extract the resume id from the URL
    const urlParams = new URLSearchParams(new URL(url).search);
    const id = urlParams.get('id');

    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Extract data from the page
    const rawText = $('div.ui.four.wide.center.aligned.column').text().trim().split('\n');
    const name = rawText[0].trim();
    const dept = rawText[4].trim();
    const year = rawText[8].trim().match(/\d{4}$/)[0];
    const college = rawText[6].trim();
    const codeTutor = parseInt($('div:contains("DT")').next().find('.value').text().trim()) || 0;
    const codeTrack = parseInt($('div:contains("CODE TEST")').next().find('.value').text().trim()) || 0;
    const codeTest = parseInt($('div:contains("PROGRAMS SOLVED")').next().find('.value').text().trim()) || 0;
    const dt = parseInt($('div:contains("DC")').next().find('.value').text().trim()) || 0;
    const dc = parseInt($('div:contains("CODE TRACK")').next().find('.value').text().trim()) || 0;

    // Calculate points and percentage
    const points = codeTrack * 2 + codeTest * 30 + dt * 20 + dc * 2;

    let requiredPoints = 0;
    let deadline = null;

    const getCollegeCriteria = (collegeName, year) => {
      const college = collegeData.colleges.find(c => c.name === collegeName);
      if (college) {
        const requiredPointsMatch = college.criteria.find(c => c.years.includes(year));
        const deadlineMatch = college.criteria.find(c => c.years.includes(year) && c.deadline);

        if (requiredPointsMatch) {
          requiredPoints = requiredPointsMatch.requiredPoints;
        }
        if (deadlineMatch) {
          deadline = deadlineMatch.deadline;
        }
      }
    };

    if (college) {
      getCollegeCriteria(college, year);
    }

    const percentageCalculate = ((points / requiredPoints) * 100).toFixed(2);
    const percentage = !isFinite(percentageCalculate) ? 100 : percentageCalculate;

    // Format last fetched date
    const date = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
    const lastFetched = date.split(',')[1].trim();

    console.log({ id, name, dept, year, college, codeTutor, codeTrack, codeTest, dt, dc, points, requiredPoints, deadline, percentage, lastFetched, url}); // Log the parsed values

    return { id, name, dept, year, college, codeTutor, codeTrack, codeTest, dt, dc, points, requiredPoints, deadline, percentage, lastFetched, url};
  } catch (error) {
    console.error(`Invalid URL: ${url}`);
    return null;
  }
}

const IS_RECORD_ENABLED = process.env.IS_RECORD_ENABLED === 'true';

// Send log message
async function sendLogMessage(message, topic) {
  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: chatId,
      message_thread_id: topic,
      text: message,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error sending Log message:', error);
  }
}

// Handle POST request for tracking points
router.post('/', limiter, async (req, res) => {
  // Clear cookie set by server
  if (req.cookies.lastUrl) {
    res.clearCookie('lastUrl');
  }

  let { url } = req.body;
  const allowedDomains = ['example.com', 'another-example.com']; // Add your allowed domains here
  try {
    const parsedUrl = new URL(url);
    if (!allowedDomains.includes(parsedUrl.hostname)) {
      return res.status(400).json({ error: 'Invalid URL domain' });
    }

    if (!url.includes('resume')) {
      url = await fetchRedirectedUrl(url);
      console.log("fetched");
      if (!url) {
        return res.status(500).json({ error: 'Failed to fetch redirected URL' });
      }
    }
    
    const data = await fetchData(url);
    if (!data) {
      return res.status(500).json({ error: 'Failed to fetch data' });
    }

    if (IS_RECORD_ENABLED) {
      // Perform database operations before sending response
      let user = await User.findOne({ id: data.id });
      const logMessage = `\`${data.name} (${data.dept}'${data.year.slice(-2)})\`\n\n\`(${data.codeTutor} x 0) + (${data.codeTrack} x 2) + (${data.codeTest} x 30) + (${data.dt} x 20) + (${data.dc} x 2) = ${data.points} (${data.percentage}%)\`\n\n`;
      if (data.name !== '') {
        if (!user) {
          user = new User({ id: data.id, name: data.name, dept: data.dept, url: url });
          await user.save();
          console.log(`${data.name} is stored in DB`);
          await sendLogMessage(logMessage + `[Profile](${data.url})`, process.env.TOPIC1_ID); // Registered
        } else {
          await sendLogMessage(logMessage, process.env.TOPIC2_ID); // Logged in
        }
      }
    }

    res.json(data);
  } catch (error) {
      console.error('Error in request processing:', error);
      res.status(500).json({ error: 'An error occurred while processing the request' });
    }
});

// Handle GET request for refreshing data
router.get('/refresh', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  const data = await fetchData(url);
  if (data) {
    const logMessage = `\`${data.name} (${data.dept}'${data.year.slice(-2)})\`\n\n\`(${data.codeTutor} x 0) + (${data.codeTrack} x 2) + (${data.codeTest} x 30) + (${data.dt} x 20) + (${data.dc} x 2) = ${data.points} (${data.percentage}%)\`\n\n`;
    if (IS_RECORD_ENABLED) {
      await sendLogMessage(logMessage, process.env.TOPIC3_ID); // Refreshed
    }
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to fetch data after retry' });
  }
});

module.exports = router;
