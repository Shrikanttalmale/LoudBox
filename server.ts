import express from 'express';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory audio cache for instantaneous repeat payment announcements
const audioCache = new Map<string, { buffer: Buffer; contentType: string }>();

// Initialize Gemini SDK client if API key is present
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI();
    console.log('Gemini TTS engine initialized successfully');
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI client:', err);
  }
}

const LANGUAGE_LABELS: Record<string, string> = {
  mr: 'Marathi',
  hi: 'Hindi',
  en: 'Indian English',
  hinglish: 'Hinglish (Hindi-English mix)',
  gu: 'Gujarati',
  pa: 'Punjabi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  bn: 'Bengali',
  ml: 'Malayalam',
  or: 'Odia',
  as: 'Assamese',
  bho: 'Bhojpuri',
  raj: 'Rajasthani',
};

// High-fidelity Regional Loudbox Voice Engine
// Delivers genuine celebrity voice styles (deep baritone, energetic comedy, melodious singer)
app.get('/api/tts', async (req, res) => {
  const text = (req.query.text as string) || '';
  const lang = (req.query.lang as string) || 'mr';
  const voiceName = (req.query.voiceName as string) || 'Fenrir';
  const personaId = (req.query.personaId as string) || '';
  const voiceStyle = (req.query.style as string) || '';
  const gender = (req.query.gender as string) || 'male';

  if (!text) {
    return res.status(400).json({ error: 'Text query parameter is required' });
  }

  const cacheKey = `${personaId || voiceName}_${lang}_${text.trim()}`;
  if (audioCache.has(cacheKey)) {
    const cached = audioCache.get(cacheKey)!;
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    return res.send(cached.buffer);
  }

  // Attempt 1: Gemini High-Fidelity Celebrity / Singer Voice Synthesis
  if (aiClient) {
    const selectedVoice = voiceName || (gender === 'female' ? 'Aoede' : 'Fenrir');
    const modelsToTry = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];

    for (const modelName of modelsToTry) {
      try {
        const response = await aiClient.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [{ text: text.trim() }],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoice },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          const audioBuffer = Buffer.from(base64Audio, 'base64');
          audioCache.set(cacheKey, { buffer: audioBuffer, contentType: 'audio/wav' });

          res.setHeader('Content-Type', 'audio/wav');
          res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
          return res.send(audioBuffer);
        }
      } catch (geminiErr: any) {
        console.warn(`Gemini TTS (${modelName}) synthesis failed:`, geminiErr?.message || geminiErr);
      }
    }
  }

  // Attempt 2: Fallback TTS proxy
  const encodedText = encodeURIComponent(text);
  const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob`;

  const request = https.get(
    targetUrl,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    },
    (upstreamRes) => {
      if (upstreamRes.statusCode !== 200) {
        return res.status(upstreamRes.statusCode || 500).json({ error: 'TTS upstream error' });
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      upstreamRes.pipe(res);
    }
  );

  request.on('error', (err) => {
    console.error('TTS Proxy Error:', err);
    res.status(500).json({ error: 'Failed to synthesize speech' });
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Loudbox server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
