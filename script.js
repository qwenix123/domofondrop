/* ===== DOMOFON DROP — game logic ===== */

/* ---------- DATA ---------- */

const RARITY_COLOR = {
  Common: '#9aa0aa',
  Rare: '#4ea6ff',
  Epic: '#b06bff',
  Legendary: '#ffc94e'
};
const RARITY_RU = {
  Common: 'Обычный',
  Rare: 'Редкий',
  Epic: 'Эпический',
  Legendary: 'Легендарный'
};
const RARITY_ORDER = ['Common', 'Rare', 'Epic', 'Legendary'];

const ITEMS = [
  { id: 'd1',  name: 'Domofon Basic',  image: './domofon1.png',  price: 500,   rarity: 'Common' },
  { id: 'd2',  name: 'Domofon Steel',  image: './domofon2.png',  price: 1500,  rarity: 'Rare' },
  { id: 'd3',  name: 'Domofon Neon',   image: './domofon3.png',  price: 4000,  rarity: 'Epic' },
  { id: 'd4',  name: 'Domofon Chrome', image: './domofon4.png',  price: 3000,  rarity: 'Rare' },
  { id: 'd5',  name: 'Domofon Cyber',  image: './domofon5.png',  price: 8000,  rarity: 'Epic' },
  { id: 'd6',  name: 'Domofon Golden', image: './domofon6.png',  price: 20000, rarity: 'Legendary' },
  { id: 'd7',  name: 'Domofon Vector', image: './domofon7.png',  price: 6000,  rarity: 'Epic' },
  { id: 'd8',  name: 'Domofon Phantom',image: './domofon8.png',  price: 7000,  rarity: 'Epic' },
  { id: 'd9',  name: 'Domofon Titan',  image: './domofon9.png',  price: 15000, rarity: 'Legendary' },
  { id: 'd10', name: 'Domofon Apex',   image: './domofon10.png', price: 25000, rarity: 'Legendary' }
];

function getItem(id){ return ITEMS.find(i => i.id === id); }

const CASES = [
  {
    id: 'starter',
    name: 'Starter Case',
    desc: 'Базовый кейс для начала игры',
    price: 1000,
    image: './domofon2.png',
    drops: [
      { itemId: 'd1', chance: 65 },
      { itemId: 'd2', chance: 25 },
      { itemId: 'd3', chance: 10 }
    ]
  },
  {
    id: 'premium',
    name: 'Premium Case',
    desc: 'Более редкий кейс с дорогими домофонами',
    price: 5000,
    image: './domofon6.png',
    drops: [
      { itemId: 'd4', chance: 55 },
      { itemId: 'd5', chance: 30 },
      { itemId: 'd6', chance: 15 }
    ]
  }
];

const SOUNDS = {
  click: './click.mp3',
  spin: './spin.mp3',
  win: './win.mp3',
  upgradeSuccess: './upgrade-success.mp3',
  upgradeFail: './upgrade-fail.mp3'
};
function playSound(key){
  try{
    const a = new Audio(SOUNDS[key]);
    a.volume = 0.5;
    a.play().catch(()=>{});
  }catch(e){ /* ignore */ }
}

/* ---------- STATE ---------- */

const STORAGE_KEY = 'domofonDropState';
let state = null;

function defaultState(){
  return {
    balance: 99999,
    inventory: [], // {uid, itemId, obtainedAt}
    stats: {
      casesOpened: 0,
      itemsObtained: 0,
      upgradesSuccess: 0,
      itemsSold: 0,
      coinsSpent: 0
    }
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw){ state = defaultState(); saveState(); return; }
    const parsed = JSON.parse(raw);
    state = Object.assign(defaultState(), parsed);
    state.stats = Object.assign(defaultState().stats, parsed.stats || {});
  }catch(e){
    state = defaultState();
  }
}

function saveState(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }catch(e){ /* ignore quota errors */ }
}

/* ---------- HELPERS ---------- */

function fmt(n){ return Math.round(n).toLocaleString('ru-RU'); }

