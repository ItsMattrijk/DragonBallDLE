// ========== COMPTEUR & PERSONNAGE D'HIER - DRAGONBALLDLE ==========

const DB_WORKSPACE = 'mf5s-team-3511';

function dbGetTodayKey(mode) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `db-${mode}-${y}${m}${day}`;
}

async function dbFetchCounter(mode) {
    const key = dbGetTodayKey(mode);
    const cacheKey = `dbCountCache_${key}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached !== null) return parseInt(cached);
    try {
        const res = await fetch(`https://api.counterapi.dev/v1/${DB_WORKSPACE}/${key}/up`);
        if (!res.ok) return 0;
        const data = await res.json();
        const raw = data.count ?? 0;
        await fetch(`https://api.counterapi.dev/v1/${DB_WORKSPACE}/${key}/down`);
        const real = Math.max(0, raw - 1);
        localStorage.setItem(cacheKey, String(real));
        return real;
    } catch { return 0; }
}

async function dbIncrementCounter(mode) {
    const key = dbGetTodayKey(mode);
    try {
        const res = await fetch(`https://api.counterapi.dev/v1/${DB_WORKSPACE}/${key}/up`);
        if (!res.ok) return 0;
        const data = await res.json();
        const count = data.count ?? 0;
        localStorage.setItem(`dbCountCache_${key}`, String(count));
        return count;
    } catch { return 0; }
}

window.dbCounterRegisterWin = async function(mode) {
    const wonKey = `dbCounterWon_${mode}_${dbGetTodayKey(mode)}`;
    if (localStorage.getItem(wonKey)) return;
    const newCount = await dbIncrementCounter(mode);
    localStorage.setItem(wonKey, '1');
    dbUpdateCounterDisplay(mode, newCount);
};

function dbUpdateCounterDisplay(mode, count) {
    const el = document.getElementById(`db-counter-${mode}`);
    if (!el) return;
    if (count <= 0) {
        el.innerHTML = `<span class="db-count-zero">Sois le premier !</span>`;
    } else {
        el.innerHTML = `<span class="db-count-number">${count.toLocaleString('fr-FR')}</span><span class="db-count-text"> ont trouvé !</span>`;
    }
}

function dbGetYesterdaySeed(resetCounterKey, seedOffset) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const base = yesterday.getFullYear() * 10000 + (yesterday.getMonth() + 1) * 100 + yesterday.getDate();
    const resetCounter = parseInt(localStorage.getItem(resetCounterKey) || '0');
    return base + seedOffset + (resetCounter * 123456);
}

function dbSeededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function dbSeededRandomWithOffset(seed, offset) {
    const x = Math.sin(seed + offset * 9999) * 10000;
    return x - Math.floor(x);
}

const DB_CAPSULE_STYLES = `
.db-info-capsule {
    width: 100%;
    max-width: 700px;
    margin: 0 auto 14px;
    display: flex;
    align-items: stretch;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    border: 2px solid #ffcc00;
    box-shadow: 0 0 18px rgba(255,140,0,0.5), 0 6px 24px rgba(0,0,0,0.6);
    background: linear-gradient(135deg, #e85c00 0%, #f5a000 40%, #e87000 70%, #c94800 100%);
    font-family: 'Bebas Neue', Impact, sans-serif;
}
.db-info-capsule::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-conic-gradient(
        from 0deg at 50% 50%,
        rgba(255,255,255,0.07) 0deg,
        rgba(255,255,255,0.07) 1deg,
        transparent 1deg,
        transparent 6deg
    );
    z-index: 0;
    pointer-events: none;
}
.db-info-capsule::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 40%, rgba(255,230,100,0.18) 0%, transparent 65%);
    z-index: 0;
    pointer-events: none;
}
.db-info-capsule > * { position: relative; z-index: 1; }
.db-cap-yesterday {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 12px 20px;
    border-right: 2px solid rgba(255,204,0,0.35);
    gap: 3px;
}
.db-cap-counter {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-end;
    padding: 12px 20px;
    gap: 3px;
    text-align: right;
}
.db-cap-label {
    font-size: 0.62rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: rgba(255,255,255,0.7);
    white-space: nowrap;
    font-family: 'Bebas Neue', Impact, sans-serif;
}
.db-cap-value {
    font-size: 1rem;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 2px 6px rgba(0,0,0,0.4);
    font-family: 'Bebas Neue', Impact, sans-serif;
    letter-spacing: 1px;
}
.db-count-number {
    font-size: 1.1rem;
    font-weight: 700;
    color: #ffcc00;
    text-shadow: 0 2px 6px rgba(0,0,0,0.5);
    font-family: 'Bebas Neue', Impact, sans-serif;
}
.db-count-text {
    font-size: 0.88rem;
    color: #fff;
    font-family: 'Bebas Neue', Impact, sans-serif;
    letter-spacing: 1px;
}
.db-count-zero {
    font-size: 0.82rem;
    color: rgba(255,255,255,0.9);
    font-family: 'Bebas Neue', Impact, sans-serif;
    letter-spacing: 1px;
}
`;

