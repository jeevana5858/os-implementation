const DEFAULT_CONFIG = {
  title: 'InversionLab',
  subtitle: 'Compare Plain Mutex, Priority Inheritance, and Priority Ceiling.',
  about: "Inversion happens when a low-priority task holding a shared resource blocks a high-priority task while a medium-priority task keeps running. Priority inheritance and priority ceiling protocols prevent or reduce this interference.",
  low: 1,
  medium: 2,
  high: 3,
  hold: 6,
  arrival: 4
};

function readConfig() {
  try { return { ...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem('inversionlabConfig') || '{}') }; }
  catch (_) { return { ...DEFAULT_CONFIG }; }
}

function readUsers() {
  try { return JSON.parse(localStorage.getItem('inversionlabUsers') || '{}'); }
  catch (_) { return {}; }
}

function saveUsers(users) {
  localStorage.setItem('inversionlabUsers', JSON.stringify(users));
}

function currentSession() {
  try { return JSON.parse(sessionStorage.getItem('inversionlabSession') || 'null'); }
  catch (_) { return null; }
}

function applyConfig() {
  const config = readConfig();
  document.querySelector('.hero h1').textContent = config.title;
  document.querySelector('.subtitle').textContent = config.subtitle;
  document.querySelector('.about > p:not(.eyebrow)').textContent = config.about;

  const values = { lowPriority: config.low, mediumPriority: config.medium, highPriority: config.high, holdTime: config.hold, highArrival: config.arrival };
  Object.entries(values).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) input.value = value;
  });

  if (typeof syncLabels === 'function') syncLabels();
  if (typeof renderAll === 'function') renderAll();
}

function openLoginModal() {
  const modal = document.getElementById('loginModal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

function updateSessionUI() {
  const session = currentSession();
  const button = document.getElementById('openLogin');
  const panel = document.getElementById('adminPanel');

  if (!session) {
    button.textContent = 'Sign in';
    panel.hidden = true;
    return;
  }

  button.textContent = `${session.name} · ${session.role === 'admin' ? 'Admin' : 'Student'} · Sign out`;
  panel.hidden = session.role !== 'admin';
}

function populateAdminPanel() {
  const config = readConfig();
  document.getElementById('adminTitle').value = config.title;
  document.getElementById('adminSubtitle').value = config.subtitle;
  document.getElementById('adminAbout').value = config.about;
  document.getElementById('adminLow').value = config.low;
  document.getElementById('adminMedium').value = config.medium;
  document.getElementById('adminHigh').value = config.high;
  document.getElementById('adminHold').value = config.hold;
  document.getElementById('adminArrival').value = config.arrival;
}

document.getElementById('openLogin').addEventListener('click', () => {
  const session = currentSession();
  if (session) {
    sessionStorage.removeItem('inversionlabSession');
    updateSessionUI();
  } else {
    openLoginModal();
  }
});

document.getElementById('closeLogin').addEventListener('click', closeLoginModal);
document.getElementById('loginModal').addEventListener('click', event => {
  if (event.target.id === 'loginModal') closeLoginModal();
});

document.getElementById('showRegister').addEventListener('click', () => {
  document.getElementById('loginForm').hidden = true;
  document.getElementById('registerForm').hidden = false;
  document.getElementById('authTitle').textContent = 'Create student account';
});

document.getElementById('showLogin').addEventListener('click', () => {
  document.getElementById('registerForm').hidden = true;
  document.getElementById('loginForm').hidden = false;
  document.getElementById('authTitle').textContent = 'Sign in';
});

document.getElementById('loginForm').addEventListener('submit', event => {
  event.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  let account = null;

  if (username === 'admin' && password === 'admin123') account = { name: 'Administrator', role: 'admin' };
  else if (username === 'student' && password === 'student123') account = { name: 'Student', role: 'student' };
  else {
    const users = readUsers();
    if (users[username] && users[username].password === password) account = { name: users[username].name, role: 'student' };
  }

  if (!account) {
    document.getElementById('authError').textContent = 'Incorrect username or password.';
    return;
  }

  sessionStorage.setItem('inversionlabSession', JSON.stringify({ ...account, username }));
  closeLoginModal();
  updateSessionUI();
  populateAdminPanel();
});

document.getElementById('registerForm').addEventListener('submit', event => {
  event.preventDefault();
  const name = document.getElementById('registerName').value.trim();
  const username = document.getElementById('registerUsername').value.trim().toLowerCase();
  const password = document.getElementById('registerPassword').value;
  const users = readUsers();

  if (username === 'admin' || username === 'student' || users[username]) {
    document.getElementById('registerError').textContent = 'That username is unavailable.';
    return;
  }

  users[username] = { name, password };
  saveUsers(users);
  sessionStorage.setItem('inversionlabSession', JSON.stringify({ name, username, role: 'student' }));
  closeLoginModal();
  updateSessionUI();
});

document.getElementById('saveAdmin').addEventListener('click', () => {
  const config = {
    title: document.getElementById('adminTitle').value.trim() || DEFAULT_CONFIG.title,
    subtitle: document.getElementById('adminSubtitle').value.trim() || DEFAULT_CONFIG.subtitle,
    about: document.getElementById('adminAbout').value.trim() || DEFAULT_CONFIG.about,
    low: Number(document.getElementById('adminLow').value),
    medium: Number(document.getElementById('adminMedium').value),
    high: Number(document.getElementById('adminHigh').value),
    hold: Number(document.getElementById('adminHold').value),
    arrival: Number(document.getElementById('adminArrival').value)
  };
  localStorage.setItem('inversionlabConfig', JSON.stringify(config));
  applyConfig();
});

document.getElementById('resetAdmin').addEventListener('click', () => {
  localStorage.removeItem('inversionlabConfig');
  populateAdminPanel();
  applyConfig();
});

applyConfig();
populateAdminPanel();
updateSessionUI();