function uid(){ return 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

function makeItemImg(item, className){
  const wrap = document.createElement('div');
  wrap.className = `item-thumb glow-${item.rarity.toLowerCase()} ${className||''}`;
  const img = document.createElement('img');
  img.src = item.image;
  img.alt = item.name;
  img.onerror = function(){
    wrap.removeChild(img);
    const ph = document.createElement('div');
    ph.className = 'placeholder-icon';
    ph.textContent = '📟';
    wrap.appendChild(ph);
  };
  wrap.appendChild(img);
  return wrap;
}

function rarityDot(rarity){
  const d = document.createElement('span');
  d.className = 'rarity-dot';
  d.style.background = RARITY_COLOR[rarity];
  return d;
}

function updateBalance(delta){
  state.balance += delta;
  saveState();
  renderBalance(true);
}

function renderBalance(pulse){
  document.getElementById('balanceValue').textContent = fmt(state.balance);
  if(pulse){
    const pill = document.getElementById('balancePill');
    pill.classList.add('pulse');
    setTimeout(()=>pill.classList.remove('pulse'), 350);
  }
}

/* ---------- TOASTS ---------- */

function showToast(message, type){
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = 'toast' + (type === 'error' ? ' error' : '');
  t.textContent = message;
  container.appendChild(t);
  setTimeout(()=>{
    t.classList.add('fadeout');
    setTimeout(()=> t.remove(), 320);
  }, 3200);
}

/* ---------- CONFETTI ---------- */

function launchConfetti(){
  const colors = [RARITY_COLOR.Rare, RARITY_COLOR.Epic, RARITY_COLOR.Legendary, '#9dff4c', '#ffffff'];
  for(let i=0;i<40;i++){
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = Math.random()*100 + 'vw';
    p.style.background = colors[Math.floor(Math.random()*colors.length)];
    p.style.animationDuration = (2 + Math.random()*1.5) + 's';
    p.style.opacity = String(0.7 + Math.random()*0.3);
    document.body.appendChild(p);
    setTimeout(()=> p.remove(), 3600);
  }
}

/* ---------- RENDER: CASES ---------- */

function renderCases(){
  const grid = document.getElementById('casesGrid');
  grid.innerHTML = '';
  CASES.forEach(c => {
    const card = document.createElement('div');
    card.className = 'case-card';

    const media = document.createElement('div');
    media.className = 'case-media';
    const img = document.createElement('img');
    img.src = c.image;
    img.alt = c.name;
    img.onerror = function(){
      media.innerHTML = '<span style="font-size:44px;opacity:.5;">📟</span>';
    };
    media.appendChild(img);
    card.appendChild(media);

    const title = document.createElement('div');
    title.className = 'case-title';
    title.textContent = c.name;
    card.appendChild(title);

    const desc = document.createElement('div');
    desc.className = 'case-desc';
    desc.textContent = c.desc;
    card.appendChild(desc);

    const list = document.createElement('div');
    list.className = 'case-items-list';
    c.drops.forEach(d => {
      const item = getItem(d.itemId);
      const row = document.createElement('div');
      row.className = 'case-items-row';
      const nameWrap = document.createElement('span');
      nameWrap.className = 'ci-name';
      nameWrap.appendChild(rarityDot(item.rarity));
      const nameText = document.createElement('span');
      nameText.textContent = `${item.name} · ${fmt(item.price)} 💰`;
      nameWrap.appendChild(nameText);
      row.appendChild(nameWrap);
      const chance = document.createElement('span');
      chance.className = 'ci-chance';
      chance.textContent = d.chance + '%';
      row.appendChild(chance);
      list.appendChild(row);
    });
    card.appendChild(list);

    const footer = document.createElement('div');
    footer.className = 'case-footer';
    const price = document.createElement('div');
    price.className = 'case-price';
    price.textContent = fmt(c.price) + ' 💰';
    footer.appendChild(price);
    const openBtn = document.createElement('button');
    openBtn.className = 'btn btn-primary open-btn';
    openBtn.textContent = 'ОТКРЫТЬ';
    openBtn.addEventListener('click', () => openCase(c.id));
    footer.appendChild(openBtn);
    card.appendChild(footer);

    grid.appendChild(card);
  });
}

/* ---------- CASE OPENING / ROULETTE ---------- */

let currentWinningItem = null;
let rouletteAnimating = false;

function pickWeighted(drops){
  const total = drops.reduce((s,d)=>s+d.chance,0);
  let r = Math.random() * total;
  for(const d of drops){
    if(r < d.chance) return d.itemId;
    r -= d.chance;
  }
  return drops[drops.length-1].itemId;
}

function openCase(caseId){
  if(rouletteAnimating) return;
  const c = CASES.find(x => x.id === caseId);
  if(!c) return;

  if(state.balance < c.price){
    showToast('Недостаточно средств', 'error');
    return;
  }

  playSound('click');
  updateBalance(-c.price);
  state.stats.coinsSpent += c.price;
  saveState();

  // Determine result BEFORE animation starts
  const winningItemId = pickWeighted(c.drops);
  currentWinningItem = getItem(winningItemId);

  document.getElementById('caseModalTitle').textContent = c.name;
  openModal('caseModal');
  generateRoulette(c.drops, currentWinningItem);
}

function generateRoulette(drops, winningItem){
  const track = document.getElementById('rouletteTrack');
  track.innerHTML = '';
  track.style.transition = 'none';
  track.style.transform = 'translateX(0px)';

  const TOTAL_CARDS = 48;
  const WINNER_INDEX = 40;
  const cardWidth = 130;
  const gap = 12;
  const step = cardWidth + gap;

  for(let i=0;i<TOTAL_CARDS;i++){
    let item;
    if(i === WINNER_INDEX){
      item = winningItem;
    } else {
      const randomDrop = drops[Math.floor(Math.random()*drops.length)];
      item = getItem(randomDrop.itemId);
    }
    const card = document.createElement('div');
    card.className = 'roulette-card';
    card.style.borderColor = RARITY_COLOR[item.rarity];
    if(i === WINNER_INDEX) card.dataset.winner = 'true';

    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.name;
    img.onerror = function(){
      img.replaceWith(Object.assign(document.createElement('div'), {
        className: 'placeholder-icon', textContent: '📟'
      }));
    };
    card.appendChild(img);
    const nm = document.createElement('div');
    nm.className = 'rc-name';
    nm.textContent = item.name;
    card.appendChild(nm);
    track.appendChild(card);
  }

  animateRoulette(track, WINNER_INDEX, step);
}

function animateRoulette(track, winnerIndex, step){
  rouletteAnimating = true;
  const wrap = track.parentElement;
  const containerWidth = wrap.clientWidth;
  const jitter = (Math.random() - 0.5) * (step * 0.5);
  const targetX = -(winnerIndex * step + step/2 - containerWidth/2) + jitter;

  playSound('spin');

  // force reflow so the transition applies from translateX(0)
  // eslint-disable-next-line no-unused-expressions
  track.offsetHeight;

  track.style.transition = 'transform 6s cubic-bezier(0.13, 0.86, 0.19, 1)';
  track.style.transform = `translateX(${targetX}px)`;

  let finished = false;
  const onEnd = () => {
    if(finished) return;
    finished = true;
    track.removeEventListener('transitionend', onEnd);
    const winnerCard = track.querySelector('[data-winner="true"]');
    if(winnerCard) winnerCard.classList.add('winner-final');
    playSound('win');
    setTimeout(() => {
      rouletteAnimating = false;
      closeModal('caseModal');
      finalizeCaseResult(currentWinningItem);
    }, 500);
  };
  track.addEventListener('transitionend', onEnd);
  // fallback in case transitionend doesn't fire
  setTimeout(onEnd, 6800);
}

function finalizeCaseResult(item){
  const entry = { uid: uid(), itemId: item.id, obtainedAt: Date.now() };
  state.inventory.push(entry);
  state.stats.casesOpened += 1;
  state.stats.itemsObtained += 1;
  saveState();
  renderInventory();
  renderStats();
  showWin(item);
}

function showWin(item){
  const cardWrap = document.getElementById('winCard');
  cardWrap.innerHTML = '';
  cardWrap.appendChild(makeItemImg(item));
  const nameEl = document.createElement('div');
  nameEl.className = 'item-name';
  nameEl.textContent = item.name;
  cardWrap.appendChild(nameEl);
  const rarEl = document.createElement('div');
  rarEl.className = 'item-rarity rarity-' + item.rarity.toLowerCase();
  rarEl.textContent = RARITY_RU[item.rarity];
  cardWrap.appendChild(rarEl);

  document.getElementById('winPrice').textContent = 'Стоимость: ' + fmt(item.price) + ' 💰';

  openModal('winModal');
  const flash = document.getElementById('winFlash');
  flash.classList.remove('flash-anim');
  void flash.offsetWidth;
  flash.classList.add('flash-anim');
  launchConfetti();
}

/* ---------- INVENTORY ---------- */

function renderInventory(){
  const grid = document.getElementById('inventoryGrid');
  const empty = document.getElementById('inventoryEmpty');
  grid.innerHTML = '';

  if(state.inventory.length === 0){
    empty.classList.add('show');
  } else {
    empty.classList.remove('show');
  }

  state.inventory.slice().reverse().forEach(entry => {
    const item = getItem(entry.itemId);
    if(!item) return;
    const card = document.createElement('div');
    card.className = 'inv-card';
    card.appendChild(makeItemImg(item));
    const nm = document.createElement('div');
    nm.className = 'item-name';
    nm.textContent = item.name;
    card.appendChild(nm);
    const rar = document.createElement('div');
    rar.className = 'item-rarity rarity-' + item.rarity.toLowerCase();
    rar.textContent = RARITY_RU[item.rarity];
    card.appendChild(rar);
    const pr = document.createElement('div');
    pr.className = 'item-price';
    pr.textContent = fmt(item.price) + ' 💰';
    card.appendChild(pr);
    const sellBtn = document.createElement('button');
    sellBtn.className = 'btn btn-outline sell-btn';
    sellBtn.textContent = 'Продать';
    sellBtn.addEventListener('click', () => openSellConfirm(entry.uid));
    card.appendChild(sellBtn);
    grid.appendChild(card);
  });
}

let pendingSellUid = null;
function openSellConfirm(entryUid){
  const entry = state.inventory.find(e => e.uid === entryUid);
  if(!entry) return;
  const item = getItem(entry.itemId);
  pendingSellUid = entryUid;
  const preview = document.getElementById('sellItemPreview');
  preview.innerHTML = '';
  preview.appendChild(makeItemImg(item));
  const nm = document.createElement('div');
  nm.className = 'item-name';
  nm.textContent = `${item.name} — ${fmt(item.price)} 💰`;
  preview.appendChild(nm);
  openModal('sellModal');
}

function sellItem(entryUid){
  const idx = state.inventory.findIndex(e => e.uid === entryUid);
  if(idx === -1) return;
  const item = getItem(state.inventory[idx].itemId);
  state.inventory.splice(idx,1);
  state.stats.itemsSold += 1;
  saveState();
  updateBalance(item.price);
  renderInventory();
  renderStats();
  showToast(`+${fmt(item.price)} 💰 Предмет продан`);
}

/* ---------- COLLECTION ---------- */

function renderCollection(){
  const container = document.getElementById('collectionGroups');
  container.innerHTML = '';
  RARITY_ORDER.forEach(rarity => {
    const items = ITEMS.filter(i => i.rarity === rarity);
    if(items.length === 0) return;
    const group = document.createElement('div');
    group.className = 'rarity-group';
    const h3 = document.createElement('h3');
    h3.className = 'rarity-' + rarity.toLowerCase();
    h3.appendChild(rarityDot(rarity));
    const label = document.createElement('span');
    label.textContent = RARITY_RU[rarity];
    h3.appendChild(label);
    group.appendChild(h3);

    const grid = document.createElement('div');
    grid.className = 'rarity-group-grid';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'coll-card';
      card.appendChild(makeItemImg(item));
      const nm = document.createElement('div');
      nm.className = 'item-name';
      nm.textContent = item.name;
      card.appendChild(nm);
      const pr = document.createElement('div');
      pr.className = 'item-price';
      pr.textContent = fmt(item.price) + ' 💰';
      card.appendChild(pr);
      grid.appendChild(card);
    });
    group.appendChild(grid);
    container.appendChild(group);
  });
}

