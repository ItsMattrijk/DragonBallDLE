// ===== VARIABLES GLOBALES MODE MOITIÉ-MOITIÉ =====
let personnagesMoitie = [];
let essaisPerso1 = [];
let essaisPerso2 = [];
let perso1DuJour = null;
let perso2DuJour = null;
let perso1Trouve = false;
let perso2Trouve = false;
let moitieGagne = false;
let activeSlot = 1; // 1 ou 2 — quel personnage l'utilisateur cherche

// ===== CHARGEMENT =====
async function loadPersonnagesMoitie() {
    try {
        const response = await fetch('js/data.json');
        if (!response.ok) throw new Error('Erreur chargement données');
        const data = await response.json();
        personnagesMoitie = data.personnages;
        console.log(`${personnagesMoitie.length} personnages chargés (moitié)`);
    } catch (error) {
        console.error('Erreur chargement moitié:', error);
    }
}

// ===== UTILITAIRES =====
function getMoitieNom(perso) {
    return Array.isArray(perso.nom) ? perso.nom.join(' / ') : perso.nom;
}

function getMoitiePhotoUrl(perso) {
    if (!perso) return null;
    if (perso.photo && perso.photo.startsWith('http')) return perso.photo;
    if (perso.photo) return `assets/img/personnages/${perso.photo}`;
    return null;
}

function createMoitiePlaceholder(letter, size = 120) {
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FF9900';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${size * 0.45}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, size / 2, size / 2);
    return canvas.toDataURL();
}

function getDailySeedMoitie() {
    const today = new Date();
    const base = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const resetCounter = parseInt(localStorage.getItem('dbResetCounter_moitie') || '0');
    return base + 55555 + (resetCounter * 123456);
}

function seededRandomMoitie(seed, offset = 0) {
    const x = Math.sin(seed + offset + 3) * 10000;
    return x - Math.floor(x);
}

