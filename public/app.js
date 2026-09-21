// State
const state = {
  accepted: false,
  nickname: '',
  date: '',
  time: '',
  place: '',
  food: '',
  message: ''
};

function goTo(stepId) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(typeof stepId === 'number' ? 'step-' + stepId : stepId);
  if (el) el.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function answerYes() {
  state.accepted = true;
  goTo(2);
}

// ========== دکمه فراری «نه» ==========
let noEscapeCount = 0;
let noClickAllowed = false;
let noFinalClicks = 0;

const noMessages = [
  'هی هی... نمی‌تونی ازم فرار کنی 😏',
  'دکمه نه داره فرار می‌کنه ازت! 🏃‍♂️',
  'آره آره... بیشتر تلاش کن 😂',
  'هنوزم می‌خوای نه بگی؟ جدی؟',
  'آخرین شانس فرار... بعدش دیگه تمومه 😈'
];

const finalMessages = [
  'اوه نه... داری جدی می‌شی؟ 😳',
  'دکمه داره کوچیک می‌شه... 👀',
  'دیگه نمی‌تونی از قرار با من فرار کنی آنیشکا جون! 💕'
];

function showNoMsg(text) {
  const el = document.getElementById('no-message');
  if (el) {
    el.style.display = 'block';
    el.textContent = text;
  }
}

function runAwayNo() {
  const btn = document.getElementById('btn-no');
  if (!btn || noClickAllowed) return;

  noEscapeCount++;
  console.log('فرار شماره', noEscapeCount);

  // حرکت به جای تصادفی روی صفحه
  const w = btn.offsetWidth || 90;
  const h = btn.offsetHeight || 48;
  const maxX = Math.max(50, window.innerWidth - w - 20);
  const maxY = Math.max(80, window.innerHeight - h - 20);

  const x = 20 + Math.random() * maxX;
  const y = 60 + Math.random() * maxY;

  btn.style.position = 'fixed';
  btn.style.left = x + 'px';
  btn.style.top = y + 'px';
  btn.style.zIndex = '99999';
  btn.style.transition = 'left 0.18s ease-out, top 0.18s ease-out';

  // پیام
  const idx = Math.min(noEscapeCount - 1, noMessages.length - 1);
  showNoMsg(noMessages[idx]);

  // بعد از ۵ بار
  if (noEscapeCount >= 5) {
    noClickAllowed = true;
    // برگردون به جای اصلی
    btn.style.position = '';
    btn.style.left = '';
    btn.style.top = '';
    btn.style.zIndex = '';
    btn.style.transition = '';
    showNoMsg('باشه... دیگه فرار نمی‌کنم. حالا می‌تونی کلیک کنی 😈');
    const hint = document.getElementById('step1-hint');
    if (hint) hint.textContent = '۳ بار روی «نه» بزن تا ببینی چی می‌شه...';
  }
}

function onNoClick(e) {
  e.preventDefault();
  e.stopPropagation();

  const btn = document.getElementById('btn-no');
  const yesBtn = document.getElementById('btn-yes');

  if (!noClickAllowed) {
    // هنوز نباید کلیک بشه → فرار کن
    runAwayNo();
    return false;
  }

  // کلیک مجاز
  noFinalClicks++;
  console.log('کلیک نهایی شماره', noFinalClicks);

  if (noFinalClicks === 1) {
    btn.style.transform = 'scale(0.65)';
    btn.style.opacity = '0.7';
    showNoMsg(finalMessages[0]);
  } else if (noFinalClicks === 2) {
    btn.style.transform = 'scale(0.3)';
    btn.style.opacity = '0.4';
    showNoMsg(finalMessages[1]);
  } else {
    btn.style.transform = 'scale(0)';
    btn.style.opacity = '0';
    btn.style.pointerEvents = 'none';
    btn.style.visibility = 'hidden';
    if (yesBtn) {
      yesBtn.style.transform = 'scale(1.3)';
      yesBtn.style.boxShadow = '0 14px 40px rgba(244, 114, 182, 0.65)';
      yesBtn.style.transition = 'transform 0.5s ease, box-shadow 0.5s ease';
    }
    showNoMsg(finalMessages[2]);
    const hint = document.getElementById('step1-hint');
    if (hint) hint.textContent = 'دیگه راه فراری نیست... فقط «آره» مونده 💕';

    setTimeout(function () {
      state.accepted = true;
      goTo(2);
    }, 1800);
  }
  return false;
}