/* ---------- UPGRADER ---------- */

let upgradeFrom = null; // {entryUid, item}
let upgradeTo = null;   // item
let pickTarget = null;  // 'from' | 'to'

function openPickModal(target){
  pickTarget = target;
  const title = document.getElementById('pickModalTitle');
  const grid = document.getElementById('pickGrid');
  grid.innerHTML = '';

  if(target === 'from'){
    title.textContent = 'Выберите предмет из инвентаря';
    if(state.inventory.length === 0){
      grid.innerHTML = '<p class="empty-msg show">Инвентарь пуст</p>';
    }
    state.inventory.slice().reverse().forEach(entry => {
      const item = getItem(entry.itemId);
      const card = document.createElement('div');
      card.className = 'pick-card';
      card.appendChild(makeItemImg(item));
      const nm = document.createElement('div');
      nm.className = 'item-name';
      nm.textContent = item.name;
      card.appendChild(nm);
      const pr = document.createElement('div');
      pr.className = 'item-price';
      pr.textContent = fmt(item.price) + ' 💰';
      card.appendChild(pr);
      card.addEventListener('click', () => {
        upgradeFrom = { entryUid: entry.uid, item };
        renderUpgraderSlots();
        closeModal('pickModal');
      });
      grid.appendChild(card);
    });
  } else {
    title.textContent = 'Выберите целевой предмет';
    ITEMS.forEach(item => {
      const card = document.createElement('div');
      card.className = 'pick-card';
      card.appendChild(makeItemImg(item));
      const nm = document.createElement('div');
      nm.className = 'item-name';
      nm.textContent = item.name;
      card.appendChild(nm);
      const pr = document.createElement('div');
      pr.className = 'item-price';
      pr.textContent = fmt(item.price) + ' 💰';
      card.appendChild(pr);
      card.addEventListener('click', () => {
        upgradeTo = item;
        renderUpgraderSlots();
        closeModal('pickModal');
      });
      grid.appendChild(card);
    });
  }
  openModal('pickModal');
}

