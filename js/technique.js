// ===== VARIABLES GLOBALES MODE TECHNIQUE =====
let personnagesTechnique = [];
let essaisTechnique = [];
let personnageTechniqueDuJour = null;
let techniqueGagnee = false;

const BLUR_INITIAL = 30;      // flou max au départ (px)
const BLUR_STEP = 2;           // reduction par essai
const BLUR_MIN = 0;            // flou minimum (révélé)

// ===== CHARGEMENT DES DONNÉES =====
async function loadPersonnagesTechnique() {
    try {
        const response = await fetch('js/data.json');
        if (!response.ok) throw new Error('Erreur chargement données');
        const data = await response.json();
        personnagesTechnique = data.personnages;
        console.log(`${personnagesTechnique.length} personnages chargés (technique)`);
    } catch (error) {
        console.error('Erreur chargement technique:', error);
    }
}

// ===== UTILITAIRES =====
function getTechniqueNom(perso) {
    return Array.isArray(perso.nom) ? perso.nom.join(' / ') : perso.nom;
}

function getTechniquePhotoUrl(perso) {
    if (perso.photo && perso.photo.startsWith('http')) return perso.photo;
    if (perso.photo) return `assets/img/personnages/${perso.photo}`;
    return null;
}

function createTechniquePlaceholder(letter, size = 80) {
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FF9900';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${size * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, size / 2, size / 2);
    return canvas.toDataURL();
}

function getDailySeedTechnique() {
    const today = new Date();
    const base = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const resetCounter = parseInt(localStorage.getItem('dbResetCounter_technique') || '0');
    return base + 77777 + (resetCounter * 123456); // seed différente du mode classique
}

function seededRandomTechnique(seed) {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
}

