import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL}/auth/google/callback`
);

// --- Google OAuth Routes ---

app.get('/api/auth/google/url', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  res.json({ url });
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    
    // Send tokens back to the opener window and close the popup
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'GOOGLE_AUTH_SUCCESS', 
                tokens: ${JSON.stringify(tokens)} 
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.status(500).send('Authentication failed');
  }
});

// --- Calendar API Endpoints ---

app.post('/api/calendar/events', async (req, res) => {
  const { tokens } = req.body;
  if (!tokens) return res.status(401).json({ error: 'No tokens provided' });

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json(response.data.items);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.post('/api/calendar/add', async (req, res) => {
  const { tokens, event } = req.body;
  if (!tokens) return res.status(401).json({ error: 'No tokens provided' });

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error adding calendar event:', error);
    res.status(500).json({ error: 'Failed to add event' });
  }
});

// --- Invite Endpoint ---

app.post('/api/invite', async (req, res) => {
  const { email, name, role, organizationName, inviterName, appUrl } = req.body;
  if (!email || !organizationName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'Gradevinski Dnevnik <noreply@gradevinski-dnevnik.com>';

  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping email send');
    return res.json({ sent: false, reason: 'no_api_key' });
  }

  const resend = new Resend(apiKey);
  const loginUrl = appUrl || 'http://localhost:3000';
  const roleLabel = role === 'admin' ? 'administrator' : 'radnik';

  try {
    await resend.emails.send({
      from,
      to: email,
      subject: `Pozivnica za tim — ${organizationName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #18181b;">
          <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">Pozivnica za tim</h2>
          <p style="color: #71717a; margin-bottom: 24px; font-size: 15px;">
            ${inviterName ? `<strong>${inviterName}</strong> vas je pozvao/la` : 'Pozvani ste'} da se pridružite tvrtki
            <strong>${organizationName}</strong> u aplikaciji Gradevinski Dnevnik kao <strong>${roleLabel}</strong>.
          </p>
          ${name ? `<p style="margin-bottom: 24px; font-size: 15px;">Vaše ime: <strong>${name}</strong></p>` : ''}
          <a href="${loginUrl}" style="display: inline-block; background: #18181b; color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Prihvati pozivnicu
          </a>
          <p style="margin-top: 24px; font-size: 13px; color: #a1a1aa;">
            Prijavite se Google računom na gornju adresu. Vaš pristup bit će automatski aktiviran.
          </p>
        </div>
      `
    });
    res.json({ sent: true });
  } catch (error: any) {
    console.error('Resend error:', error);
    res.status(500).json({ error: 'Failed to send invitation email' });
  }
});

// --- Vite Middleware ---

async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