function renderUpgraderSlots(){
  const fromSlot = document.getElementById('upgradeFromSlot');
  const toSlot = document.getElementById('upgradeToSlot');

  fromSlot.innerHTML = '';
  if(upgradeFrom){
    fromSlot.appendChild(makeItemImg(upgradeFrom.item));
    const nm = document.createElement('div');
    nm.className = 'item-name';
    nm.textContent = upgradeFrom.item.name;
    fromSlot.appendChild(nm);
    const pr = document.createElement('div');
    pr.className = 'item-price';
    pr.textContent = fmt(upgradeFrom.item.price) + ' 💰';
    fromSlot.appendChild(pr);
  } else {
    fromSlot.innerHTML = '<span class="slot-placeholder">Выберите предмет</span>';
  }

  toSlot.innerHTML = '';
  if(upgradeTo){
    toSlot.appendChild(makeItemImg(upgradeTo));
    const nm = document.createElement('div');
    nm.className = 'item-name';
    nm.textContent = upgradeTo.name;
    toSlot.appendChild(nm);
    const pr = document.createElement('div');
    pr.className = 'item-price';
    pr.textContent = fmt(upgradeTo.price) + ' 💰';
    toSlot.appendChild(pr);
  } else {
    toSlot.innerHTML = '<span class="slot-placeholder">Выберите предмет</span>';
  }

  calculateUpgradeChance();
}

