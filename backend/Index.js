const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const axios = require('axios');
const moment = require('moment');
const geoip = require('geoip-lite');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

let open;
let getPublicIP;

(async () => {
  open = (await import('open')).default;
  getPublicIP = (await import('public-ip')).default;
})();

const getYouTubeTopResult = async (query) => {
  try {
    const response = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
    const html = response.data;
    const videoIdMatch = html.match(/"videoId":"(.*?)"/);
    return videoIdMatch && videoIdMatch[1] ? `https://www.youtube.com/watch?v=${videoIdMatch[1]}` : null;
  } catch (error) {
    console.error('🔴 YouTube Fetch Error:', error.message);
    return null;
  }
};

const getSeason = (month) => {
  if (month >= 3 && month <= 5) return 'garmiyon';
  if (month >= 6 && month <= 8) return 'baarish';
  if (month >= 9 && month <= 11) return 'sardiyon';
  return 'sheetkal';
};

app.post('/api/ask', async (req, res) => {
  const { question } = req.body;
  const q = question.toLowerCase();
  let answer = 'Maaf kijiye, main samajh nahi paya.';

  if (q.includes('jarvis') && (q.includes('play') || q.includes('baja de') || q.includes('chalao'))) {
    const searchQuery = q.replace(/jarvis|play|baja de|chalao/g, '').trim();
    const videoURL = await getYouTubeTopResult(searchQuery);
    if (videoURL && open) {
      open(videoURL);
      answer = `"${searchQuery}" YouTube par chala raha hoon.`;
    } else {
      answer = 'Video chalane mein dikkat aayi.';
    }
  } else if (q.includes('close')) {
    const appName = q.replace(/jarvis|close/g, '').trim();
    try {
      if (appName.includes('chrome')) {
        exec('taskkill /IM chrome.exe /F');
        answer = 'Google Chrome band kar raha hoon.';
      } else if (appName.includes('notepad')) {
        exec('taskkill /IM notepad.exe /F');
        answer = 'Notepad band kar raha hoon.';
      } else if (appName.includes('word')) {
        exec('taskkill /IM winword.exe /F');
        answer = 'Word band kar raha hoon.';
      } else {
        answer = 'Yeh application band karne ka command nahi mila.';
      }
    } catch (err) {
      console.error(err);
      answer = 'App band karne mein dikkat aayi.';
    }
  } else if (q.includes('jarvis') || q.includes('open')) {
    const appName = q.replace(/jarvis|open/g, '').trim();
    try {
      if (appName.includes('chrome')) {
        exec('start chrome');
        answer = 'Google Chrome khol raha hoon.';
      } else if (appName.includes('notepad')) {
        exec('start notepad');
        answer = 'Notepad khol raha hoon.';
      } else if (appName.includes('calculator') || appName.includes('calc')) {
        exec('start calc');
        answer = 'Calculator khol raha hoon.';
      } else if (appName.includes('word')) {
        exec('start winword');
        answer = 'Microsoft Word khol raha hoon.';
      } else if (appName.includes('excel')) {
        exec('start excel');
        answer = 'Excel khol raha hoon.';
      } else if (appName.includes('vscode') || appName.includes('vs code')) {
        exec('start code');
        answer = 'VS Code khol raha hoon.';
      } else if (appName.includes('paint')) {
        exec('start mspaint');
        answer = 'Paint khol raha hoon.';
      } else if (appName.includes('settings')) {
        exec('start ms-settings:');
        answer = 'Settings khol raha hoon.';
      } else {
        answer = `"${appName}" kholne ka command mujhe nahi aata.`;
      }
    } catch (err) {
      console.error(err);
      answer = 'Application kholne mein dikkat aayi.';
    }
  } else if (q.includes('date')) {
    const today = moment().format('D MMMM YYYY');
    answer = `Aaj ki tareekh hai ${today}.`;
  } else if (q.includes('time') || q.includes('samay')) {
    const time = moment().format('h:mm A');
    answer = `Abhi ka samay hai ${time}.`;
  } else if (q.includes('city') || q.includes('location') || q.includes('shehar')) {
    try {
      const ip = await getPublicIP();
      const geo = geoip.lookup(ip);
      answer = geo?.city ? `Aap ka shehar hai ${geo.city}.` : 'Shehar ka pata nahi chal paya.';
    } catch (err) {
      console.error(err);
      answer = 'Shehar ki jankari laane mein dikkat aayi.';
    }
  } else if (q.includes('season') || q.includes('ritu')) {
    const month = new Date().getMonth() + 1;
    const season = getSeason(month);
    answer = `Abhi ${season} ka mausam hai.`;
  } else if (q.includes('weather') || q.includes('mausam')) {
    try {
      const ip = await getPublicIP();
      const geo = geoip.lookup(ip);
      if (geo && geo.city) {
        const apiKey = '1484b916a7506127fcb77c92aa667724'; // Replace with your real API key
        const weatherRes = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${geo.city}&appid=${apiKey}&units=metric&lang=hi`
        );
        const weather = weatherRes.data;
        answer = `Abhi ${geo.city} mein ${weather.weather[0].description} hai aur taapmaan ${weather.main.temp}°C hai.`;
      } else {
        answer = 'Mausam laane mein dikkat aayi.';
      }
    } catch (err) {
      console.error(err);
      answer = 'Mausam ki jankari laane mein dikkat aayi.';
    }
  }

  res.json({ answer });
});

app.listen(port, () => {
  console.log(`🧠 Jarvis backend running at http://localhost:${port}`);
});
