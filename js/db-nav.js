/* ========================================================
   DB-NAV.JS — Barre de navigation + Modals Dragon Ball
   Stats / Comment jouer / À propos — pour les 3 modes
   ======================================================== */

(function () {
    'use strict';

    // ── Clés localStorage stats ────────────────────────────
    const STATS_KEY = {
        classique : 'dbStats',
        technique : 'dbStatsTechnique',
        moitie    : 'dbStatsMoitie'
    };

    // Retourne les stats du mode (crée des stats vides si absent)
    function getStats(mode) {
        const raw = localStorage.getItem(STATS_KEY[mode]);
        const base = { gamesPlayed:0, gamesWon:0, currentStreak:0, maxStreak:0, totalAttempts:0, averageAttempts:0, distribution:{} };
        if (!raw) return base;
        try { return Object.assign(base, JSON.parse(raw)); }
        catch { return base; }
    }

    function saveStats(mode, stats) {
        localStorage.setItem(STATS_KEY[mode], JSON.stringify(stats));
    }

    // Expose pour classique.js (compatibilité — il sauvegarde déjà dans 'dbStats')
    window.dbNavGetStats  = getStats;
    window.dbNavSaveStats = saveStats;

    // ── Compte à rebours minuit ─────────────────────────────
    function getCountdown() {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const diff = midnight - now;
        const h = String(Math.floor(diff / 3600000)).padStart(2,'0');
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2,'0');
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2,'0');
        return `${h}:${m}:${s}`;
    }

    // ── Toast ───────────────────────────────────────────────
    function showToast(msg) {
        let toast = document.getElementById('db-nav-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'db-nav-toast';
            toast.className = 'db-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
    }

    // ── Ferme tous les modals DB ─────────────────────────────
    function closeAllDbModals() {
        document.querySelectorAll('.db-modal-overlay.open').forEach(el => {
            el.classList.remove('open');
        });
        document.body.classList.remove('db-modal-open');
    }

    function openModal(id) {
        closeAllDbModals();
        const overlay = document.getElementById(id);
        if (overlay) {
            overlay.classList.add('open');
            document.body.classList.add('db-modal-open');
        }
    }

    // Clic sur l'overlay (en dehors du modal) → ferme
    function bindOverlayClose(overlayId) {
        const overlay = document.getElementById(overlayId);
        if (!overlay) return;
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeAllDbModals();
        });
    }

    // ── Génère le HTML de la barre nav ─────────────────────
    function buildNavHTML(mode) {
        return `
<div class="db-nav-container" data-nav-mode="${mode}">
  <div class="db-nav-box">

    <!-- Statistiques -->
    <button class="db-nav-btn" title="Mes Statistiques"
            onclick="dbNavOpenStats('${mode}')">
      <span class="db-nav-icon-emoji">📊</span>
      <span>Stats</span>
    </button>

    <div class="db-nav-sep"></div>

    <!-- Comment jouer -->
    <button class="db-nav-btn" title="Comment jouer ?"
            onclick="dbNavOpenHelp('${mode}')">
      <span class="db-nav-icon-emoji">❓</span>
      <span>Règles</span>
    </button>

    <div class="db-nav-sep"></div>

    <!-- À propos -->
    <button class="db-nav-btn" title="À propos"
            onclick="dbNavOpenAbout('${mode}')">
      <span class="db-nav-icon-emoji">⚡</span>
      <span>Infos</span>
    </button>

    <div class="db-nav-sep"></div>

    <!-- Dons -->
    <a class="db-nav-btn"
       href="https://www.paypal.com/paypalme/GRAPHMF5"
       target="_blank" rel="noopener" title="Soutenir le projet">
      <span class="db-nav-icon-emoji">💛</span>
      <span>Soutien</span>
    </a>

  </div>
</div>`;
    }

    // ── Injecte la nav dans chaque mode ─────────────────────
    function injectNavs() {
        const insertPoints = {
            classique : { selector: '#classique-mode .mode-nav-bar', position: 'afterend' },
            technique : { selector: '#technique-mode .mode-nav-bar', position: 'afterend' },
            moitie    : { selector: '#moitie-mode .mode-nav-bar',    position: 'afterend' }
        };

        Object.entries(insertPoints).forEach(([mode, cfg]) => {
            if (document.querySelector(`[data-nav-mode="${mode}"]`)) return; // déjà injecté
            const target = document.querySelector(cfg.selector);
            if (target) {
                target.insertAdjacentHTML(cfg.position, buildNavHTML(mode));
            }
        });
    }

    // ════════════════════════════════════════════════════════
    //  MODAL STATISTIQUES
    // ════════════════════════════════════════════════════════

    function buildStatsModalHTML() {
        return `
<div id="db-modal-stats" class="db-modal-overlay" role="dialog" aria-modal="true" aria-label="Statistiques">
  <div class="db-modal">
    <div class="db-modal-header">
      <h2 class="db-modal-title">
        <span class="db-modal-title-icon">📊</span> MES STATISTIQUES
      </h2>
      <button class="db-modal-close" onclick="dbNavCloseAll()" aria-label="Fermer">&times;</button>
    </div>
    <div class="db-modal-body">

      <!-- Tabs modes -->
      <div class="db-stats-tabs">
        <button class="db-stats-tab active" data-tab="classique" onclick="dbNavStatsTab(this)">🐉 Classique</button>
        <button class="db-stats-tab"        data-tab="technique" onclick="dbNavStatsTab(this)">⭐ Technique</button>
        <button class="db-stats-tab"        data-tab="moitie"    onclick="dbNavStatsTab(this)">🌓 Moitié</button>
      </div>

      <!-- Classique -->
      <div id="db-stats-classique" class="db-stats-tab-content active"></div>
      <!-- Technique -->
      <div id="db-stats-technique" class="db-stats-tab-content"></div>
      <!-- Moitié -->
      <div id="db-stats-moitie" class="db-stats-tab-content"></div>

    </div>
  </div>
</div>`;
    }

    function renderStatsContent(mode) {
        const container = document.getElementById(`db-stats-${mode}`);
        if (!container) return;

        const stats = getStats(mode);
        const winrate = stats.gamesPlayed > 0
            ? Math.round(stats.gamesWon / stats.gamesPlayed * 100)
            : 0;
        const avg = stats.averageAttempts || (
            stats.gamesWon > 0
                ? Math.round(stats.totalAttempts / stats.gamesWon * 10) / 10
                : 0
        );

        if (stats.gamesPlayed === 0) {
            container.innerHTML = `
<div class="db-stats-empty">
  <div class="db-stats-empty-icon">🐉</div>
  <div class="db-stats-empty-text">
    Aucune partie jouée pour ce mode.<br>
    Lance-toi et reviens voir tes stats !
  </div>
</div>`;
            return;
        }

        // Distribution
        const distrib = stats.distribution || {};
        const maxDistrib = Math.max(1, ...Object.values(distrib));

        let distribHTML = '';
        for (let i = 1; i <= 12; i++) {
            const count = distrib[i] || 0;
            if (count === 0 && i > 8) continue;
            const pct = Math.max(8, Math.round(count / maxDistrib * 100));
            distribHTML += `
<div class="db-distrib-row">
  <span class="db-distrib-label">${i}</span>
  <div class="db-distrib-bar-wrap">
    <div class="db-distrib-bar" style="width:${pct}%">
      <span class="db-distrib-count">${count}</span>
    </div>
  </div>
</div>`;
        }

        container.innerHTML = `
<div class="db-stats-grid">
  <div class="db-stat-card">
    <div class="db-stat-value">${stats.gamesPlayed}</div>
    <div class="db-stat-label">Parties<br>jouées</div>
  </div>
  <div class="db-stat-card">
    <div class="db-stat-value">${winrate}%</div>
    <div class="db-stat-label">Taux de<br>victoire</div>
  </div>
  <div class="db-stat-card">
    <div class="db-stat-value">${stats.currentStreak}</div>
    <div class="db-stat-label">Série<br>actuelle</div>
  </div>
  <div class="db-stat-card">
    <div class="db-stat-value">${stats.maxStreak}</div>
    <div class="db-stat-label">Meilleure<br>série</div>
  </div>
</div>

<div class="db-stats-grid" style="grid-template-columns:repeat(2,1fr); margin-top:0;">
  <div class="db-stat-card">
    <div class="db-stat-value">${stats.gamesWon}</div>
    <div class="db-stat-label">Victoires</div>
  </div>
  <div class="db-stat-card">
    <div class="db-stat-value">${avg}</div>
    <div class="db-stat-label">Moy. essais<br>(victoires)</div>
  </div>
</div>

${distribHTML ? `
<div class="db-distrib-section">
  <div class="db-distrib-title">🔥 Distribution des essais</div>
  ${distribHTML}
</div>` : ''}

<button class="db-share-btn" onclick="dbNavShare('${mode}')">📤 Partager mes stats</button>
<button class="db-reset-btn" onclick="dbNavResetStats('${mode}')">🗑️ Réinitialiser les stats ${mode}</button>`;
    }

    // ════════════════════════════════════════════════════════
    //  MODAL COMMENT JOUER
    // ════════════════════════════════════════════════════════

    const HELP_CONTENT = {
        classique: {
            icon: '🐉',
            title: 'COMMENT JOUER — CLASSIQUE',
            sections: [
                {
                    icon: '🎯', label: 'OBJECTIF',
                    body: 'Un personnage Dragon Ball est sélectionné chaque jour. Devine qui c\'est en un minimum d\'essais !'
                },
                {
                    icon: '🎮', label: 'COMMENT JOUER',
                    body: `<ol style="padding-left:18px;margin:8px 0;color:rgba(255,255,255,0.85);">
                        <li>Tape un nom de personnage dans la barre de recherche</li>
                        <li>Sélectionne-le dans les suggestions</li>
                        <li>Compare les attributs affichés avec le personnage mystère</li>
                        <li>Utilise les indices de couleur pour affiner ta recherche</li>
                    </ol>`
                },
                {
                    icon: '🌈', label: 'INDICATEURS DE COULEUR',
                    body: `<div class="db-legend">
                        <div class="db-legend-item"><div class="db-legend-dot correct">✓</div> <span><strong style="color:#2ecc71">Vert</strong> — Attribut identique au personnage mystère</span></div>
                        <div class="db-legend-item"><div class="db-legend-dot partial">~</div> <span><strong style="color:#f59e0b">Orange</strong> — Attribut partiellement correct (ex: même saga)</span></div>
                        <div class="db-legend-item"><div class="db-legend-dot wrong">✗</div> <span><strong style="color:#e74c3c">Rouge</strong> — Attribut différent du personnage mystère</span></div>
                        <div class="db-legend-item"><span style="font-size:1.1rem;width:28px;text-align:center;flex-shrink:0;">▲</span> <span>Le personnage mystère a une valeur supérieure</span></div>
                        <div class="db-legend-item"><span style="font-size:1.1rem;width:28px;text-align:center;flex-shrink:0;">▼</span> <span>Le personnage mystère a une valeur inférieure</span></div>
                    </div>`
                },
                {
                    icon: '💡', label: 'INDICES',
                    body: 'Des indices se débloquent au fil des essais : silhouette des cheveux, première apparition, affiliation... Utilise-les avec sagesse !'
                },
                {
                    icon: '⏰', label: 'NOUVEAU PERSONNAGE',
                    countdown: true
                }
            ]
        },
        technique: {
            icon: '⭐',
            title: 'COMMENT JOUER — TECHNIQUE',
            sections: [
                {
                    icon: '🎯', label: 'OBJECTIF',
                    body: 'Un GIF d\'une technique Dragon Ball s\'affiche. À toi de deviner quel personnage l\'utilise !'
                },
                {
                    icon: '🎮', label: 'COMMENT JOUER',
                    body: `<ol style="padding-left:18px;margin:8px 0;color:rgba(255,255,255,0.85);">
                        <li>Observe le GIF de la technique affichée (peut être flouté)</li>
                        <li>Tape le nom du personnage que tu suspectes</li>
                        <li>✅ Bonne réponse = victoire !</li>
                        <li>❌ Mauvaise réponse = le GIF devient plus net</li>
                    </ol>`
                },
                {
                    icon: '🎨', label: 'OPTIONS DE JEU',
                    body: 'Tu peux activer ou désactiver le flou progressif et la colorisation du GIF pour rendre le défi plus ou moins difficile !'
                },
                {
                    icon: '💡', label: 'INDICES PROGRESSIFS',
                    body: 'Plus tu fais d\'essais incorrects, plus l\'image se défloute. Essaie de trouver avec le moins d\'indices possible !'
                },
                {
                    icon: '⏰', label: 'NOUVELLE TECHNIQUE',
                    countdown: true
                }
            ]
        },
        moitie: {
            icon: '🌓',
            title: 'COMMENT JOUER — MOITIÉ-MOITIÉ',
            sections: [
                {
                    icon: '🎯', label: 'OBJECTIF',
                    body: 'Deux personnages Dragon Ball sont fusionnés côte à côte en une seule image. Retrouve-les tous les deux !'
                },
                {
                    icon: '🎮', label: 'COMMENT JOUER',
                    body: `<ol style="padding-left:18px;margin:8px 0;color:rgba(255,255,255,0.85);">
                        <li>L'image fusionnée de deux personnages s'affiche (floutée)</li>
                        <li>Sélectionne si tu cherches le personnage de <strong>gauche</strong> ou de <strong>droite</strong></li>
                        <li>Tape un nom et valide ta réponse</li>
                        <li>Trouve les deux personnages pour gagner !</li>
                    </ol>`
                },
                {
                    icon: '🌫️', label: 'DÉFLOU PROGRESSIF',
                    body: 'L\'image est d\'abord très floutée. Chaque mauvais essai diminue le flou, te permettant de mieux distinguer les personnages.'
                },
                {
                    icon: '🏆', label: 'VICTOIRE',
                    body: 'Trouve les deux personnages pour remporter la partie ! Tu peux les trouver dans n\'importe quel ordre.'
                },
                {
                    icon: '⏰', label: 'NOUVELLE FUSION',
                    countdown: true
                }
            ]
        }
    };

    function buildHelpModalHTML() {
        return `
<div id="db-modal-help" class="db-modal-overlay" role="dialog" aria-modal="true" aria-label="Comment jouer">
  <div class="db-modal">
    <div class="db-modal-header">
      <h2 class="db-modal-title" id="db-help-modal-title">
        <span class="db-modal-title-icon">❓</span>
        <span id="db-help-title-text">COMMENT JOUER</span>
      </h2>
      <button class="db-modal-close" onclick="dbNavCloseAll()" aria-label="Fermer">&times;</button>
    </div>
    <div class="db-modal-body" id="db-help-body"></div>
  </div>
</div>`;
    }

    function renderHelpContent(mode) {
        const cfg = HELP_CONTENT[mode];
        if (!cfg) return;

        document.getElementById('db-help-title-text').textContent = cfg.title;

        let html = '';
        cfg.sections.forEach(sec => {
            html += `<div class="db-section-title"><span>${sec.icon}</span> ${sec.label}</div>`;
            if (sec.countdown) {
                html += `
<div class="db-countdown-capsule">
  <span class="db-countdown-icon">⏰</span>
  <div class="db-countdown-text">Nouveau ${mode === 'moitie' ? 'duo' : mode === 'technique' ? 'technique' : 'personnage'} dans :</div>
  <div class="db-countdown-value" id="db-help-countdown">…</div>
</div>`;
            } else {
                html += `<p style="color:rgba(255,255,255,0.82);margin:0 0 4px;">${sec.body}</p>`;
            }
        });

        document.getElementById('db-help-body').innerHTML = html;
        updateHelpCountdown();
    }

    function updateHelpCountdown() {
        const el = document.getElementById('db-help-countdown');
        if (el) el.textContent = getCountdown();
    }

    // ════════════════════════════════════════════════════════
    //  MODAL À PROPOS
    // ════════════════════════════════════════════════════════

    function buildAboutModalHTML() {
        return `
<div id="db-modal-about" class="db-modal-overlay" role="dialog" aria-modal="true" aria-label="À propos">
  <div class="db-modal">
    <div class="db-modal-header">
      <h2 class="db-modal-title">
        <span class="db-modal-title-icon">⚡</span> À PROPOS
      </h2>
      <button class="db-modal-close" onclick="dbNavCloseAll()" aria-label="Fermer">&times;</button>
    </div>
    <div class="db-modal-body">

      <div class="db-section-title"><span>🐉</span> DRAGONBALLDLE</div>
      <p style="color:rgba(255,255,255,0.82);margin:0 0 12px;">
        DragonBallDLE est un jeu de devinette quotidien basé sur l'univers
        de Dragon Ball. Chaque jour, un nouveau personnage (ou technique,
        ou fusion) est sélectionné pour te faire travailler la mémoire !
      </p>
      <div class="db-pill">🔁 Nouveau défi tous les jours à minuit</div>

      <div class="db-section-title" style="margin-top:22px;"><span>🕹️</span> NOS AUTRES JEUX</div>
      <a class="db-link-block" href="https://itsmattrijk.github.io/PSGDLE/" target="_blank" rel="noopener">
        <span class="db-link-icon">⚽</span>
        <div class="db-link-text">
          <strong>PSGDLE</strong>
          <span>Devine les joueurs du Paris Saint-Germain</span>
        </div>
      </a>
      <a class="db-link-block" href="https://itsmattrijk.github.io/JojoDLE/" target="_blank" rel="noopener" style="margin-top:8px;">
        <span class="db-link-icon">👊</span>
        <div class="db-link-text">
          <strong>JojoDLE</strong>
          <span>Devine les personnages de JoJo's Bizarre Adventure</span>
        </div>
      </a>

      <div class="db-section-title" style="margin-top:22px;"><span>✉️</span> CONTACT & SUGGESTIONS</div>
      <p style="color:rgba(255,255,255,0.82);margin:0 0 12px;">
        Une idée d'amélioration ? Un bug à signaler ? Un personnage manquant ?
        Envoie-nous un message, on lit tout !
      </p>
      <a class="db-link-block" href="mailto:matt21graphics@gmail.com">
        <span class="db-link-icon">📧</span>
        <div class="db-link-text">
          <strong>matt21graphics@gmail.com</strong>
          <span>On répond en français avec plaisir !</span>
        </div>
      </a>

      <div class="db-section-title" style="margin-top:22px;"><span>💛</span> SOUTENIR LE PROJET</div>
      <p style="color:rgba(255,255,255,0.82);margin:0 0 12px;">
        DragonBallDLE est gratuit et sans pub. Si tu aimes le projet,
        un petit coup de pouce est toujours apprécié !
      </p>
      <a class="db-link-block" href="https://www.paypal.com/paypalme/GRAPHMF5" target="_blank" rel="noopener">
        <span class="db-link-icon">💳</span>
        <div class="db-link-text">
          <strong>Faire un don via PayPal</strong>
          <span>Chaque contribution aide à faire durer le projet 🙏</span>
        </div>
      </a>

      <p style="color:rgba(255,255,255,0.3);font-size:0.72rem;margin-top:22px;text-align:center;">
        Dragon Ball est une propriété de Akira Toriyama / Shueisha.<br>
        Ce jeu est non-officiel et réalisé par des fans, sans but lucratif.
      </p>

    </div>
  </div>
</div>`;
    }

    // ════════════════════════════════════════════════════════
    //  FONCTIONS GLOBALES EXPOSÉES
    // ════════════════════════════════════════════════════════

    window.dbNavCloseAll = closeAllDbModals;

    window.dbNavOpenStats = function (mode) {
        openModal('db-modal-stats');
        // Active l'onglet du bon mode
        document.querySelectorAll('.db-stats-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === mode);
        });
        document.querySelectorAll('.db-stats-tab-content').forEach(el => {
            el.classList.toggle('active', el.id === `db-stats-${mode}`);
        });
        renderStatsContent(mode);
    };

    window.dbNavOpenHelp = function (mode) {
        openModal('db-modal-help');
        renderHelpContent(mode);
    };

    window.dbNavOpenAbout = function (mode) {
        openModal('db-modal-about');
    };

    window.dbNavStatsTab = function (btn) {
        const mode = btn.dataset.tab;
        document.querySelectorAll('.db-stats-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.db-stats-tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const content = document.getElementById(`db-stats-${mode}`);
        if (content) content.classList.add('active');
        renderStatsContent(mode);
    };

    window.dbNavShare = function (mode) {
        const stats = getStats(mode);
        const winrate = stats.gamesPlayed > 0
            ? Math.round(stats.gamesWon / stats.gamesPlayed * 100)
            : 0;
        const modeLabels = { classique:'Classique 🐉', technique:'Technique ⭐', moitie:'Moitié-Moitié 🌓' };
        const text = [
            `🐉 DragonBallDLE — ${modeLabels[mode]}`,
            `📊 Parties : ${stats.gamesPlayed} | Victoires : ${stats.gamesWon} (${winrate}%)`,
            `🔥 Série actuelle : ${stats.currentStreak} | Record : ${stats.maxStreak}`,
            `⚔️ Moy. essais : ${stats.averageAttempts || '—'}`,
            `👉 Joue sur : itsmattrijk.github.io/DragonBallDLE`
        ].join('\n');

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => showToast('📋 Stats copiées !'))
                .catch(() => showToast('❌ Impossible de copier'));
        } else {
            showToast('❌ Clipboard non disponible');
        }
    };

    window.dbNavResetStats = function (mode) {
        if (!confirm(`Réinitialiser les stats du mode ${mode} ? Cette action est irréversible.`)) return;
        localStorage.removeItem(STATS_KEY[mode]);
        renderStatsContent(mode);
        showToast('✅ Stats réinitialisées !');
    };

    // ── Countdown live dans le modal aide ───────────────────
    setInterval(updateHelpCountdown, 1000);

    // ════════════════════════════════════════════════════════
    //  HOOK : enregistre une victoire dans les stats
    //  Appelé par chaque mode quand il gagne
    // ════════════════════════════════════════════════════════

    /**
     * dbNavRegisterWin(mode, attempts)
     * mode     : 'classique' | 'technique' | 'moitie'
     * attempts : nombre d'essais (int)
     */
    window.dbNavRegisterWin = function (mode, attempts) {
        const stats = getStats(mode);

        stats.gamesPlayed  = (stats.gamesPlayed  || 0) + 1;
        stats.gamesWon     = (stats.gamesWon     || 0) + 1;
        stats.currentStreak= (stats.currentStreak|| 0) + 1;
        stats.maxStreak    = Math.max(stats.maxStreak || 0, stats.currentStreak);
        stats.totalAttempts= (stats.totalAttempts|| 0) + (attempts || 0);
        stats.averageAttempts = Math.round(stats.totalAttempts / stats.gamesWon * 10) / 10;

        if (attempts) {
            if (!stats.distribution) stats.distribution = {};
            stats.distribution[attempts] = (stats.distribution[attempts] || 0) + 1;
        }

        saveStats(mode, stats);
    };

    /**
     * dbNavRegisterLoss(mode, attempts)
     * Appelé en cas de défaite (si tu veux tracker les parties perdues)
     */
    window.dbNavRegisterLoss = function (mode, attempts) {
        const stats = getStats(mode);
        stats.gamesPlayed   = (stats.gamesPlayed   || 0) + 1;
        stats.currentStreak = 0;
        stats.totalAttempts = (stats.totalAttempts  || 0) + (attempts || 0);
        saveStats(mode, stats);
    };

    // ════════════════════════════════════════════════════════
    //  INJECTION AU CHARGEMENT
    // ════════════════════════════════════════════════════════

    function init() {
        // Injecter les modals dans le body (une seule fois)
        if (!document.getElementById('db-modal-stats')) {
            document.body.insertAdjacentHTML('beforeend', buildStatsModalHTML());
            document.body.insertAdjacentHTML('beforeend', buildHelpModalHTML());
            document.body.insertAdjacentHTML('beforeend', buildAboutModalHTML());

            // Fermer au clic sur l'overlay
            ['db-modal-stats','db-modal-help','db-modal-about'].forEach(bindOverlayClose);

            // Fermer avec Escape
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') closeAllDbModals();
            });
        }

        // Injecter les barres de nav dans les modes déjà présents dans le DOM
        injectNavs();
    }

    // Attendre que le DOM soit prêt, puis réessayer si un mode n'est pas encore présent
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Réinjecter si un mode est ouvert après coup (showMode)
    const _originalShowMode = window.showMode;
    if (typeof _originalShowMode === 'function') {
        window.showMode = function (mode) {
            _originalShowMode(mode);
            setTimeout(injectNavs, 150);
        };
    } else {
        // Fallback : observer les changements de classe .active
        const observer = new MutationObserver(function () {
            injectNavs();
        });
        document.querySelectorAll('.game-mode').forEach(el => {
            observer.observe(el, { attributes: true, attributeFilter: ['class'] });
        });
    }

    console.log('✅ DragonBallDLE Nav initialisé');

})();