function calculateUpgradeChance(){
  const ring = document.getElementById('upgradeRing');
  const valueEl = document.getElementById('upgradeChanceValue');
  const pricesEl = document.getElementById('upgradePrices');
  const btn = document.getElementById('doUpgradeBtn');

  if(!upgradeFrom || !upgradeTo){
    ring.style.background = `conic-gradient(var(--accent) 0deg, var(--border) 0deg)`;
    valueEl.textContent = '0%';
    pricesEl.textContent = '— → —';
    btn.disabled = true;
    return 0;
  }

  let chance = (upgradeFrom.item.price / upgradeTo.price) * 100;
  chance = Math.min(95, Math.max(1, chance));
  chance = Math.round(chance);

  ring.style.background = `conic-gradient(var(--accent) ${chance*3.6}deg, var(--border) ${chance*3.6}deg)`;
  valueEl.textContent = chance + '%';
  pricesEl.textContent = `${fmt(upgradeFrom.item.price)} → ${fmt(upgradeTo.price)}  (+${fmt(upgradeTo.price - upgradeFrom.item.price)})`;
  btn.disabled = false;
  return chance;
}

let upgrading = false;
function performUpgrade(){
  if(upgrading || !upgradeFrom || !upgradeTo) return;
  const entry = state.inventory.find(e => e.uid === upgradeFrom.entryUid);
  if(!entry){
    showToast('Предмет больше недоступен', 'error');
    upgradeFrom = null;
    renderUpgraderSlots();
    return;
  }

  const chance = calculateUpgradeChance();
  const success = Math.random()*100 < chance;

  upgrading = true;
  const ring = document.getElementById('upgradeRing');
  ring.classList.add('spinning');
  playSound('click');

  setTimeout(() => {
    ring.classList.remove('spinning');
    const idx = state.inventory.findIndex(e => e.uid === upgradeFrom.entryUid);

    if(success){
      if(idx !== -1){
        state.inventory[idx] = { uid: uid(), itemId: upgradeTo.id, obtainedAt: Date.now() };
      }
      state.stats.upgradesSuccess += 1;
      state.stats.itemsObtained += 1;
      saveState();
      playSound('upgradeSuccess');
      showUpgradeResult(true, upgradeTo);
    } else {
      if(idx !== -1) state.inventory.splice(idx,1);
      saveState();
      playSound('upgradeFail');
      showUpgradeResult(false, upgradeFrom.item);
    }

    renderInventory();
    renderStats();
    upgradeFrom = null;
    upgradeTo = null;
    renderUpgraderSlots();
    upgrading = false;
  }, 2600);
}

