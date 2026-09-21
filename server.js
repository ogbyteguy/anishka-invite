require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'responses.json');

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// تبدیل تاریخ میلادی به شمسی (ساده و دقیق)
function toJalali(gy, gm, gd) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

function formatJalali(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const { jy, jm, jd } = toJalali(y, m, d);
  const months = ['', 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  return `${jd} ${months[jm]} ${jy}`;
}

function formatWeekday(dateStr) {
  if (!dateStr) return '';
  const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
  const d = new Date(dateStr + 'T12:00:00');
  return days[d.getDay()] || '';
}

async function sendToTelegram(data) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  console.log('Telegram config → token:', token ? 'OK (' + token.substring(0, 10) + '...)' : 'MISSING', '| chatId:', chatId || 'MISSING');

  if (!token || !chatId) {
    console.log('⚠️ Telegram not configured. Data:', data);
    return false;
  }

  const jalaliDate = formatJalali(data.date);
  const weekday = formatWeekday(data.date);
  const name = data.nickname || 'آنیشکا';

  const message = `
💌 سلام پارسا!

آنیشکا جواب دعوت‌نامه رو داد 💕

━━━━━━━━━━━━━━━━
👤 اسم انتخابی: ${name}
✅ وضعیت: ${data.accepted ? 'قبول کرد 🎉' : 'نه زد 😢'}

📅 تاریخ انتخابی:
   • میلادی: ${data.date || '—'}
   • شمسی: ${weekday ? weekday + ' ' : ''}${jalaliDate}

⏰ ساعت: ${data.time || '—'}
📍 مکان: ${data.place || '—'}
🍽️ غذا / نوشیدنی: ${data.food || '—'}

💬 پیامش:
${data.message ? '« ' + data.message + ' »' : '— پیام نذاشت —'}
━━━━━━━━━━━━━━━━

🕐 ثبت شده در: ${new Date().toLocaleString('fa-IR')}
  `.trim();

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: String(chatId).trim(),
        text: message
      })
    });
    const result = await res.json();
    console.log('Telegram response:', result.ok ? '✅ Sent successfully' : result);
    return result.ok;
  } catch (err) {
    console.error('Telegram error:', err.message);
    return false;
  }
}

app.post('/api/submit', async (req, res) => {
  try {
    console.log('📥 New submit:', req.body);

    const data = {
      ...req.body,
      submittedAt: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    };

    let responses = [];
    try {
      responses = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {}
    responses.push(data);
    fs.writeFileSync(DATA_FILE, JSON.stringify(responses, null, 2));

    const telegramOk = await sendToTelegram(data);

    res.json({
      success: true,
      message: 'پاسخ با موفقیت ثبت شد 💕',
      telegramSent: telegramOk
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطا در ثبت' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 سرور دعوت‌نامه آنیشکا روی پورت ${PORT} بالا آمد`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log('Telegram Bot Token:', process.env.TELEGRAM_BOT_TOKEN ? '✅ loaded' : '❌ missing');
  console.log('Telegram Chat ID:', process.env.TELEGRAM_CHAT_ID || '❌ missing');
});