function dbInjectStyles() {
    if (document.getElementById('db-counter-styles')) return;
    const style = document.createElement('style');
    style.id = 'db-counter-styles';
    style.textContent = DB_CAPSULE_STYLES;
    document.head.appendChild(style);
}

function dbCreateCapsule(mode, yesterdayLabel) {
    const capsule = document.createElement('div');
    capsule.className = 'db-info-capsule';
    capsule.id = `db-capsule-${mode}`;

    const leftBlock = document.createElement('div');
    leftBlock.className = 'db-cap-yesterday';
    leftBlock.innerHTML = `
        <span class="db-cap-label">Hier</span>
        <span class="db-cap-value">${yesterdayLabel || '—'}</span>
    `;

    const rightBlock = document.createElement('div');
    rightBlock.className = 'db-cap-counter';
    rightBlock.innerHTML = `
        <span class="db-cap-label">Trouvé aujourd'hui</span>
        <span id="db-counter-${mode}">...</span>
    `;

    capsule.appendChild(leftBlock);
    capsule.appendChild(rightBlock);
    return capsule;
}

function dbInjectClassique(personnages) {
    const searchContainer = document.querySelector('#classique-mode .search-container');
    if (!searchContainer || document.getElementById('db-capsule-classique')) return;

    const seed = dbGetYesterdaySeed('dbResetCounter_classique', 0);
    const idx = Math.floor(dbSeededRandom(seed) * personnages.length);
    const hier = personnages[idx];
    const hierNom = hier ? (Array.isArray(hier.nom) ? hier.nom.join(' / ') : hier.nom) : '—';

    const capsule = dbCreateCapsule('classique', hierNom);
    searchContainer.insertAdjacentElement('beforebegin', capsule);
    dbFetchCounter('classique').then(count => dbUpdateCounterDisplay('classique', count));
}

function dbInjectTechnique(personnages) {
    const searchContainer = document.querySelector('#technique-mode .search-container-technique');
    if (!searchContainer || document.getElementById('db-capsule-technique')) return;

    const seed = dbGetYesterdaySeed('dbResetCounter_technique', 77777);
    const avecTechnique = personnages.filter(p => p.technique);
    const idx = Math.floor(dbSeededRandom(seed) * avecTechnique.length);
    const hier = avecTechnique[idx];
    const hierNom = hier ? (Array.isArray(hier.nom) ? hier.nom.join(' / ') : hier.nom) : '—';

    const capsule = dbCreateCapsule('technique', hierNom);
    searchContainer.insertAdjacentElement('beforebegin', capsule);
    dbFetchCounter('technique').then(count => dbUpdateCounterDisplay('technique', count));
}

function dbInjectMoitie(personnages) {
    const searchContainer = document.querySelector('#moitie-mode .search-container-moitie');
    if (!searchContainer || document.getElementById('db-capsule-moitie')) return;

    const seed = dbGetYesterdaySeed('dbResetCounter_moitie', 55555);
    const idx1 = Math.floor(dbSeededRandomWithOffset(seed, 0) * personnages.length);
    let idx2 = Math.floor(dbSeededRandomWithOffset(seed, 1) * personnages.length);
    if (idx2 === idx1) idx2 = (idx1 + 1) % personnages.length;

    const hier1 = personnages[idx1];
    const hier2 = personnages[idx2];
    const nom1 = hier1 ? (Array.isArray(hier1.nom) ? hier1.nom[0] : hier1.nom) : '?';
    const nom2 = hier2 ? (Array.isArray(hier2.nom) ? hier2.nom[0] : hier2.nom) : '?';

    const capsule = dbCreateCapsule('moitie', `${nom1} + ${nom2}`);
    searchContainer.insertAdjacentElement('beforebegin', capsule);
    dbFetchCounter('moitie').then(count => dbUpdateCounterDisplay('moitie', count));
}

const _dbCounterDone = {};

window.dbInitCounterForMode = function(mode) {
    if (_dbCounterDone[mode]) return;
    _dbCounterDone[mode] = true;

    const tryInit = setInterval(() => {
        if (typeof personnages === 'undefined' || personnages.length === 0) return;
        clearInterval(tryInit);
        dbInjectStyles();
        if (mode === 'classique') dbInjectClassique(personnages);
        if (mode === 'technique') dbInjectTechnique(personnages);
        if (mode === 'moitie')    dbInjectMoitie(personnages);
    }, 300);
};

console.log('✅ DragonBallDLE Counter initialisé');