function showUpgradeResult(success, item){
  const titleEl = document.getElementById('upgradeResultTitle');
  const subEl = document.getElementById('upgradeResultSub');
  const cardWrap = document.getElementById('upgradeResultCard');
  cardWrap.innerHTML = '';

  if(success){
    titleEl.textContent = 'UPGRADE SUCCESS';
    titleEl.style.color = 'var(--accent)';
    subEl.textContent = 'Вы получили новый предмет!';
    cardWrap.appendChild(makeItemImg(item));
    const nm = document.createElement('div');
    nm.className = 'item-name';
    nm.textContent = item.name;
    cardWrap.appendChild(nm);
    launchConfetti();
  } else {
    titleEl.textContent = 'UPGRADE FAILED';
    titleEl.style.color = '#ff6b6b';
    subEl.textContent = 'Предмет сгорел.';
    const burnt = document.createElement('div');
    burnt.style.fontSize = '48px';
    burnt.style.margin = '10px 0';
    burnt.textContent = '💥';
    cardWrap.appendChild(burnt);
  }

  openModal('upgradeResultModal');
  const flash = document.getElementById('upgradeFlash');
  flash.classList.remove('flash-anim');
  void flash.offsetWidth;
  flash.classList.add('flash-anim');
}

/* ---------- STATS ---------- */

function inventoryValue(){
  return state.inventory.reduce((sum, e) => {
    const it = getItem(e.itemId);
    return sum + (it ? it.price : 0);
  }, 0);
}