function getTimeUntilMidnightMoitie() {
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

function updateCountdownMoitie() {
    const el = document.getElementById('countdown-timer-moitie');
    if (el) el.textContent = getTimeUntilMidnightMoitie();
}

function removeAccentsMoitie(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ===== SÉLECTION DES PERSONNAGES DU JOUR =====
function selectDailyMoitie() {
    if (personnagesMoitie.length < 2) return;

    const seed = getDailySeedMoitie();

    const idx1 = Math.floor(seededRandomMoitie(seed, 0) * personnagesMoitie.length);
    perso1DuJour = personnagesMoitie[idx1];

    let idx2 = Math.floor(seededRandomMoitie(seed, 1) * personnagesMoitie.length);
    if (idx2 === idx1) idx2 = (idx1 + 1) % personnagesMoitie.length;
    perso2DuJour = personnagesMoitie[idx2];

    console.log('🌓 Fusion du jour:', getMoitieNom(perso1DuJour), '×', getMoitieNom(perso2DuJour));
}

// ===== FUSION CANVAS =====
/**
 * Génère une vraie image fusionnée sur canvas :
 * - moitié gauche = perso1 (avec flou/grayscale si pas trouvé)
 * - moitié droite = perso2 (avec flou/grayscale si pas trouvé)
 * - fondu dégradé au centre (zone de ~20% de largeur)
 */
async function buildFusionCanvas(url1, url2, blur1, blur2, found1, found2) {
    const W = 600;
    const H = 400;
    const FADE_ZONE = 80; // largeur de la zone de fondu au centre en px

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Charger les deux images
    const loadImg = (src) => new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });

    const [img1, img2] = await Promise.all([loadImg(url1), loadImg(url2)]);

    // Dessiner le fond noir
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    // Fonction pour dessiner une image cadrée (object-fit: cover, object-position: top center)
    function drawCoveredImg(img, x, y, w, h) {
        if (!img) return;
        const imgRatio = img.width / img.height;
        const boxRatio = w / h;
        let sx, sy, sw, sh;
        if (imgRatio > boxRatio) {
            // image plus large : centrer horizontalement
            sh = img.height;
            sw = img.height * boxRatio;
            sx = (img.width - sw) / 2;
            sy = 0;
        } else {
            // image plus haute : aligner en haut
            sw = img.width;
            sh = img.width / boxRatio;
            sx = 0;
            sy = 0; // top
        }
        ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    }

    // ── Côté gauche (perso 1) avec dégradé clip ──
    ctx.save();
    // Appliquer flou / grayscale si nécessaire via filtre CSS canvas
    let filter1 = '';
    if (!found1 && blur1 > 0) filter1 += `blur(${blur1}px) `;
    if (!found1) filter1 += 'grayscale(60%)';
    ctx.filter = filter1.trim() || 'none';

    // Dessiner l'image sur canvas temporaire gauche
    const leftCanvas = document.createElement('canvas');
    leftCanvas.width = W;
    leftCanvas.height = H;
    const leftCtx = leftCanvas.getContext('2d');
    leftCtx.fillStyle = '#0a0a0f';
    leftCtx.fillRect(0, 0, W, H);
    drawCoveredImgOnCtx(leftCtx, img1, 0, 0, W / 2 + FADE_ZONE, H);

    ctx.drawImage(leftCanvas, 0, 0);
    ctx.restore();

    // ── Côté droit (perso 2) ──
    ctx.save();
    let filter2 = '';
    if (!found2 && blur2 > 0) filter2 += `blur(${blur2}px) `;
    if (!found2) filter2 += 'grayscale(60%)';
    ctx.filter = filter2.trim() || 'none';

    const rightCanvas = document.createElement('canvas');
    rightCanvas.width = W;
    rightCanvas.height = H;
    const rightCtx = rightCanvas.getContext('2d');
    rightCtx.fillStyle = '#0a0a0f';
    rightCtx.fillRect(0, 0, W, H);
    // On dessine perso2 sur la moitié droite
    drawCoveredImgOnCtx(rightCtx, img2, W / 2 - FADE_ZONE, 0, W / 2 + FADE_ZONE, H);

    ctx.drawImage(rightCanvas, 0, 0);
    ctx.restore();

    // ── Dégradé de fondu au centre (efface la jointure) ──
    // On applique un masque de fusion : gauche opaque → droite opaque, avec transition au milieu
    // Pour simuler ça proprement on redessine les deux moitiés avec globalCompositeOperation

    // Refaire proprement avec layers
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = W;
    finalCanvas.height = H;
    const fCtx = finalCanvas.getContext('2d');

    // Fond
    fCtx.fillStyle = '#0a0a0f';
    fCtx.fillRect(0, 0, W, H);

    // Layer gauche : dessine sur toute la largeur mais clippe avec gradient alpha
    const layerLeft = document.createElement('canvas');
    layerLeft.width = W; layerLeft.height = H;
    const lCtx = layerLeft.getContext('2d');
    let f1 = '';
    if (!found1 && blur1 > 0) f1 += `blur(${blur1}px) `;
    if (!found1) f1 += 'grayscale(60%)';
    lCtx.filter = f1.trim() || 'none';
    drawCoveredImgOnCtx(lCtx, img1, 0, 0, W, H);

    // Appliquer masque alpha gauche (opaque à gauche, transparent à droite)
    const lMask = document.createElement('canvas');
    lMask.width = W; lMask.height = H;
    const lmCtx = lMask.getContext('2d');
    const lgGrad = lmCtx.createLinearGradient(W / 2 - FADE_ZONE, 0, W / 2 + FADE_ZONE, 0);
    lgGrad.addColorStop(0, 'rgba(0,0,0,1)');
    lgGrad.addColorStop(1, 'rgba(0,0,0,0)');
    lmCtx.fillStyle = lgGrad;
    lmCtx.fillRect(0, 0, W, H);

    lCtx.filter = 'none';
    lCtx.globalCompositeOperation = 'destination-in';
    lCtx.drawImage(lMask, 0, 0);

    fCtx.drawImage(layerLeft, 0, 0);

    // Layer droit
    const layerRight = document.createElement('canvas');
    layerRight.width = W; layerRight.height = H;
    const rCtx = layerRight.getContext('2d');
    let f2 = '';
    if (!found2 && blur2 > 0) f2 += `blur(${blur2}px) `;
    if (!found2) f2 += 'grayscale(60%)';
    rCtx.filter = f2.trim() || 'none';
    drawCoveredImgOnCtx(rCtx, img2, 0, 0, W, H);

    const rMask = document.createElement('canvas');
    rMask.width = W; rMask.height = H;
    const rmCtx = rMask.getContext('2d');
    const rgGrad = rmCtx.createLinearGradient(W / 2 - FADE_ZONE, 0, W / 2 + FADE_ZONE, 0);
    rgGrad.addColorStop(0, 'rgba(0,0,0,0)');
    rgGrad.addColorStop(1, 'rgba(0,0,0,1)');
    rmCtx.fillStyle = rgGrad;
    rmCtx.fillRect(0, 0, W, H);

    rCtx.filter = 'none';
    rCtx.globalCompositeOperation = 'destination-in';
    rCtx.drawImage(rMask, 0, 0);

    fCtx.drawImage(layerRight, 0, 0);

    // ── Overlay lumineux au centre (ligne de fusion stylée) ──
    const lineGrad = fCtx.createLinearGradient(W / 2 - 2, 0, W / 2 + 2, 0);
    lineGrad.addColorStop(0, 'rgba(0,212,255,0)');
    lineGrad.addColorStop(0.5, 'rgba(0,212,255,0.55)');
    lineGrad.addColorStop(1, 'rgba(0,212,255,0)');
    fCtx.fillStyle = lineGrad;
    fCtx.fillRect(W / 2 - 15, 0, 30, H);

    return finalCanvas;
}

