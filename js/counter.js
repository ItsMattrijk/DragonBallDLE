// ========== COMPTEUR & PERSONNAGE D'HIER - DRAGONBALLDLE ==========
// Placer ce fichier dans js/counter.js
// L'inclure dans index.html AVANT classique.js, technique.js et moitie.js

const DB_WORKSPACE = 'mf5s-team-3511';

// ── Clé du jour par mode ──────────────────────────────────────────────────────
function dbGetTodayKey(mode) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `db-${mode}-${y}${m}${day}`;
}

// ── Lire le compteur (up + down immédiat pour simuler un get) ─────────────────
async function dbFetchCounter(mode) {
    const key = dbGetTodayKey(mode);
    try {
        // On stocke le dernier count connu en localStorage pour éviter le up/down
        const cached = localStorage.getItem(`dbCountCache_${key}`);
        if (cached !== null) return parseInt(cached);
        // Première visite : up + down
        const res = await fetch(`https://api.counterapi.dev/v1/${DB_WORKSPACE}/${key}/up`);
        if (!res.ok) return 0;
        const data = await res.json();
        const count = data.count ?? 0;
        await fetch(`https://api.counterapi.dev/v1/${DB_WORKSPACE}/${key}/down`);
        localStorage.setItem(`dbCountCache_${key}`, String(count - 1 < 0 ? 0 : count - 1));
        return count - 1 < 0 ? 0 : count - 1;
    } catch { return 0; }
}

// ── Incrémenter (appeler à la victoire) ──────────────────────────────────────
async function dbIncrementCounter(mode) {
    const key = dbGetTodayKey(mode);
    try {
        const res = await fetch(`https://api.counterapi.dev/v1/${DB_WORKSPACE}/${key}/up`);
        if (!res.ok) return 0;
        const data = await res.json();
        return data.count ?? 0;
    } catch { return 0; }
}

// ── Fonction globale appelée depuis classique.js / technique.js / moitie.js ──
window.dbCounterRegisterWin = async function(mode) {
    const wonKey = `dbCounterWon_${mode}_${dbGetTodayKey(mode)}`;
    if (localStorage.getItem(wonKey)) return; // déjà compté aujourd'hui
    const newCount = await dbIncrementCounter(mode);
    localStorage.setItem(wonKey, '1');
    // Mettre à jour l'affichage du compteur si la capsule est visible
    dbUpdateCounterDisplay(mode, newCount);
};

// ── Mise à jour de l'affichage ────────────────────────────────────────────────
function dbUpdateCounterDisplay(mode, count) {
    const el = document.getElementById(`db-counter-${mode}`);
    if (!el) return;
    if (count <= 0) {
        el.textContent = 'Sois le premier à trouver !';
    } else {
        el.innerHTML = `<span style="color:#ffcc00;font-weight:700">${count.toLocaleString('fr-FR')}</span> ont déjà trouvé aujourd'hui !`;
    }
}

// ── Calcul du personnage d'hier ───────────────────────────────────────────────
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

// ── Injection des capsules dans le DOM ───────────────────────────────────────
const DB_CAPSULE_STYLES = `
.db-info-capsule {
    width: 100%;
    max-width: 560px;
    margin: 10px auto 6px;
    display: flex;
    align-items: stretch;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid rgba(255,204,0,0.25);
    background: rgba(0,0,0,0.55);
    box-shadow: 0 4px 18px rgba(0,0,0,0.5);
    font-family: Arial, sans-serif;
}
.db-info-capsule .db-cap-yesterday {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 9px 14px;
    border-right: 1px solid rgba(255,204,0,0.15);
    gap: 2px;
}
.db-info-capsule .db-cap-counter {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-end;
    padding: 9px 14px;
    gap: 2px;
    text-align: right;
}
.db-cap-label {
    font-size: 0.58rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: rgba(255,255,255,0.35);
    white-space: nowrap;
}
.db-cap-value {
    font-size: 0.82rem;
    font-weight: 700;
    color: #ff7c00;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.db-cap-count {
    font-size: 0.82rem;
    font-weight: 700;
    color: rgba(255,255,255,0.8);
    white-space: nowrap;
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

    // Bloc gauche — hier
    const leftBlock = document.createElement('div');
    leftBlock.className = 'db-cap-yesterday';
    leftBlock.innerHTML = `
        <span class="db-cap-label">Hier</span>
        <span class="db-cap-value">${yesterdayLabel || '—'}</span>
    `;

    // Bloc droit — compteur
    const rightBlock = document.createElement('div');
    rightBlock.className = 'db-cap-counter';
    rightBlock.innerHTML = `
        <span class="db-cap-label">Trouvé aujourd'hui</span>
        <span class="db-cap-count" id="db-counter-${mode}">...</span>
    `;

    capsule.appendChild(leftBlock);
    capsule.appendChild(rightBlock);
    return capsule;
}

// ── Injection par mode ────────────────────────────────────────────────────────
function dbInjectClassique(personnages) {
    const searchContainer = document.querySelector('#classique-mode .search-container');
    if (!searchContainer || document.getElementById('db-capsule-classique')) return;

    // Personnage d'hier
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

    // Personnage d'hier (seed avec offset 77777 comme dans technique.js)
    const seed = dbGetYesterdaySeed('dbResetCounter_technique', 77777);
    // Filtrer ceux qui ont une technique
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
    // PAS de filtre — moitie.js prend tous les personnages
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

// ── Init au chargement d'un mode ─────────────────────────────────────────────
const _dbCounterDone = {};

window.dbInitCounterForMode = function(mode) {
    if (_dbCounterDone[mode]) return;
    _dbCounterDone[mode] = true;

    const tryInit = setInterval(() => {
        // Attendre que les personnages soient chargés
        if (typeof personnages === 'undefined' || personnages.length === 0) return;
        clearInterval(tryInit);

        dbInjectStyles();

        if (mode === 'classique') dbInjectClassique(personnages);
        if (mode === 'technique') dbInjectTechnique(personnages);
        if (mode === 'moitie')    dbInjectMoitie(personnages);
    }, 300);
};

console.log('✅ DragonBallDLE Counter initialisé');