(() => {
    "use strict";

    if (window.__FUTBLACK_V2__) return;
    window.__FUTBLACK_V2__ = true;

    const FB = {
        active: false,
        originalContent: null,
        contentParent: null,
        page: null,
        navButton: null,

        settings: {
            minProfit: 500,
            searchInterval: 2.0,
            pausesEnabled: true,
            pauseEvery: 20,
            pauseDuration: 30
        }
    };

    // ------------------------------------------------
    // HELPERS
    // ------------------------------------------------

    function formatCoins(value) {
        if (value === null || value === undefined) return "---";

        return Math.floor(value).toLocaleString("en-US");
    }

    function setStatus(text) {
        const el = document.getElementById("fb-status");

        if (el) {
            el.textContent = text;
        }
    }

    // ------------------------------------------------
    // FIND BOTTOM NAVIGATION
    // ------------------------------------------------

    function findBottomNavigation() {
        const candidates = [
            ...document.querySelectorAll("nav"),
            ...document.querySelectorAll(
                '[class*="nav"], [class*="Nav"]'
            )
        ];

        let best = null;
        let bestScore = 0;

        for (const element of candidates) {
            const text =
                (element.innerText || "").toLowerCase();

            let score = 0;

            if (text.includes("home")) score++;
            if (text.includes("squad")) score++;
            if (text.includes("transfer")) score++;
            if (text.includes("store")) score++;
            if (text.includes("club")) score++;

            const rect =
                element.getBoundingClientRect();

            // Prefer navigation elements near bottom.
            if (
                rect.bottom >
                window.innerHeight * 0.80
            ) {
                score += 2;
            }

            if (score > bestScore) {
                bestScore = score;
                best = element;
            }
        }

        return bestScore >= 4 ? best : null;
    }

    // ------------------------------------------------
    // FUTBLACK NAV BUTTON
    // ------------------------------------------------

    function createNavButton(nav) {
        if (
            document.getElementById(
                "futblack-nav-button"
            )
        ) {
            return;
        }

        // Try to copy an existing nav item so
        // dimensions match EA's navigation.
        const existingItems =
            Array.from(nav.children);

        let template = null;

        for (const item of existingItems) {
            const text =
                (item.innerText || "")
                    .trim()
                    .toLowerCase();

            if (
                text.includes("club") ||
                text.includes("store")
            ) {
                template = item;
                break;
            }
        }

        let button;

        if (template) {
            button =
                template.cloneNode(true);

            // Remove identifiers copied from EA.
            button.removeAttribute("id");

            button
                .querySelectorAll("[id]")
                .forEach(el => {
                    el.removeAttribute("id");
                });

            // Replace text labels.
            const textElements =
                button.querySelectorAll(
                    "span, div, p"
                );

            let replaced = false;

            for (const element of textElements) {
                const text =
                    (element.textContent || "")
                        .trim()
                        .toLowerCase();

                if (
                    text === "club" ||
                    text === "store"
                ) {
                    element.textContent =
                        "FutBlack";

                    replaced = true;
                }
            }

            if (!replaced) {
                button.innerHTML = "";
                buildCustomButton(button);
            } else {
                // Replace copied icon with FB.
                const possibleIcons =
                    button.querySelectorAll(
                        "svg, img"
                    );

                possibleIcons.forEach(icon => {
                    icon.style.display = "none";
                });

                const icon =
                    document.createElement("div");

                icon.className =
                    "fb-nav-logo";

                icon.textContent = "FB";

                button.prepend(icon);
            }
        } else {
            button =
                document.createElement("div");

            buildCustomButton(button);
        }

        button.id =
            "futblack-nav-button";

        button.classList.add(
            "futblack-nav-item"
        );

        button.addEventListener(
            "click",
            event => {
                event.preventDefault();
                event.stopPropagation();

                openFutBlack();
            }
        );

        nav.appendChild(button);

        FB.navButton = button;
    }

    function buildCustomButton(button) {
        button.innerHTML = `
            <div class="fb-nav-logo">
                FB
            </div>

            <div class="fb-nav-label">
                FutBlack
            </div>
        `;
    }

    // ------------------------------------------------
    // CREATE FUTBLACK PAGE
    // ------------------------------------------------

    function createFutBlackPage() {
        if (FB.page) return FB.page;

        const page =
            document.createElement("div");

        page.id = "futblack-page";

        page.innerHTML = `
            <div class="fb-page-header">

                <div>
                    <div class="fb-page-brand">
                        FUTBLACK
                    </div>

                    <div class="fb-page-subtitle">
                        FC Market Assistant
                    </div>
                </div>

                <div class="fb-online">
                    <span></span>
                    READY
                </div>

            </div>

            <div class="fb-tabs">

                <button
                    class="fb-tab active"
                    data-tab="live"
                >
                    Live Filters
                </button>

                <button
                    class="fb-tab"
                    data-tab="market"
                >
                    Market
                </button>

                <button
                    class="fb-tab"
                    data-tab="settings"
                >
                    Settings
                </button>

            </div>

            <div class="fb-page-body">

                <!-- LIVE FILTERS -->

                <section
                    class="fb-tab-content active"
                    id="fb-tab-live"
                >

                    <div class="fb-section-heading">
                        LIVE FILTER
                    </div>

                    <div class="fb-card">

                        <div class="fb-filter-top">

                            <div>
                                <div class="fb-small-label">
                                    CURRENT FILTER
                                </div>

                                <div class="fb-filter-name">
                                    Waiting for filter...
                                </div>
                            </div>

                            <div class="fb-score">
                                --
                            </div>

                        </div>

                        <div class="fb-market-grid">

                            <div>
                                <span>Lowest BIN</span>
                                <strong id="fb-lowest">
                                    ---
                                </strong>
                            </div>

                            <div>
                                <span>Max Buy</span>
                                <strong id="fb-max-buy">
                                    ---
                                </strong>
                            </div>

                            <div>
                                <span>Sell</span>
                                <strong id="fb-sell">
                                    ---
                                </strong>
                            </div>

                            <div>
                                <span>Profit</span>
                                <strong id="fb-profit">
                                    ---
                                </strong>
                            </div>

                        </div>

                        <button
                            id="fb-check-market"
                            class="fb-primary-button"
                        >
                            CHECK LOWEST BIN
                        </button>

                        <div
                            id="fb-status"
                            class="fb-status"
                        >
                            Waiting for market...
                        </div>

                    </div>

                </section>


                <!-- MARKET -->

                <section
                    class="fb-tab-content"
                    id="fb-tab-market"
                >

                    <div class="fb-section-heading">
                        MARKET CHECKER
                    </div>

                    <div class="fb-card">

                        <div class="fb-info-title">
                            Lowest BIN
                        </div>

                        <p class="fb-description">
                            FutBlack will use the
                            current Transfer Market
                            results to determine the
                            lowest Buy Now price.
                        </p>

                        <div class="fb-big-price">
                            <span id="fb-market-lowest">
                                ---
                            </span>
                            <small>coins</small>
                        </div>

                        <button
                            id="fb-market-check-button"
                            class="fb-primary-button"
                        >
                            CHECK MARKET
                        </button>

                    </div>

                </section>


                <!-- SETTINGS -->

                <section
                    class="fb-tab-content"
                    id="fb-tab-settings"
                >

                    <div class="fb-section-heading">
                        TRADING SETTINGS
                    </div>

                    <div class="fb-card">

                        <label class="fb-label">
                            Minimum Profit
                        </label>

                        <div class="fb-input-row">
                            <input
                                id="fb-min-profit"
                                type="number"
                                value="500"
                                min="0"
                                step="50"
                            >
                            <span>coins</span>
                        </div>


                        <label class="fb-label">
                            Search Interval
                        </label>

                        <div class="fb-input-row">
                            <input
                                id="fb-search-interval"
                                type="number"
                                value="2.0"
                                min="0.5"
                                step="0.1"
                            >
                            <span>seconds</span>
                        </div>


                        <div class="fb-setting-switch">

                            <div>
                                <strong>
                                    Use pauses
                                </strong>

                                <small>
                                    Pause searches
                                    periodically
                                </small>
                            </div>

                            <label class="fb-switch">
                                <input
                                    id="fb-pauses"
                                    type="checkbox"
                                    checked
                                >
                                <span></span>
                            </label>

                        </div>


                        <div id="fb-pause-options">

                            <label class="fb-label">
                                Pause every
                            </label>

                            <div class="fb-input-row">
                                <input
                                    id="fb-pause-every"
                                    type="number"
                                    value="20"
                                    min="1"
                                >
                                <span>searches</span>
                            </div>


                            <label class="fb-label">
                                Pause duration
                            </label>

                            <div class="fb-input-row">
                                <input
                                    id="fb-pause-duration"
                                    type="number"
                                    value="30"
                                    min="1"
                                >
                                <span>seconds</span>
                            </div>

                        </div>

                    </div>

                </section>

            </div>
        `;

        document.body.appendChild(page);

        FB.page = page;

        setupPageEvents();

        return page;
    }

    // ------------------------------------------------
    // EVENTS
    // ------------------------------------------------

    function setupPageEvents() {
        document
            .querySelectorAll(".fb-tab")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const tab =
                            button.dataset.tab;

                        switchTab(tab);
                    }
                );

            });

        const pauses =
            document.getElementById(
                "fb-pauses"
            );

        pauses.addEventListener(
            "change",
            () => {

                FB.settings.pausesEnabled =
                    pauses.checked;

                document.getElementById(
                    "fb-pause-options"
                ).style.display =
                    pauses.checked
                        ? "block"
                        : "none";
            }
        );

        document.getElementById(
            "fb-min-profit"
        ).addEventListener(
            "change",
            event => {

                FB.settings.minProfit =
                    Number(
                        event.target.value
                    ) || 0;
            }
        );

        document.getElementById(
            "fb-search-interval"
        ).addEventListener(
            "change",
            event => {

                FB.settings.searchInterval =
                    Number(
                        event.target.value
                    ) || 2;
            }
        );

        document.getElementById(
            "fb-pause-every"
        ).addEventListener(
            "change",
            event => {

                FB.settings.pauseEvery =
                    Number(
                        event.target.value
                    ) || 20;
            }
        );

        document.getElementById(
            "fb-pause-duration"
        ).addEventListener(
            "change",
            event => {

                FB.settings.pauseDuration =
                    Number(
                        event.target.value
                    ) || 30;
            }
        );

        const checkButtons = [
            document.getElementById(
                "fb-check-market"
            ),

            document.getElementById(
                "fb-market-check-button"
            )
        ];

        checkButtons.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    setStatus(
                        "Market reader will be connected next."
                    );
                }
            );

        });
    }

    function switchTab(tab) {
        document
            .querySelectorAll(".fb-tab")
            .forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.tab === tab
                );
            });

        document
            .querySelectorAll(
                ".fb-tab-content"
            )
            .forEach(section => {

                section.classList.remove(
                    "active"
                );
            });

        const target =
            document.getElementById(
                `fb-tab-${tab}`
            );

        if (target) {
            target.classList.add("active");
        }
    }

    // ------------------------------------------------
    // OPEN / CLOSE
    // ------------------------------------------------

    function openFutBlack() {
        createFutBlackPage();

        FB.active = true;

        FB.page.classList.add("active");

        document.body.classList.add(
            "futblack-open"
        );

        if (FB.navButton) {
            FB.navButton.classList.add(
                "fb-selected"
            );
        }
    }

    function closeFutBlack() {
        FB.active = false;

        if (FB.page) {
            FB.page.classList.remove(
                "active"
            );
        }

        document.body.classList.remove(
            "futblack-open"
        );

        if (FB.navButton) {
            FB.navButton.classList.remove(
                "fb-selected"
            );
        }
    }

    // If user presses another EA navigation item,
    // hide FutBlack.
    function watchEANavigation(nav) {
        nav.addEventListener(
            "click",
            event => {

                if (!FB.active) return;

                if (
                    event.target.closest(
                        "#futblack-nav-button"
                    )
                ) {
                    return;
                }

                closeFutBlack();
            },
            true
        );
    }

    // ------------------------------------------------
    // INIT
    // ------------------------------------------------

    function initialise() {
        const nav =
            findBottomNavigation();

        if (!nav) {
            return false;
        }

        createNavButton(nav);

        watchEANavigation(nav);

        return true;
    }

    // Web App is dynamic, so wait until
    // EA creates the navigation.
    let attempts = 0;

    const loader =
        setInterval(() => {

            attempts++;

            if (initialise()) {
                clearInterval(loader);
            }

            if (attempts > 60) {
                clearInterval(loader);

                console.warn(
                    "[FutBlack] Navigation not found."
                );
            }

        }, 1000);

})();