// Helper : dessine une image en cover sur un contexte donné
function drawCoveredImgOnCtx(ctx, img, x, y, w, h) {
    if (!img) return;
    const imgRatio = img.width / img.height;
    const boxRatio = w / h;
    let sx, sy, sw, sh;
    if (imgRatio > boxRatio) {
        sh = img.height;
        sw = img.height * boxRatio;
        sx = (img.width - sw) / 2;
        sy = 0;
    } else {
        sw = img.width;
        sh = img.width / boxRatio;
        sx = 0;
        sy = 0;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// ===== RENDU DE L'IMAGE DE FUSION =====
function renderFusionImage() {
    const container = document.getElementById('moitie-fusion-container');
    if (!container) return;

    const url1 = getMoitiePhotoUrl(perso1DuJour);
    const url2 = getMoitiePhotoUrl(perso2DuJour);
    const ph1 = createMoitiePlaceholder(getMoitieNom(perso1DuJour).charAt(0), 200);
    const ph2 = createMoitiePlaceholder(getMoitieNom(perso2DuJour).charAt(0), 200);

    const blur1 = !perso1Trouve ? Math.max(0, 20 - essaisPerso1.length * 2) : 0;
    const blur2 = !perso2Trouve ? Math.max(0, 20 - essaisPerso2.length * 2) : 0;

    // Structure HTML avec canvas placeholder pendant le chargement
    container.innerHTML = `
        <div class="fusion-card">
            <!-- En-tête -->
            <div class="fusion-card-header">
                
                <div class="fusion-header-text">QUI SONT CES DEUX PERSONNAGES ?</div>
                
            </div>

            <!-- Zone visuelle fusionnée : canvas unique -->
            <div class="fusion-visual-zone fusion-canvas-zone">
                <canvas id="fusion-canvas" width="600" height="400" style="width:100%;height:100%;display:block;object-fit:cover;"></canvas>

                <!-- Badges superposés -->
                <div class="fusion-badge-overlay">

                    <!-- Indicateur slot actif -->
                    ${!moitieGagne ? `
                    <div class="active-slot-indicator ${activeSlot === 1 ? 'active-left' : 'active-right'}"></div>
                    ` : ''}
                </div>
            </div>

            <!-- Sélecteur de slot -->
            <div class="slot-selector" ${moitieGagne ? 'style="display:none"' : ''}>
                <span class="slot-label">Je cherche :</span>
                <div class="slot-tabs">
                    <button class="slot-tab ${activeSlot === 1 ? 'active' : ''} ${perso1Trouve ? 'completed' : ''}" onclick="setActiveSlot(1)">
                        <span class="slot-half-icon">◐</span>
                        Personnage de gauche
                        ${perso1Trouve ? ' ✓' : ''}
                    </button>
                    <button class="slot-tab ${activeSlot === 2 ? 'active' : ''} ${perso2Trouve ? 'completed' : ''}" onclick="setActiveSlot(2)">
                        <span class="slot-half-icon">◑</span>
                        Personnage de droite
                        ${perso2Trouve ? ' ✓' : ''}
                    </button>
                </div>
            </div>
        </div>
    `;

    // Construire la fusion canvas en async
    const src1 = url1 || ph1;
    const src2 = url2 || ph2;

    buildFusionCanvas(src1, src2, blur1, blur2, perso1Trouve, perso2Trouve).then(fusionCanvas => {
        const target = document.getElementById('fusion-canvas');
        if (!target) return;
        const ctx = target.getContext('2d');
        ctx.drawImage(fusionCanvas, 0, 0);
    });
}

function updateFusionImage() {
    // Re-render complet pour rafraîchir le canvas
    renderFusionImage();
}

// ===== SLOT ACTIF =====
function setActiveSlot(slot) {
    if (slot === 1 && perso1Trouve) return;
    if (slot === 2 && perso2Trouve) return;
    activeSlot = slot;
    renderFusionImage();
    highlightActiveSlot();
    updateSearchPlaceholder();
    renderEssaisMoitie();
}

function highlightActiveSlot() {
    // L'indicateur est géré dans le HTML généré par renderFusionImage()
}

function updateSearchPlaceholder() {
    const input = document.getElementById('searchInputMoitie');
    if (!input) return;
    if (activeSlot === 1 && !perso1Trouve) {
        input.placeholder = 'Personnage de gauche...';
    } else if (activeSlot === 2 && !perso2Trouve) {
        input.placeholder = 'Personnage de droite...';
    }
}

// ===== RECHERCHE =====
function searchPersonnagesMoitie(query) {
    if (!query || query.length < 1) return [];
    const norm = removeAccentsMoitie(query.toLowerCase());
    const currentEssais = activeSlot === 1 ? essaisPerso1 : essaisPerso2;

    return personnagesMoitie.filter(p => {
        const nom = getMoitieNom(p);
        const match = removeAccentsMoitie(nom.toLowerCase()).includes(norm);
        const notSelected = !currentEssais.some(e => e.id === p.id);
        return match && notSelected;
    }).slice(0, 8);
}

function showSuggestionsMoitie(list) {
    const container = document.getElementById('suggestionsMoitie');
    if (list.length === 0) {
        container.innerHTML = '<div class="no-results">🔍 Aucun personnage trouvé</div>';
        container.className = 'suggestions show';
        return;
    }

    container.innerHTML = list.map(perso => {
        const nom = getMoitieNom(perso);
        const photoUrl = getMoitiePhotoUrl(perso);
        const imgSrc = photoUrl || createMoitiePlaceholder(nom.charAt(0), 50);
        const onErr = photoUrl ? `onerror="this.src='${createMoitiePlaceholder(nom.charAt(0), 50)}'"` : '';
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
            selectPersonnageMoitie(parseInt(item.dataset.persoId));
        });
    });
}

