import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const speech = new window.webkitSpeechRecognition();
    speech.lang = 'en-US';
    speech.continuous = true;
    speech.interimResults = false;

    speech.onstart = () => setListening(true);
    speech.onend = () => setListening(false);

    speech.onresult = async (event) => {
      const spokenText = event.results[event.results.length - 1][0].transcript;
      setTranscript(spokenText);

      if (spokenText.toLowerCase().includes('stop listening')) {
        speech.stop();
        setResponse('Okay, stopped listening.');
        const utterance = new SpeechSynthesisUtterance('Okay, stopped listening.');
        window.speechSynthesis.speak(utterance);
        return;
      }

      try {
        const res = await axios.post('http://localhost:5000/api/ask', {
          question: spokenText,
        });
        setResponse(res.data.answer);

        const utterance = new SpeechSynthesisUtterance(res.data.answer);
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        setResponse('Error connecting to Jarvis.');
      }
    };

    setRecognition(speech);
  }, []);

  const toggleListening = () => {
    if (recognition) {
      if (listening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white font-sans">
      <h1 className="text-4xl mb-6 font-bold">🤖 Jarvis - Voice Assistant</h1>
      <button
        onClick={toggleListening}
        className={`px-6 py-3 mb-6 rounded-full text-lg font-medium transition-all ${listening ? 'bg-red-600' : 'bg-green-500'}`}
      >
        {listening ? '🛑 Stop Listening' : '🎙️ Start Talking'}
      </button>
      <p className="mb-4"><strong>You said:</strong> {transcript}</p>
      <p className="text-blue-400"><strong>Jarvis:</strong> {response}</p>
    </div>
  );
}

export default App;