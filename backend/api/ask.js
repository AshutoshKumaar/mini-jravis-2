import axios from 'axios';
import moment from 'moment';
import geoip from 'geoip-lite';
import { exec } from 'child_process';
import { promisify } from 'util';

const openImport = import('open');
const getPublicIPImport = import('public-ip');

const execAsync = promisify(exec);

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question } = req.body;
  const q = question.toLowerCase();
  let answer = 'Maaf kijiye, main samajh nahi paya.';

  const open = (await openImport).default;
  const getPublicIP = (await getPublicIPImport).default;

  // YouTube Play (Can't open browser in serverless)
  if (q.includes('jarvis') && (q.includes('play') || q.includes('baja de') || q.includes('chalao'))) {
    const searchQuery = q.replace(/jarvis|play|baja de|chalao/g, '').trim();
    const videoURL = await getYouTubeTopResult(searchQuery);
    answer = videoURL
      ? `"${searchQuery}" YouTube par chalaane ke liye ye link hai: ${videoURL}`
      : 'Video link laane mein dikkat aayi.';
  }

  // Application open/close can't be done on Vercel
  else if (q.includes('open') || q.includes('close')) {
    answer = 'Serverless environment mein application kholna ya band karna possible nahi hai.';
  }

  // Date
  else if (q.includes('date')) {
    const today = moment().format('D MMMM YYYY');
    answer = `Aaj ki tareekh hai ${today}.`;
  }

  // Time
  else if (q.includes('time') || q.includes('samay')) {
    const time = moment().format('h:mm A');
    answer = `Abhi ka samay hai ${time}.`;
  }

  // City
  else if (q.includes('city') || q.includes('location') || q.includes('shehar')) {
    try {
      const ip = await getPublicIP();
      const geo = geoip.lookup(ip);
      answer = geo?.city ? `Aap ka shehar hai ${geo.city}.` : 'Shehar ka pata nahi chal paya.';
    } catch (err) {
      console.error(err);
      answer = 'Shehar ki jankari laane mein dikkat aayi.';
    }
  }

  // Season
  else if (q.includes('season') || q.includes('ritu')) {
    const month = new Date().getMonth() + 1;
    const season = getSeason(month);
    answer = `Abhi ${season} ka mausam hai.`;
  }

  // Weather
  else if (q.includes('weather') || q.includes('mausam')) {
    try {
      const ip = await getPublicIP();
      const geo = geoip.lookup(ip);
      if (geo && geo.city) {
        const apiKey = 'YOUR_OPENWEATHER_API_KEY';
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

  res.status(200).json({ answer });
}