function getTimeUntilMidnightTechnique() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow - now;
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    return `${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
}

function updateCountdownTechnique() {
    const el = document.getElementById('countdown-timer-technique');
    if (el) el.textContent = getTimeUntilMidnightTechnique();
}

function removeAccentsTechnique(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ===== SÉLECTION DU PERSONNAGE DU JOUR =====
function selectDailyTechnique() {
    // Filtrer seulement les personnages qui ont une technique
    const avecTechnique = personnagesTechnique.filter(p => p.technique);

    if (avecTechnique.length === 0) {
        console.warn('Aucun personnage avec technique disponible');
        return null;
    }

    const seed = getDailySeedTechnique();
    const idx = Math.floor(seededRandomTechnique(seed) * avecTechnique.length);
    personnageTechniqueDuJour = avecTechnique[idx];
    console.log('🥊 Technique du jour:', getTechniqueNom(personnageTechniqueDuJour));
    return personnageTechniqueDuJour;
}

// ===== CALCUL DU FLOU =====
function getCurrentBlur() {
    if (!isDeflouEnabled()) return BLUR_INITIAL; // flou fixe, jamais réduit
    const nbEssais = essaisTechnique.length;
    return Math.max(BLUR_MIN, BLUR_INITIAL - nbEssais * BLUR_STEP);
}

// Vider le conteneur GIF pour repartir proprement
const gifContainer = document.getElementById('technique-gif-container');
if (gifContainer) gifContainer.innerHTML = '';

// ===== AFFICHAGE DU GIF FLOU =====

function renderTechniqueGif() {
    const container = document.getElementById('technique-gif-container');
    if (!container || !personnageTechniqueDuJour) return;

    const blur = getCurrentBlur();
    const isRevealed = techniqueGagnee || blur === 0;

    // Mise à jour si déjà créé
    const existingImg = document.getElementById('technique-gif-img');
    if (existingImg) {
        const couleurOn = isCouleurEnabled();
        const grayscale = couleurOn ? '' : ' grayscale(100%)';

        existingImg.style.filter = isRevealed
            ? `blur(0px)${grayscale}`
            : `blur(${blur}px)${grayscale}`;
        existingImg.classList.toggle('revealed', isRevealed);
        const overlay = container.querySelector('.technique-blur-overlay');
        if (overlay) {
            overlay.classList.toggle('hidden', isRevealed);
            const countEl = overlay.querySelector('.technique-blur-count');
            if (countEl) countEl.textContent = `${essaisTechnique.length} essai${essaisTechnique.length > 1 ? 's' : ''} — Flou : ${blur}px`;
        }
        return;
    }

    // Récupérer l'état actuel des settings pour le footer
    const couleurOn = isCouleurEnabled();
    const deflouOn = isDeflouEnabled();

    // Création initiale — nouvelle structure en box
    container.innerHTML = `
        <div class="technique-gif-wrapper">
            <!-- En-tête de la box -->
            <div class="technique-box-header">
                <div class="technique-box-question">⚡ Identifie la technique !</div>
            </div>

            <!-- Zone GIF -->
            <div class="technique-gif-area">
                <img 
                    src="${personnageTechniqueDuJour.technique}" 
                    alt="Technique mystère"
                    class="technique-gif ${isRevealed ? 'revealed' : ''}"
                    style="filter: blur(${blur}px);"
                    id="technique-gif-img"
                >
            </div>

            <!-- Footer avec les toggles intégrés -->
            <div class="technique-box-footer">
                <button class="tech-setting-toggle ${couleurOn ? 'active' : ''}" id="toggle-couleur" onclick="toggleSetting('couleur')">
                    🎨 Couleur : <span id="label-couleur">${couleurOn ? 'ON' : 'OFF'}</span>
                </button>
                <button class="tech-setting-toggle ${deflouOn ? 'active' : ''}" id="toggle-deflou" onclick="toggleSetting('deflou')">
                    🔍 Déflou progressif : <span id="label-deflou">${deflouOn ? 'ON' : 'OFF'}</span>
                </button>
            </div>
        </div>
    `;
}

// ===== RECHERCHE =====
function searchPersonnagesTechnique(query) {
    if (!query || query.length < 1) return [];
    const norm = removeAccentsTechnique(query.toLowerCase());

    return personnagesTechnique.filter(p => {
        const nom = getTechniqueNom(p);
        const match = removeAccentsTechnique(nom.toLowerCase()).includes(norm);
        const notSelected = !essaisTechnique.some(e => e.id === p.id);
        return match && notSelected;
    }).slice(0, 8);
}

function showSuggestionsTechnique(list) {
    const container = document.getElementById('suggestionsTechnique');
    if (list.length === 0) {
        container.innerHTML = '<div class="no-results">🔍 Aucun personnage trouvé</div>';
        container.className = 'suggestions show';
        return;
    }

    container.innerHTML = list.map(perso => {
        const nom = getTechniqueNom(perso);
        const photoUrl = getTechniquePhotoUrl(perso);
        const imgSrc = photoUrl || createTechniquePlaceholder(nom.charAt(0), 50);
        const onErr = photoUrl ? `onerror="this.src='${createTechniquePlaceholder(nom.charAt(0), 50)}'"` : '';
        return `
            <div class="suggestion-item" data-perso-id="${perso.id}">
                <img src="${imgSrc}" alt="${nom}" class="player-photo" ${onErr}>
                <div class="player-info">
                    <div class="player-name">${nom}</div>
                </div>
            </div>
        `;
    }).join('');

    container.className = 'suggestions show';
    container.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            selectPersonnageTechnique(parseInt(item.getAttribute('data-perso-id')));
        });
    });
}

function hideSuggestionsTechnique() {
    const container = document.getElementById('suggestionsTechnique');
    container.innerHTML = '';
    container.className = 'suggestions';
}

// ===== SÉLECTION D'UN ESSAI =====
function selectPersonnageTechnique(persoId) {
    if (techniqueGagnee) return;

    const perso = personnagesTechnique.find(p => p.id === persoId);
    if (!perso || essaisTechnique.some(e => e.id === persoId)) return;

    essaisTechnique.push(perso);

    const searchInput = document.getElementById('searchInputTechnique');
    searchInput.value = '';
    hideSuggestionsTechnique();

    const isCorrect = perso.id === personnageTechniqueDuJour.id;

    // Mettre à jour le flou
    renderTechniqueGif();

    // Afficher les essais
    renderEssaisTechnique();

    if (isCorrect) {
        techniqueGagnee = true;
        setTimeout(() => showVictoireTechnique(), 1200);
    }

    saveGameStateTechnique();
}

// ===== AFFICHAGE DES ESSAIS =====
function renderEssaisTechnique() {
    const container = document.getElementById('resultsTechnique');
    if (!container) return;

    if (essaisTechnique.length === 0) {
        container.innerHTML = '';
        return;
    }

    const html = `
        <div class="technique-essais-list">
            ${[...essaisTechnique].reverse().map((perso, idx) => {
                const isCorrect = perso.id === personnageTechniqueDuJour.id;
                const num = essaisTechnique.length - idx;
                const nom = getTechniqueNom(perso);
                const photoUrl = getTechniquePhotoUrl(perso);
                const imgSrc = photoUrl || createTechniquePlaceholder(nom.charAt(0), 60);
                const onErr = photoUrl ? `onerror="this.src='${createTechniquePlaceholder(nom.charAt(0), 60)}'"` : '';

                return `
                    <div class="technique-essai-item ${isCorrect ? 'correct' : 'incorrect'}">
                        <img src="${imgSrc}" alt="${nom}" class="technique-essai-photo" ${onErr}>
                        <span class="technique-essai-nom">${nom}</span>
                        <span class="technique-essai-num">#${num}</span>
                        <div class="technique-essai-badge ${isCorrect ? 'correct' : 'incorrect'}">
                            <span class="technique-badge-dot ${isCorrect ? 'correct' : 'incorrect'}"></span>
                            ${isCorrect ? 'Correct' : 'Incorrect'}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    container.innerHTML = html;
}

// ===== VICTOIRE =====
function showVictoireTechnique() {
    if (document.getElementById('victory-box-technique')) return;

    if (typeof window.dbCounterRegisterWin === 'function') {
        window.dbCounterRegisterWin('technique');
    }
    if (typeof window.dbNavRegisterWin === 'function') {
        window.dbNavRegisterWin('technique', essaisTechnique.length);
    }

    const searchInput = document.getElementById('searchInputTechnique');
    searchInput.disabled = true;
    searchInput.placeholder = 'Technique trouvée ! Revenez demain...';

    const nom = getTechniqueNom(personnageTechniqueDuJour);
    const photoUrl = getTechniquePhotoUrl(personnageTechniqueDuJour);
    const imgSrc = photoUrl || createTechniquePlaceholder(nom.charAt(0), 150);
    const onErr = photoUrl ? `onerror="this.src='${createTechniquePlaceholder(nom.charAt(0), 150)}'"` : '';

    const victoryHTML = `
        <div class="victory-container" id="victory-box-technique">
            <div class="box victory-box-compact">
                <div class="victory-row-top">
                    <div class="victory-photo-wrap">
                        <img src="${imgSrc}" alt="${nom}" class="victory-photo-compact" ${onErr}>
                    </div>
                    <div class="victory-main-info">
                        <div class="victory-title-compact">🎉 VICTOIRE !</div>
                        <div class="victory-text-compact">La technique appartenait à <span class="victory-name">${nom}</span> !</div>
                        <div class="victory-stats-row">
                            <div class="stat-pill">✦ ${essaisTechnique.length} essai${essaisTechnique.length > 1 ? 's' : ''}</div>
                            <div class="stat-pill countdown-pill">⏱ <span id="countdown-timer-technique">${getTimeUntilMidnightTechnique()}</span></div>
                        </div>
                    </div>
                </div>
                <div class="technique-victory-gif">
                    <img src="${personnageTechniqueDuJour.technique}" alt="Technique révélée" class="technique-victory-gif-img">
                </div>
                <div class="next-mode-section">
                    <div class="next-mode-label">Mode suivant :</div>
                    <button class="next-mode-btn classique-next-btn" onclick="showMode('moitie')">
                        <div class="next-mode-btn-icon">
                            <img src="assets/img/mm.png" alt="Moitié-Moitié" class="icon icon-moitie" style="width:100%;height:100%;border:none;box-shadow:none;border-radius:4px;">
                        </div>
                        <div class="next-mode-btn-content">
                            <div class="next-mode-btn-title">Moitié-Moitié</div>
                            <div class="next-mode-btn-sub">Devinez les deux personnages fusionnés</div>
                        </div>
                        <div class="next-mode-btn-arrow">→</div>
                    </button>
                </div>
            </div>
        </div>
    `;

    const resultsEl = document.getElementById('resultsTechnique');
    resultsEl.insertAdjacentHTML('afterend', victoryHTML);

    setTimeout(() => {
        document.getElementById('victory-box-technique')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);

    setInterval(updateCountdownTechnique, 1000);
    saveGameStateTechnique();
}

// ===== SAUVEGARDE =====
function saveGameStateTechnique() {
    const state = {
        date: getDailySeedTechnique(),
        attempts: essaisTechnique.map(p => p.id),
        hasWon: techniqueGagnee
    };
    localStorage.setItem('dbTechniqueState', JSON.stringify(state));
}

function loadGameStateTechnique() {
    const saved = localStorage.getItem('dbTechniqueState');
    if (!saved) return;

    try {
        const state = JSON.parse(saved);
        if (state.date !== getDailySeedTechnique()) {
            localStorage.removeItem('dbTechniqueState');
            return;
        }

        state.attempts.forEach(id => {
            const perso = personnagesTechnique.find(p => p.id === id);
            if (perso) essaisTechnique.push(perso);
        });

        renderTechniqueGif();
        renderEssaisTechnique();

        if (state.hasWon) {
            techniqueGagnee = true;
            showVictoireTechnique();
        }
    } catch (e) {
        console.error('Erreur chargement état technique:', e);
        localStorage.removeItem('dbTechniqueState');
    }
}

// ===== ÉVÉNEMENTS =====
function initTechniqueEvents() {
    const searchInput = document.getElementById('searchInputTechnique');
    const searchBtn = document.querySelector('#technique-mode .search-btn-technique');

    searchInput.addEventListener('input', e => {
        const q = e.target.value.trim();
        q.length === 0 ? hideSuggestionsTechnique() : showSuggestionsTechnique(searchPersonnagesTechnique(q));
    });

    searchInput.addEventListener('focus', () => {
        const q = searchInput.value.trim();
        if (q.length > 0) showSuggestionsTechnique(searchPersonnagesTechnique(q));
    });

    searchInput.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            hideSuggestionsTechnique();
            searchInput.blur();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const results = searchPersonnagesTechnique(searchInput.value.trim());
            if (results.length > 0) selectPersonnageTechnique(results[0].id);
        }
    });

    if (searchBtn) {
        searchBtn.addEventListener('click', e => {
            e.preventDefault();
            const results = searchPersonnagesTechnique(searchInput.value.trim());
            results.length === 1
                ? selectPersonnageTechnique(results[0].id)
                : showSuggestionsTechnique(results);
        });
    }

    // Fermer suggestions en cliquant ailleurs
    document.addEventListener('click', e => {
        if (!e.target.closest('#technique-mode .search-container-technique')) {
            hideSuggestionsTechnique();
        }
    });
}

// ===== SETTINGS =====
function loadSettings() {
    const couleur = localStorage.getItem('tech_couleur') !== 'off';
    const deflou  = localStorage.getItem('tech_deflou')  !== 'off';

    applySettingCouleur(couleur);
    applySettingDeflou(deflou);

    // Les boutons sont maintenant dans la box (créée par renderTechniqueGif),
    // donc on ne les met à jour ici que s'ils existent déjà
    const btnC = document.getElementById('toggle-couleur');
    const btnD = document.getElementById('toggle-deflou');
    if (btnC) { btnC.classList.toggle('active', couleur); }
    if (btnD) { btnD.classList.toggle('active', deflou); }
    const lC = document.getElementById('label-couleur');
    const lD = document.getElementById('label-deflou');
    if (lC) lC.textContent = couleur ? 'ON' : 'OFF';
    if (lD) lD.textContent  = deflou  ? 'ON' : 'OFF';
}

function toggleSetting(key) {
    const current = localStorage.getItem('tech_' + key) !== 'off';
    const next = !current;
    localStorage.setItem('tech_' + key, next ? 'on' : 'off');

    const btn = document.getElementById('toggle-' + key);
    const label = document.getElementById('label-' + key);
    if (btn) btn.classList.toggle('active', next);
    if (label) label.textContent = next ? 'ON' : 'OFF';

    if (key === 'couleur') applySettingCouleur(next);
    if (key === 'deflou')  applySettingDeflou(next);
}

function applySettingCouleur(enabled) {
    const img = document.getElementById('technique-gif-img');
    if (!img) return;

    // Recalculer le filtre proprement sans accumuler
    const blur = getCurrentBlur();
    const isRevealed = techniqueGagnee || blur === 0;
    const blurValue = isRevealed ? 0 : blur;
    const grayscale = enabled ? '' : ' grayscale(100%)';
    img.style.filter = `blur(${blurValue}px)${grayscale}`;
}

function applySettingDeflou(enabled) {
    // rien ici
}

function isCouleurEnabled() {
    return localStorage.getItem('tech_couleur') !== 'off';
}

function isDeflouEnabled() {
    return localStorage.getItem('tech_deflou') !== 'off';
}


// ===== INITIALISATION =====
async function initTechniqueMode() {
    console.log('Initialisation du mode Technique...');

    // Réinitialiser
    essaisTechnique = [];
    personnageTechniqueDuJour = null;
    techniqueGagnee = false;

    await loadPersonnagesTechnique();
    selectDailyTechnique();

    if (!personnageTechniqueDuJour) {
        document.getElementById('technique-mode').innerHTML += `
            <div class="technique-no-data">
                <p>⚠️ Aucune technique disponible pour le moment.</p>
            </div>
        `;
        return;
    }

    loadSettings();
    renderTechniqueGif();
    loadGameStateTechnique();
    initTechniqueEvents();

    console.log('Mode Technique prêt ! ⚡');
}

window.initTechniqueMode = initTechniqueMode;