function hideSuggestionsMoitie() {
    const container = document.getElementById('suggestionsMoitie');
    if (container) container.className = 'suggestions';
}

// ===== SÉLECTION D'UN PERSONNAGE =====
function selectPersonnageMoitie(id) {
    const perso = personnagesMoitie.find(p => p.id === id);
    if (!perso) return;

    const targetPerso = activeSlot === 1 ? perso1DuJour : perso2DuJour;
    const essais = activeSlot === 1 ? essaisPerso1 : essaisPerso2;

    if (essais.some(e => e.id === id)) return;

    essais.push(perso);

    const input = document.getElementById('searchInputMoitie');
    if (input) input.value = '';
    hideSuggestionsMoitie();

    const isCorrect = perso.id === targetPerso.id;

    if (isCorrect) {
        if (activeSlot === 1) perso1Trouve = true;
        else perso2Trouve = true;
    }

    if (perso1Trouve && !perso2Trouve) activeSlot = 2;
    else if (perso2Trouve && !perso1Trouve) activeSlot = 1;

    if (perso1Trouve && perso2Trouve) moitieGagne = true;

    updateFusionImage();
    highlightActiveSlot();
    updateSearchPlaceholder();
    renderEssaisMoitie();

    if (moitieGagne) {
        saveGameStateMoitie();
        setTimeout(() => showVictoireMoitie(), 400);
    } else {
        saveGameStateMoitie();
    }
}

