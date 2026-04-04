import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-03-31.basil' })
  : null;

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Must be registered BEFORE express.json() so the Stripe webhook receives the raw body Buffer
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

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
  const { email, name, role, organizationName: orgNameParam, projectName, inviterName, appUrl } = req.body;
  const organizationName = orgNameParam ?? projectName;
  if (!email || !organizationName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'Gradevinski Dnevnik <invites@elektro.gradevinskidnevnik.online>';

  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping email send');
    return res.json({ sent: false, reason: 'no_api_key' });
  }

  const resend = new Resend(apiKey);
  const loginUrl = appUrl || 'http://localhost:3000';
  const isProjectInvite = req.body.type === 'project_invite';
  const roleLabel = isProjectInvite
    ? (role === 'lead' ? 'voditelj' : role === 'contributor' ? 'suradnik' : 'gledatelj')
    : (role === 'admin' ? 'administrator' : 'radnik');
  const entityWord = isProjectInvite ? 'projektu' : 'tvrtki';

  try {
    await resend.emails.send({
      from,
      to: email,
      subject: `Pozivnica za ${isProjectInvite ? 'projekt' : 'tim'} — ${organizationName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #18181b;">
          <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">Pozivnica za ${isProjectInvite ? 'projekt' : 'tim'}</h2>
          <p style="color: #71717a; margin-bottom: 24px; font-size: 15px;">
            ${inviterName ? `<strong>${inviterName}</strong> vas je pozvao/la` : 'Pozvani ste'} da se pridružite ${entityWord}
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

// --- Waitlist Endpoint ---

app.post('/api/waitlist', async (req, res) => {
  const { email, discipline, name, company } = req.body;

  if (!email || !discipline) {
    return res.status(400).json({ error: 'Nedostaju obavezni podaci.' });
  }

  const validDisciplines = ['voda_plin', 'klima_ventilacija', 'master'];
  if (!validDisciplines.includes(discipline)) {
    return res.status(400).json({ error: 'Nepoznata disciplina.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Neispravna email adresa.' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
    );

    const { error: dbError } = await supabase
      .from('waitlist')
      .insert({ email, discipline, name: name || null, company: company || null });

    if (dbError && dbError.code !== '23505') {
      console.error('Waitlist insert error:', dbError);
      return res.status(500).json({ error: 'Greška pri pohrani.' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const notifyEmail = process.env.NOTIFY_EMAIL;
    if (apiKey && notifyEmail) {
      const resend = new Resend(apiKey);
      const disciplineLabels: Record<string, string> = {
        voda_plin: 'Voda i plin',
        klima_ventilacija: 'Klima i ventilacija',
        master: 'Master platforma (investitori / generalni izvođači)',
      };
      resend.emails.send({
        from: process.env.RESEND_FROM || 'Gradevinski Dnevnik <noreply@elektro.gradevinskidnevnik.online>',
        to: notifyEmail,
        subject: `Waitlist — ${disciplineLabels[discipline] || discipline}`,
        html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#192a46;">
          <h2 style="font-size:20px;font-weight:700;margin-bottom:16px;">Nova waitlist prijava</h2>
          <p><strong>Disciplina:</strong> ${disciplineLabels[discipline] || discipline}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${name ? `<p><strong>Ime:</strong> ${name}</p>` : ''}
          ${company ? `<p><strong>Tvrtka:</strong> ${company}</p>` : ''}
          <p style="margin-top:24px;font-size:13px;color:#8fa0b8;">Vidljivo u Super Admin → Waitlist</p>
        </div>`,
      }).catch(err => console.error('Waitlist notify error:', err));
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Waitlist error:', err);
    res.status(500).json({ error: 'Greška servera.' });
  }
});

// --- Billing Endpoints ---

app.post('/api/billing/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Billing not configured (STRIPE_SECRET_KEY missing)' });
  }

  const { orgId, userEmail } = req.body;
  if (!orgId || !userEmail) {
    return res.status(400).json({ error: 'Missing orgId or userEmail' });
  }

  const priceId = process.env.STRIPE_PRICE_ID_PRO;
  if (!priceId) {
    return res.status(503).json({ error: 'Billing not configured (STRIPE_PRICE_ID_PRO missing)' });
  }

  try {
    // Retrieve or create Stripe customer for this org
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', orgId)
      .single();

    let customerId: string | undefined = org?.stripe_customer_id ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { orgId },
      });
      customerId = customer.id;
      await supabaseAdmin
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', orgId);
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/billing?upgraded=true`,
      cancel_url: `${appUrl}/billing?cancelled=true`,
      metadata: { orgId },
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.post('/api/stripe/webhook', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Billing not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err: any) {
    console.error('Stripe webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.orgId;
        if (orgId) {
          await supabaseAdmin
            .from('organizations')
            .update({
              subscription_status: 'pro',
              stripe_customer_id: session.customer as string,
            })
            .eq('id', orgId);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        await supabaseAdmin
          .from('organizations')
          .update({ subscription_status: 'cancelled' })
          .eq('stripe_customer_id', customerId);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        await supabaseAdmin
          .from('organizations')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId);
        break;
      }
      default:
        // Unhandled event type — no action needed
        break;
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// --- Static pages (privacy, terms, homepage) ---

const publicPath = path.join(__dirname, 'public');

app.get('/privacy', (_req, res) => {
  res.sendFile(path.join(publicPath, 'privacy.html'));
});

app.get('/terms', (_req, res) => {
  res.sendFile(path.join(publicPath, 'terms.html'));
});

// Root domain homepage (gradevinskidnevnik.online without subdomain)
app.get('/', (req, res, next) => {
  const host = req.hostname;
  if (host === 'gradevinskidnevnik.online' || host === 'www.gradevinskidnevnik.online') {
    res.sendFile(path.join(publicPath, 'homepage.html'));
    return;
  }
  next();
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