function selectOption(btn, field) {
  const parent = btn.closest('.options-grid') || btn.parentElement;
  parent.querySelectorAll('.option').forEach(function (o) {
    o.classList.remove('selected');
  });
  btn.classList.add('selected');
  state[field] = btn.dataset.value || btn.getAttribute('data-value') || '';
}

function nextFromNickname() {
  const custom = document.getElementById('custom-nickname').value.trim();
  if (custom) state.nickname = custom;
  if (!state.nickname) {
    alert('لطفاً یکی از اسم‌ها رو انتخاب کن یا بنویس 😊');
    return;
  }
  goTo(3);
}

function nextFromDate() {
  const dateInput = document.getElementById('date-input');
  state.date = (dateInput && dateInput.value) ? dateInput.value : '';

  const selectedTimeBtn = document.querySelector('#time-options .option.selected');
  if (selectedTimeBtn && !state.time) {
    state.time = selectedTimeBtn.dataset.value || selectedTimeBtn.getAttribute('data-value') || '';
  }

  if (!state.date && !state.time) {
    alert('لطفاً هم تاریخ و هم ساعت رو انتخاب کن 📅');
    return;
  }
  if (!state.date) {
    alert('لطفاً تاریخ رو انتخاب کن 📅');
    return;
  }
  if (!state.time) {
    alert('لطفاً یکی از ساعت‌ها رو انتخاب کن ⏰');
    return;
  }
  goTo(4);
}

function nextFromPlace() {
  const selected = document.querySelector('#step-4 .option.selected');
  if (selected && !state.place) state.place = selected.dataset.value || '';
  if (!state.place) {
    alert('یه مکان انتخاب کن 📍');
    return;
  }
  goTo(5);
}

function nextFromFood() {
  const selected = document.querySelector('#step-5 .option.selected');
  if (selected && !state.food) state.food = selected.dataset.value || '';
  if (!state.food) {
    alert('غذا یا نوشیدنی رو انتخاب کن 🍽️');
    return;
  }
  goTo(6);
}

async function submitAll() {
  state.message = document.getElementById('message-input').value.trim();

  const btn = document.querySelector('#step-6 .btn');
  const originalText = btn.textContent;
  btn.textContent = 'داره ثبت می‌شه...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
    const data = await res.json();

    if (data.success) {
      const name = state.nickname || 'آنیشکا';
      document.getElementById('success-text').textContent =
        'پس آماده باش ' + name + ' جون، میام دنبالت 🚗💨';
      goTo('step-success');
      launchConfetti();
    } else {
      alert('مشکلی پیش اومد، دوباره امتحان کن');
      btn.textContent = originalText;
      btn.disabled = false;
    }
  } catch (err) {
    console.error(err);
    const name = state.nickname || 'آنیشکا';
    document.getElementById('success-text').textContent =
      'پس آماده باش ' + name + ' جون، میام دنبالت 🚗💨';
    goTo('step-success');
    launchConfetti();
  }
}

function launchConfetti() {
  const container = document.getElementById('confetti');
  if (!container) return;
  const colors = ['#e879f9', '#f472b6', '#a78bfa', '#34d399', '#fbbf24'];
  for (let i = 0; i < 50; i++) {
    const span = document.createElement('span');
    span.style.left = Math.random() * 100 + '%';
    span.style.background = colors[Math.floor(Math.random() * colors.length)];
    span.style.animationDelay = Math.random() * 2 + 's';
    span.style.width = (6 + Math.random() * 8) + 'px';
    span.style.height = span.style.width;
    container.appendChild(span);
  }
}

// اتصال رویدادها
document.addEventListener('DOMContentLoaded', function () {
  const btnNo = document.getElementById('btn-no');
  if (btnNo) {
    btnNo.addEventListener('mouseover', runAwayNo);
    btnNo.addEventListener('mouseenter', runAwayNo);
    btnNo.addEventListener('click', onNoClick);
    btnNo.addEventListener('touchstart', function (e) {
      e.preventDefault();
      if (!noClickAllowed) {
        runAwayNo();
      } else {
        onNoClick(e);
      }
    }, { passive: false });
    console.log('✅ دکمه نه آماده شد');
  } else {
    console.error('❌ دکمه نه پیدا نشد');
  }

  const dateInput = document.getElementById('date-input');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.addEventListener('change', function () {
      state.date = this.value;
    });
  }
});