// ===== RENDU DES ESSAIS =====
function renderEssaisMoitie() {
    const container = document.getElementById('resultsMoitie');
    if (!container) return;

    let html = '';

    // Quand la partie est gagnée, afficher les deux colonnes
    if (moitieGagne) {
        if (essaisPerso1.length > 0) {
            html += buildEssaisSection(essaisPerso1, perso1DuJour, '◐', 'left-dot', 'Personnage de gauche');
        }
        if (essaisPerso2.length > 0) {
            html += buildEssaisSection(essaisPerso2, perso2DuJour, '◑', 'right-dot', 'Personnage de droite');
        }
    } else {
        // En cours de jeu : afficher uniquement le slot actif
        if (activeSlot === 1 && essaisPerso1.length > 0) {
            html += buildEssaisSection(essaisPerso1, perso1DuJour, '◐', 'left-dot', 'Personnage de gauche');
        } else if (activeSlot === 2 && essaisPerso2.length > 0) {
            html += buildEssaisSection(essaisPerso2, perso2DuJour, '◑', 'right-dot', 'Personnage de droite');
        }
    }

    container.innerHTML = html;

    setTimeout(() => {
        container.querySelectorAll('.new-essai').forEach(el => {
            setTimeout(() => el.classList.remove('new-essai'), 2000);
        });
    }, 50);
}