function renderStats(){
  const grid = document.getElementById('statsGrid');
  const s = state.stats;
  const rows = [
    { label: 'Открыто кейсов', value: s.casesOpened },
    { label: 'Получено предметов', value: s.itemsObtained },
    { label: 'Успешных апгрейдов', value: s.upgradesSuccess },
    { label: 'Продано предметов', value: s.itemsSold },
    { label: 'Потрачено монет', value: fmt(s.coinsSpent) + ' 💰' },
    { label: 'Стоимость инвентаря', value: fmt(inventoryValue()) + ' 💰' }
  ];
  grid.innerHTML = '';
  rows.forEach(r => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    const val = document.createElement('div');
    val.className = 'stat-value';
    val.textContent = r.value;
    card.appendChild(val);
    const lab = document.createElement('div');
    lab.className = 'stat-label';
    lab.textContent = r.label;
    card.appendChild(lab);
    grid.appendChild(card);
  });
}

/* ---------- RESET ---------- */

function resetGame(){
  localStorage.removeItem(STORAGE_KEY);
  state = defaultState();
  saveState();
  renderBalance(false);
  renderInventory();
  renderStats();
  upgradeFrom = null;
  upgradeTo = null;
  renderUpgraderSlots();
  showToast('Прогресс сброшен');
}

/* ---------- MODALS ---------- */

function openModal(id){
  document.getElementById(id).classList.add('open');
}
function closeModal(id){
  document.getElementById(id).classList.remove('open');
}

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if(e.target === overlay && overlay.id !== 'caseModal'){
      overlay.classList.remove('open');
    }
  });
});

/* ---------- HERO VISUAL ---------- */

function renderHeroVisual(){
  const el = document.getElementById('heroVisual');
  const picks = [getItem('d3'), getItem('d6'), getItem('d9')];
  el.innerHTML = '';
  picks.forEach(item => {
    const card = document.createElement('div');
    card.className = 'float-card';
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.name;
    img.onerror = function(){
      img.replaceWith(Object.assign(document.createElement('div'), {
        textContent: '📟', style: 'font-size:30px;opacity:.6;'
      }));
    };
    card.appendChild(img);
    el.appendChild(card);
  });
}

/* ---------- NAV ---------- */

function setupNav(){
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    link.addEventListener('click', () => {
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  const sections = ['cases','upgrader','inventory','collection'].map(id => document.getElementById(id));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        links.forEach(l => l.classList.toggle('active', l.dataset.section === entry.target.id));
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px' });
  sections.forEach(s => s && observer.observe(s));
}

/* ---------- INIT ---------- */

function init(){
  loadState();
  renderBalance(false);
  renderHeroVisual();
  renderCases();
  renderInventory();
  renderCollection();
  renderUpgraderSlots();
  renderStats();
  setupNav();

  document.getElementById('heroCasesBtn').addEventListener('click', () => {
    document.getElementById('cases').scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('heroUpgradeBtn').addEventListener('click', () => {
    document.getElementById('upgrader').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('pickFromBtn').addEventListener('click', () => openPickModal('from'));
  document.getElementById('pickToBtn').addEventListener('click', () => openPickModal('to'));
  document.getElementById('doUpgradeBtn').addEventListener('click', performUpgrade);

  document.getElementById('claimBtn').addEventListener('click', () => closeModal('winModal'));
  document.getElementById('upgradeResultCloseBtn').addEventListener('click', () => closeModal('upgradeResultModal'));

  document.getElementById('confirmSellBtn').addEventListener('click', () => {
    if(pendingSellUid){
      sellItem(pendingSellUid);
      pendingSellUid = null;
    }
    closeModal('sellModal');
  });

  document.getElementById('resetBtn').addEventListener('click', () => openModal('resetModal'));
  document.getElementById('confirmResetBtn').addEventListener('click', () => {
    resetGame();
    closeModal('resetModal');
  });

  document.getElementById('profileBtn').addEventListener('click', () => {
    showToast('Профиль скоро будет доступен');
  });
}

document.addEventListener('DOMContentLoaded', init);
