const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data storage directory
const DATA_DIR = path.join(__dirname, 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

function ensureDataStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BOOKINGS_FILE)) {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}
ensureDataStorage();

// API: Save Contact Message (Messages tab)
app.post('/api/contact-message', async (req, res) => {
  try {
    const message = {
      id: 'MSG-' + Date.now(),
      timestamp: new Date().toISOString(),
      dhakaTime: new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }),
      ...req.body
    };

    try {
      ensureDataStorage();
      const current = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8') || '[]');
      current.unshift(message);
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(current, null, 2), 'utf8');
    } catch (fsErr) {
      console.error('Messages file save warning:', fsErr);
    }

    res.json({ success: true, messageId: message.id });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// API: List Messages
app.get('/api/messages', (req, res) => {
  try {
    ensureDataStorage();
    const data = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8') || '[]');
    res.json({ success: true, count: data.length, messages: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Save Service Booking (Bookings tab)
app.post('/api/book-service', async (req, res) => {
  try {
    const booking = {
      id: 'BK-' + Date.now(),
      timestamp: new Date().toISOString(),
      dhakaTime: new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }),
      ...req.body
    };

    // Save to local file
    try {
      ensureDataStorage();
      const current = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8') || '[]');
      current.unshift(booking);
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(current, null, 2), 'utf8');
    } catch (fsErr) {
      console.error('File save warning:', fsErr);
    }

    res.json({
      success: true,
      message: 'Service booking recorded successfully',
      bookingId: booking.id
    });
  } catch (error) {
    console.error('Booking API error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// API: Config
app.get('/api/config', (req, res) => {
  res.json({
    googleScriptUrl:
      process.env.GOOGLE_SCRIPT_URL ||
      'https://script.google.com/macros/s/AKfycbz16uxYP0BOLHZi3ymkFZJfrpIUZdK3dhADmD-ABvBwpm-wUeYNcxRm5iOLpVdyz0yp/exec'
  });
});

// API: Export Bookings as CSV
app.get('/api/export-bookings.csv', (req, res) => {
  try {
    ensureDataStorage();
    const data = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8') || '[]');
    const headers = ['ID', 'Date (Dhaka)', 'Client Name', 'Mobile', 'Location', 'Service Title', 'Amount (BDT)', 'Gateway', 'Payment Number', 'TrxID', 'Notes'];
    const rows = data.map(b => [
      `"${b.id || ''}"`,
      `"${b.dhakaTime || b.timestamp || ''}"`,
      `"${(b.Name || b.name || '').replace(/"/g, '""')}"`,
      `"${(b.Mobile || b.mobile || '').replace(/"/g, '""')}"`,
      `"${(b.Location || b.location || '').replace(/"/g, '""')}"`,
      `"${(b['Services Title'] || b.service_title || '').replace(/"/g, '""')}"`,
      `"${(b['Amount (BDT)'] || b.service_price || b.Price || '').replace(/"/g, '""')}"`,
      `"${(b['Payment Gateway'] || b.payment_gateway || '').replace(/"/g, '""')}"`,
      `"${(b['Payment Number'] || b.payment_number || '').replace(/"/g, '""')}"`,
      `"${(b.TrxID || b.trx_id || '').replace(/"/g, '""')}"`,
      `"${(b.Notes || b.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="service_bookings.csv"');
    res.send('\uFEFF' + csvContent);
  } catch (err) {
    res.status(500).send('Error generating CSV');
  }
});

// API: List Bookings
app.get('/api/bookings', (req, res) => {
  try {
    ensureDataStorage();
    const data = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8') || '[]');
    res.json({ success: true, count: data.length, bookings: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve static assets from project root
app.use(express.static(__dirname));

// Fallback to index.html for client routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});