function buildEssaisSection(essais, persoDuJour, icon, dotClass, label) {
    return `
        <div class="moitie-essais-section">
            <div class="moitie-essais-title">
                <span class="half-dot ${dotClass}">${icon}</span>
                Essais — ${label}
            </div>
            ${[...essais].reverse().map((perso, i) => {
                const isCorrect = perso.id === persoDuJour.id;
                const nom = getMoitieNom(perso);
                const photoUrl = getMoitiePhotoUrl(perso);
                const ph = createMoitiePlaceholder(nom.charAt(0), 50);
                return `
                    <div class="moitie-essai-item ${isCorrect ? 'correct' : 'incorrect'} ${i === 0 ? 'new-essai' : ''}">
                        <img src="${photoUrl || ph}" alt="${nom}" class="moitie-essai-img" onerror="this.src='${ph}'">
                        <span class="moitie-essai-name">${nom}</span>
                        <span class="moitie-essai-badge ${isCorrect ? 'correct' : 'incorrect'}">
                            ${isCorrect ? '✦ TROUVÉ' : '✕'}
                        </span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ===== VICTOIRE =====
function showVictoireMoitie() {
    if (document.getElementById('victory-box-moitie')) return;

    if (typeof window.dbCounterRegisterWin === 'function') {
        window.dbCounterRegisterWin('moitie');
    }
    if (typeof window.dbNavRegisterWin === 'function') {
        window.dbNavRegisterWin('moitie', essaisPerso1.length + essaisPerso2.length);
    }
    const totalEssais = essaisPerso1.length + essaisPerso2.length;
    const nom1 = getMoitieNom(perso1DuJour);
    const nom2 = getMoitieNom(perso2DuJour);
    const url1 = getMoitiePhotoUrl(perso1DuJour);
    const url2 = getMoitiePhotoUrl(perso2DuJour);
    const ph1 = createMoitiePlaceholder(nom1.charAt(0), 120);
    const ph2 = createMoitiePlaceholder(nom2.charAt(0), 120);

    const victoryHTML = `
        <div id="victory-box-moitie" class="victory-box-moitie">
            <div class="victory-moitie-glow"></div>
            <div class="victory-moitie-header">
                <div class="victory-moitie-title">FUSION DEVOILEE !</div>
                <div class="victory-moitie-subtitle">Tu as trouvé les deux personnages !</div>
            </div>

            <div class="victory-moitie-reveal">
                <div class="victory-perso-card left-perso-card">
                    <img src="${url1 || ph1}" alt="${nom1}" class="victory-perso-img" onerror="this.src='${ph1}'">
                    <div class="victory-perso-name">${nom1}</div>
                    <div class="victory-perso-count">${essaisPerso1.length} essai${essaisPerso1.length > 1 ? 's' : ''}</div>
                </div>

                <div class="victory-fusion-cross"></div>

                <div class="victory-perso-card right-perso-card">
                    <img src="${url2 || ph2}" alt="${nom2}" class="victory-perso-img" onerror="this.src='${ph2}'">
                    <div class="victory-perso-name">${nom2}</div>
                    <div class="victory-perso-count">${essaisPerso2.length} essai${essaisPerso2.length > 1 ? 's' : ''}</div>
                </div>
            </div>

            <div class="victory-moitie-stats">
                <div class="stat-pill">✦ ${totalEssais} essai${totalEssais > 1 ? 's' : ''} au total</div>
                <div class="stat-pill countdown-pill">⏱ <span id="countdown-timer-moitie">${getTimeUntilMidnightMoitie()}</span></div>
            </div>

            <div class="next-mode-section" style="margin-top:1.2rem;">
                <div class="next-mode-label">Mode suivant :</div>
                <button class="next-mode-btn classique-next-btn" onclick="showMode('classique')">
                    <div class="next-mode-btn-icon">
                        <img src="assets/img/db.webp" alt="Classique" class="icon icon-classique" style="width:100%;height:100%;border:none;box-shadow:none;border-radius:4px;">
                    </div>
                    <div class="next-mode-btn-content">
                        <div class="next-mode-btn-title">Classique</div>
                        <div class="next-mode-btn-sub">Devine le personnage mystère</div>
                    </div>
                    <div class="next-mode-btn-arrow">→</div>
                </button>
            </div>
        </div>
    `;

    const resultsEl = document.getElementById('resultsMoitie');
    if (resultsEl) {
        resultsEl.insertAdjacentHTML('afterend', victoryHTML);
    }

    setTimeout(() => {
        document.getElementById('victory-box-moitie')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);

    setInterval(updateCountdownMoitie, 1000);
}

// ===== SAUVEGARDE =====
function saveGameStateMoitie() {
    const state = {
        date: getDailySeedMoitie(),
        attempts1: essaisPerso1.map(p => p.id),
        attempts2: essaisPerso2.map(p => p.id),
        perso1Trouve,
        perso2Trouve,
        moitieGagne
    };
    localStorage.setItem('dbMoitieState', JSON.stringify(state));
}

function loadGameStateMoitie() {
    const saved = localStorage.getItem('dbMoitieState');
    if (!saved) return false;

    try {
        const state = JSON.parse(saved);
        if (state.date !== getDailySeedMoitie()) {
            localStorage.removeItem('dbMoitieState');
            return false;
        }

        state.attempts1.forEach(id => {
            const p = personnagesMoitie.find(x => x.id === id);
            if (p) essaisPerso1.push(p);
        });
        state.attempts2.forEach(id => {
            const p = personnagesMoitie.find(x => x.id === id);
            if (p) essaisPerso2.push(p);
        });

        perso1Trouve = state.perso1Trouve;
        perso2Trouve = state.perso2Trouve;
        moitieGagne = state.moitieGagne;

        if (perso1Trouve && !perso2Trouve) activeSlot = 2;
        else if (perso2Trouve && !perso1Trouve) activeSlot = 1;

        renderFusionImage();
        highlightActiveSlot();
        updateSearchPlaceholder();
        renderEssaisMoitie();

        if (moitieGagne) {
            showVictoireMoitie();
        }

        return true;

    } catch (e) {
        console.error('Erreur chargement état moitié:', e);
        localStorage.removeItem('dbMoitieState');
        return false;
    }
}

// ===== ÉVÉNEMENTS =====
function initMoitieEvents() {
    const searchInput = document.getElementById('searchInputMoitie');
    const searchBtn = document.querySelector('#moitie-mode .search-btn-moitie');

    searchInput.addEventListener('input', e => {
        const q = e.target.value.trim();
        q.length === 0 ? hideSuggestionsMoitie() : showSuggestionsMoitie(searchPersonnagesMoitie(q));
    });

    searchInput.addEventListener('focus', () => {
        const q = searchInput.value.trim();
        if (q.length > 0) showSuggestionsMoitie(searchPersonnagesMoitie(q));
    });

    searchInput.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            hideSuggestionsMoitie();
            searchInput.blur();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const results = searchPersonnagesMoitie(searchInput.value.trim());
            if (results.length > 0) selectPersonnageMoitie(results[0].id);
        }
    });

    if (searchBtn) {
        searchBtn.addEventListener('click', e => {
            e.preventDefault();
            const results = searchPersonnagesMoitie(searchInput.value.trim());
            results.length === 1
                ? selectPersonnageMoitie(results[0].id)
                : showSuggestionsMoitie(results);
        });
    }

    document.addEventListener('click', e => {
        if (!e.target.closest('#moitie-mode .search-container-moitie')) {
            hideSuggestionsMoitie();
        }
    });
}

// ===== INITIALISATION =====
async function initMoitieMode() {
    console.log('Initialisation du mode Moitié-Moitié...');

    essaisPerso1 = [];
    essaisPerso2 = [];
    perso1DuJour = null;
    perso2DuJour = null;
    perso1Trouve = false;
    perso2Trouve = false;
    moitieGagne = false;
    activeSlot = 1;

    await loadPersonnagesMoitie();
    selectDailyMoitie();

    if (!perso1DuJour || !perso2DuJour) {
        document.getElementById('moitie-mode').innerHTML += `<div class="moitie-no-data"><p>⚠️ Impossible de charger les personnages.</p></div>`;
        return;
    }

    // Ne pas rendre l'image ici — loadGameStateMoitie le fera avec le bon état restauré
    // Si pas de sauvegarde, loadGameStateMoitie retourne sans rien faire, on rend alors
    const hadSave = loadGameStateMoitie();
    if (!hadSave) {
        renderFusionImage();
        highlightActiveSlot();
        updateSearchPlaceholder();
    }
    initMoitieEvents();

    console.log('Mode Moitié-Moitié prêt ! 🌓');
}

window.initMoitieMode = initMoitieMode;
window.setActiveSlot = setActiveSlot;