// ========== CAROUSEL MOBILE — DRAGONBALLDLE (MODE CLASSIQUE) ==========
// Remplace displaySelectedPersonnages() sur mobile (≤ 768px)
// pour afficher le tableau de comparaison à 8 colonnes en scroll horizontal.

(function () {

    // ── Détection mobile ──────────────────────────────────────────────────────
    function isMobile() {
        return window.innerWidth <= 768;
    }

    // ── Patch de displaySelectedPersonnages ──────────────────────────────────
    // On attend que classique.js soit chargé (il expose window.initClassiqueMode),
    // puis on écrase displaySelectedPersonnages par notre version qui bascule
    // automatiquement entre la version desktop (grid) et la version mobile (carousel).

    function patchClassique() {
        // Stocke l'original pour le fallback desktop
        const _displayDesktop = window._displaySelectedPersonnagesDesktop
            || (function () {
                // Reconstitution de la version desktop (identique à classique.js)
                return function displaySelectedPersonnagesDesktop() {
                    const container = document.getElementById('resultsClassique');
                    if (!container) return;

                    if (typeof personnagesSelectionnes === 'undefined' || personnagesSelectionnes.length === 0) {
                        container.innerHTML = '';
                        return;
                    }

                    let html = `
                        <div class="categories-header">
                            <div class="category-header-item">Personnage</div>
                            <div class="category-header-item">Race</div>
                            <div class="category-header-item">Origine</div>
                            <div class="category-header-item">Genre</div>
                            <div class="category-header-item">Transformations</div>
                            <div class="category-header-item">Morts</div>
                            <div class="category-header-item">Saga</div>
                            <div class="category-header-item">Série</div>
                        </div>
                        <div id="personnages-list">
                    `;

                    [...personnagesSelectionnes].reverse().forEach((perso, index) => {
                        const c = compareWithDailyPersonnage(perso);
                        const isNew = index === 0 ? ' new-player' : '';
                        const nomStr = getPersonnageNom(perso);
                        const photoUrl = getPersonnagePhotoUrl(perso);
                        const imgSrc = photoUrl || createPlaceholderImage(nomStr.charAt(0), 80);
                        const onError = photoUrl ? `onerror="this.src='${createPlaceholderImage(nomStr.charAt(0), 80)}'"` : '';

                        html += `
                            <div class="selected-player${isNew}">
                                <div class="player-categories">
                                    <div class="category">
                                        <div class="category-content">
                                            <img src="${imgSrc}" alt="${nomStr}" class="player-main-photo" ${onError}>
                                            <span class="player-name-main">${nomStr}</span>
                                        </div>
                                    </div>
                                    <div class="category ${c.race}">
                                        <div class="category-content">
                                            <span class="category-value">${normalizeRace(perso.race)}</span>
                                        </div>
                                    </div>
                                    <div class="category ${c.origine}">
                                        <div class="category-content">
                                            <span class="category-value">${perso.origine}</span>
                                        </div>
                                    </div>
                                    <div class="category ${c.genre}">
                                        <div class="category-content">
                                            <span class="category-value">${perso.genre}</span>
                                        </div>
                                    </div>
                                    <div class="category ${c.transformations.status}">
                                        <div class="category-content">
                                            ${c.transformations.direction ? getArrowIcon(c.transformations.direction) : ''}
                                            <span class="category-value">${perso.NbTransformation}</span>
                                        </div>
                                    </div>
                                    <div class="category ${c.morts.status}">
                                        <div class="category-content">
                                            ${c.morts.direction ? getArrowIcon(c.morts.direction) : ''}
                                            <span class="category-value">${perso.NbMorts}</span>
                                        </div>
                                    </div>
                                    <div class="category ${c.saga}">
                                        <div class="category-content">
                                            <span class="category-value">${perso.saga}</span>
                                        </div>
                                    </div>
                                    <div class="category ${c.serie}">
                                        <div class="category-content">
                                            <span class="category-value">${perso.serie}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    });

                    html += `</div>`;
                    container.innerHTML = html;

                    setTimeout(() => {
                        const newEl = document.querySelector('#resultsClassique .selected-player.new-player');
                        if (newEl) {
                            setTimeout(() => newEl.classList.remove('new-player'), 2600);
                        }
                    }, 50);
                };
            })();

        // ── Version mobile avec carousel ──────────────────────────────────────
        function displaySelectedPersonnagesMobile() {
            const container = document.getElementById('resultsClassique');
            if (!container) return;

            if (typeof personnagesSelectionnes === 'undefined' || personnagesSelectionnes.length === 0) {
                container.innerHTML = '';
                return;
            }

            let html = `
                <div class="db-carousel-wrapper">
                    <div class="db-carousel-hint">
                        <span class="db-hint-icon">◀</span>
                        Défiler pour voir toutes les colonnes
                        <span class="db-hint-icon">▶</span>
                    </div>
                    <div class="db-carousel-container">
                        <div class="db-carousel-track">
                            <div class="db-categories-header">
                                <div class="db-category-header-item">Perso</div>
                                <div class="db-category-header-item">Race</div>
                                <div class="db-category-header-item">Origine</div>
                                <div class="db-category-header-item">Genre</div>
                                <div class="db-category-header-item">Transfo</div>
                                <div class="db-category-header-item">Morts</div>
                                <div class="db-category-header-item">Saga</div>
                                <div class="db-category-header-item">Série</div>
                            </div>
            `;

            [...personnagesSelectionnes].reverse().forEach((perso, index) => {
                const c = compareWithDailyPersonnage(perso);
                const isNew = index === 0 ? ' db-new-row' : '';
                const nomStr = getPersonnageNom(perso);
                const photoUrl = getPersonnagePhotoUrl(perso);
                const imgSrc = photoUrl || createPlaceholderImage(nomStr.charAt(0), 64);
                const onError = photoUrl ? `onerror="this.src='${createPlaceholderImage(nomStr.charAt(0), 64)}'"` : '';

                html += `
                    <div class="db-carousel-row${isNew}">
                        <!-- Photo + nom -->
                        <div class="db-carousel-cell db-cell-photo">
                            <img src="${imgSrc}" alt="${nomStr}" class="db-carousel-photo" ${onError}>
                            <span class="db-carousel-name">${nomStr}</span>
                        </div>
                        <!-- Race -->
                        <div class="db-carousel-cell ${c.race}">
                            <span class="db-cell-value">${normalizeRace(perso.race)}</span>
                        </div>
                        <!-- Origine -->
                        <div class="db-carousel-cell ${c.origine}">
                            <span class="db-cell-value">${perso.origine}</span>
                        </div>
                        <!-- Genre -->
                        <div class="db-carousel-cell ${c.genre}">
                            <span class="db-cell-value">${perso.genre}</span>
                        </div>
                        <!-- Transformations -->
                        <div class="db-carousel-cell ${c.transformations.status}">
                            ${c.transformations.direction ? _dbArrow(c.transformations.direction) : ''}
                            <span class="db-cell-value">${perso.NbTransformation}</span>
                        </div>
                        <!-- Morts -->
                        <div class="db-carousel-cell ${c.morts.status}">
                            ${c.morts.direction ? _dbArrow(c.morts.direction) : ''}
                            <span class="db-cell-value">${perso.NbMorts}</span>
                        </div>
                        <!-- Saga -->
                        <div class="db-carousel-cell ${c.saga}">
                            <span class="db-cell-value">${perso.saga}</span>
                        </div>
                        <!-- Série -->
                        <div class="db-carousel-cell ${c.serie}">
                            <span class="db-cell-value">${perso.serie}</span>
                        </div>
                    </div>
                `;
            });

            html += `
                        </div><!-- /.db-carousel-track -->
                    </div><!-- /.db-carousel-container -->
                    <div class="db-carousel-scrollbar">
                        <div class="db-carousel-scrollbar-thumb"></div>
                    </div>
                </div><!-- /.db-carousel-wrapper -->
            `;

            container.innerHTML = html;

            // ── Scrollbar custom ──────────────────────────────────────────────
            _initCarouselScrollbar(container);

            // ── Retire l'animation new-row après le délai ────────────────────
            setTimeout(() => {
                const newRow = container.querySelector('.db-carousel-row.db-new-row');
                if (newRow) {
                    setTimeout(() => newRow.classList.remove('db-new-row'), 2600);
                }
            }, 50);
        }

        // ── Scrollbar custom helper ───────────────────────────────────────────
        function _initCarouselScrollbar(container) {
            const carousel   = container.querySelector('.db-carousel-container');
            const thumbEl    = container.querySelector('.db-carousel-scrollbar-thumb');
            const scrollbar  = container.querySelector('.db-carousel-scrollbar');
            if (!carousel || !thumbEl || !scrollbar) return;

            function updateThumb() {
                const ratio      = carousel.clientWidth / carousel.scrollWidth;
                const thumbWidth = Math.max(ratio * 100, 12); // % min 12 %
                thumbEl.style.width = `${thumbWidth}%`;

                const scrollRatio = carousel.scrollLeft / (carousel.scrollWidth - carousel.clientWidth);
                const maxLeft     = 100 - thumbWidth;
                thumbEl.style.left = `${scrollRatio * maxLeft}%`;
            }

            carousel.addEventListener('scroll', updateThumb, { passive: true });
            // Appel initial + re-check après images chargées
            updateThumb();
            setTimeout(updateThumb, 300);
        }

        // ── Scrollbar custom pour les hint-buttons (mobile) ──────────────────
        function _initHintsScrollbar() {
            if (!isMobile()) return;

            const container = document.querySelector('#classique-mode .hint-buttons-container');
            if (!container) return;

            // Injecte la scrollbar si elle n'existe pas encore
            let scrollbarEl = document.getElementById('db-hints-scrollbar');
            if (!scrollbarEl) {
                scrollbarEl = document.createElement('div');
                scrollbarEl.className = 'db-hints-scrollbar';
                scrollbarEl.id = 'db-hints-scrollbar';
                scrollbarEl.innerHTML = '<div class="db-hints-scrollbar-thumb"></div>';
                container.insertAdjacentElement('afterend', scrollbarEl);
            }

            const thumbEl = scrollbarEl.querySelector('.db-hints-scrollbar-thumb');
            if (!thumbEl) return;

            function updateThumb() {
                const ratio      = container.clientWidth / container.scrollWidth;
                const thumbWidth = Math.max(ratio * 100, 25);
                thumbEl.style.width = `${thumbWidth}%`;
                const scrollRatio = container.scrollLeft / (container.scrollWidth - container.clientWidth || 1);
                const maxLeft     = 100 - thumbWidth;
                thumbEl.style.left  = `${scrollRatio * maxLeft}%`;
                // Cache la scrollbar si tout est visible
                scrollbarEl.style.display = ratio >= 1 ? 'none' : '';
            }

            container.addEventListener('scroll', updateThumb, { passive: true });
            updateThumb();
            setTimeout(updateThumb, 300);
        }

        // ── Mini helper flèche (indépendant de getArrowIcon) ─────────────────
        function _dbArrow(direction) {
            const path = direction === 'up'
                ? 'M12 5L12 19M12 5L6 11M12 5L18 11'
                : 'M12 19L12 5M12 19L18 13M12 19L6 13';
            return `<span class="db-arrow-indicator"><svg viewBox="0 0 24 24" fill="none">
                        <path d="${path}" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg></span>`;
        }

        // ── Remplacement de displaySelectedPersonnages ───────────────────────
        window.displaySelectedPersonnages = function () {
            if (isMobile()) {
                displaySelectedPersonnagesMobile();
            } else {
                _displayDesktop();
            }
        };

        // ── Patch renderHintButtonsClassique pour injecter la scrollbar ──────
        const _originalRender = window.renderHintButtonsClassique;
        window.renderHintButtonsClassique = function () {
            if (typeof _originalRender === 'function') _originalRender();
            // Petit délai pour laisser le DOM se mettre à jour
            setTimeout(_initHintsScrollbar, 50);
        };

        // Mise à jour au redimensionnement (desktop ↔ mobile)
        let _resizeTimer = null;
        window.addEventListener('resize', function () {
            clearTimeout(_resizeTimer);
            _resizeTimer = setTimeout(function () {
                const container = document.getElementById('resultsClassique');
                if (container && container.innerHTML.trim() !== '') {
                    window.displaySelectedPersonnages();
                }
            }, 200);
        });
    }

    // ── Attente que classique.js soit prêt ────────────────────────────────────
    // On tente le patch au plus tôt et au plus tard après DOMContentLoaded.
    function tryPatch() {
        if (typeof window.initClassiqueMode === 'function') {
            patchClassique();
        } else {
            setTimeout(tryPatch, 100);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryPatch);
    } else {
        tryPatch();
    }

})();