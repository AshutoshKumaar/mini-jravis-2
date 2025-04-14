const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const axios = require('axios');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

let open;
(async () => {
  open = (await import('open')).default;
})();

const getYouTubeTopResult = async (query) => {
  try {
    const response = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
    const html = response.data;
    const videoIdMatch = html.match(/"videoId":"(.*?)"/);

    if (videoIdMatch && videoIdMatch[1]) {
      const videoId = videoIdMatch[1];
      return `https://www.youtube.com/watch?v=${videoId}`;
    } else {
      return null;
    }
  } catch (error) {
    console.error('🔴 YouTube Fetch Error:', error.message);
    return null;
  }
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
  }

  else if (q.includes('close')) {
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
  }

  else if (q.includes('jarvis') || q.includes('open')) {
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
  }

  res.json({ answer });
});

app.listen(port, () => {
  console.log(`🧠 Jarvis backend running at http://localhost:${port}`);
});
