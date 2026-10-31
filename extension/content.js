(() => {
    "use strict";

    // Prevent FutBlack from loading twice.
    if (window.__FUTBLACK_LOADED__) {
        return;
    }

    window.__FUTBLACK_LOADED__ = true;

    const FutBlack = {
        active: false,
        page: null,
        navButton: null,
        navigation: null,

        settings: {
            minimumProfit: 500,
            searchInterval: 2.0,

            pausesEnabled: true,
            pauseEvery: 20,
            pauseDuration: 30
        },

        market: {
            lowestBin: null,
            maxBuy: null,
            sellPrice: null,
            profit: null,
            lastCheck: null
        }
    };


    // ============================================================
    // UTILITIES
    // ============================================================

    function formatCoins(value) {
        if (
            value === null ||
            value === undefined ||
            Number.isNaN(value)
        ) {
            return "---";
        }

        return Math.floor(value).toLocaleString("en-US");
    }


    function setStatus(message) {
        const status = document.getElementById(
            "fb-market-status"
        );

        if (status) {
            status.textContent = message;
        }
    }


    // ============================================================
    // FIND EA BOTTOM NAVIGATION
    // ============================================================

    function findBottomNavigation() {

        const elements = [
            ...document.querySelectorAll("nav"),
            ...document.querySelectorAll(
                '[class*="nav"], [class*="Nav"]'
            )
        ];

        let bestElement = null;
        let bestScore = 0;

        for (const element of elements) {

            const text = (
                element.innerText || ""
            ).toLowerCase();

            let score = 0;

            if (text.includes("home")) {
                score += 2;
            }

            if (text.includes("squad")) {
                score += 2;
            }

            if (text.includes("transfer")) {
                score += 2;
            }

            if (text.includes("store")) {
                score += 2;
            }

            if (text.includes("club")) {
                score += 2;
            }


            const rect =
                element.getBoundingClientRect();

            // Prefer navigation near bottom.
            if (
                rect.bottom >
                window.innerHeight * 0.80
            ) {
                score += 3;
            }


            if (score > bestScore) {
                bestScore = score;
                bestElement = element;
            }
        }


        if (bestScore >= 7) {
            return bestElement;
        }

        return null;
    }


    // ============================================================
    // CREATE FUTBLACK NAVIGATION BUTTON
    // ============================================================

    function createNavigationButton(nav) {

        if (
            document.getElementById(
                "futblack-nav-button"
            )
        ) {
            return;
        }


        const button =
            document.createElement("button");

        button.id =
            "futblack-nav-button";

        button.type = "button";

        button.setAttribute(
            "aria-label",
            "FutBlack"
        );


        // IMPORTANT:
        // We create our own button.
        // We do NOT clone Store or Club.
        button.innerHTML = `
            <div class="fb-nav-icon">
                FB
            </div>

            <div class="fb-nav-text">
                FutBlack
            </div>
        `;


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                openFutBlack();

            },
            true
        );


        nav.appendChild(button);


        FutBlack.navButton = button;
        FutBlack.navigation = nav;


        watchEANavigation(nav);
    }


    // ============================================================
    // CREATE FUTBLACK PAGE
    // ============================================================

    function createPage() {

        if (FutBlack.page) {
            return FutBlack.page;
        }


        const page =
            document.createElement("div");

        page.id = "futblack-page";


        page.innerHTML = `

            <header class="fb-header">

                <div>

                    <div class="fb-brand">
                        FUTBLACK
                    </div>

                    <div class="fb-subtitle">
                        FC 27 MARKET ASSISTANT
                    </div>

                </div>


                <div class="fb-ready">

                    <span class="fb-ready-dot"></span>

                    READY

                </div>

            </header>


            <nav class="fb-tabs">

                <button
                    class="fb-tab active"
                    data-fb-tab="live"
                >
                    LIVE FILTERS
                </button>


                <button
                    class="fb-tab"
                    data-fb-tab="market"
                >
                    MARKET
                </button>


                <button
                    class="fb-tab"
                    data-fb-tab="settings"
                >
                    SETTINGS
                </button>

            </nav>


            <main class="fb-content">


                <!-- ========================================= -->
                <!-- LIVE FILTERS                              -->
                <!-- ========================================= -->

                <section
                    id="fb-page-live"
                    class="fb-section active"
                >

                    <div class="fb-section-title">
                        ACTIVE FILTER
                    </div>


                    <div class="fb-card">


                        <div class="fb-filter-header">

                            <div>

                                <div class="fb-muted">
                                    CURRENT FILTER
                                </div>

                                <div
                                    id="fb-filter-name"
                                    class="fb-filter-name"
                                >
                                    Searching...
                                </div>

                            </div>


                            <div
                                id="fb-filter-score"
                                class="fb-score"
                            >
                                --
                            </div>

                        </div>


                        <div class="fb-price-grid">


                            <div class="fb-price-item">

                                <span>
                                    LOWEST BIN
                                </span>

                                <strong
                                    id="fb-lowest-bin"
                                >
                                    ---
                                </strong>

                            </div>


                            <div class="fb-price-item">

                                <span>
                                    MAX BUY
                                </span>

                                <strong
                                    id="fb-max-buy"
                                >
                                    ---
                                </strong>

                            </div>


                            <div class="fb-price-item">

                                <span>
                                    SELL
                                </span>

                                <strong
                                    id="fb-sell-price"
                                >
                                    ---
                                </strong>

                            </div>


                            <div class="fb-price-item">

                                <span>
                                    PROFIT
                                </span>

                                <strong
                                    id="fb-profit"
                                >
                                    ---
                                </strong>

                            </div>


                        </div>


                        <div class="fb-market-state">

                            <div class="fb-loading-dot"></div>

                            <div>

                                <strong>
                                    Automatic Market Check
                                </strong>

                                <span
                                    id="fb-market-status"
                                >
                                    Waiting for market data...
                                </span>

                            </div>

                        </div>


                    </div>


                    <div class="fb-card fb-secondary-card">

                        <div class="fb-row">

                            <span>
                                Search interval
                            </span>

                            <strong
                                id="fb-live-speed"
                            >
                                2.0s
                            </strong>

                        </div>


                        <div class="fb-row">

                            <span>
                                Pauses
                            </span>

                            <strong
                                id="fb-live-pauses"
                            >
                                ON
                            </strong>

                        </div>

                    </div>


                </section>


                <!-- ========================================= -->
                <!-- MARKET                                    -->
                <!-- ========================================= -->

                <section
                    id="fb-page-market"
                    class="fb-section"
                >

                    <div class="fb-section-title">
                        MARKET MONITOR
                    </div>


                    <div class="fb-card">


                        <div class="fb-muted">
                            CURRENT LOWEST BIN
                        </div>


                        <div class="fb-large-price">

                            <span
                                id="fb-market-price"
                            >
                                ---
                            </span>

                            <small>
                                coins
                            </small>

                        </div>


                        <div class="fb-market-state">

                            <div class="fb-loading-dot"></div>

                            <div>

                                <strong>
                                    Auto Price Check
                                </strong>

                                <span>
                                    FutBlack checks the
                                    current market automatically.
                                </span>

                            </div>

                        </div>


                    </div>

                </section>


                <!-- ========================================= -->
                <!-- SETTINGS                                  -->
                <!-- ========================================= -->

                <section
                    id="fb-page-settings"
                    class="fb-section"
                >

                    <div class="fb-section-title">
                        TRADING SETTINGS
                    </div>


                    <div class="fb-card">


                        <label class="fb-label">
                            Minimum Profit
                        </label>


                        <div class="fb-input-container">

                            <input
                                id="fb-min-profit"
                                type="number"
                                min="0"
                                step="50"
                                value="500"
                            >

                            <span>
                                coins
                            </span>

                        </div>


                        <label class="fb-label">
                            Search Interval
                        </label>


                        <div class="fb-input-container">

                            <input
                                id="fb-search-speed"
                                type="number"
                                min="0.5"
                                step="0.1"
                                value="2.0"
                            >

                            <span>
                                seconds
                            </span>

                        </div>


                        <div class="fb-setting-divider"></div>


                        <div class="fb-toggle-row">


                            <div>

                                <strong>
                                    Use pauses
                                </strong>

                                <small>
                                    Pause searches periodically
                                </small>

                            </div>


                            <label class="fb-switch">

                                <input
                                    id="fb-use-pauses"
                                    type="checkbox"
                                    checked
                                >

                                <span></span>

                            </label>


                        </div>


                        <div id="fb-pause-settings">


                            <label class="fb-label">
                                Pause every
                            </label>


                            <div class="fb-input-container">

                                <input
                                    id="fb-pause-every"
                                    type="number"
                                    min="1"
                                    value="20"
                                >

                                <span>
                                    searches
                                </span>

                            </div>


                            <label class="fb-label">
                                Pause duration
                            </label>


                            <div class="fb-input-container">

                                <input
                                    id="fb-pause-duration"
                                    type="number"
                                    min="1"
                                    value="30"
                                >

                                <span>
                                    seconds
                                </span>

                            </div>


                        </div>


                    </div>

                </section>


            </main>
        `;


        document.body.appendChild(page);


        FutBlack.page = page;


        setupPageEvents();


        return page;
    }


    // ============================================================
    // PAGE EVENTS
    // ============================================================

    function setupPageEvents() {

        const tabs =
            document.querySelectorAll(
                ".fb-tab"
            );


        tabs.forEach(tab => {

            tab.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    const target =
                        tab.dataset.fbTab;

                    switchTab(target);

                }
            );

        });


        // Minimum profit
        document
            .getElementById(
                "fb-min-profit"
            )
            .addEventListener(
                "input",
                event => {

                    FutBlack.settings.minimumProfit =
                        Number(
                            event.target.value
                        ) || 0;

                }
            );


        // Search speed
        document
            .getElementById(
                "fb-search-speed"
            )
            .addEventListener(
                "input",
                event => {

                    const value =
                        Number(
                            event.target.value
                        ) || 2;


                    FutBlack.settings.searchInterval =
                        value;


                    document.getElementById(
                        "fb-live-speed"
                    ).textContent =
                        `${value.toFixed(1)}s`;

                }
            );


        // Pauses ON/OFF
        document
            .getElementById(
                "fb-use-pauses"
            )
            .addEventListener(
                "change",
                event => {

                    const enabled =
                        event.target.checked;


                    FutBlack.settings.pausesEnabled =
                        enabled;


                    document.getElementById(
                        "fb-pause-settings"
                    ).style.display =
                        enabled
                            ? "block"
                            : "none";


                    document.getElementById(
                        "fb-live-pauses"
                    ).textContent =
                        enabled
                            ? "ON"
                            : "OFF";

                }
            );


        // Pause every
        document
            .getElementById(
                "fb-pause-every"
            )
            .addEventListener(
                "input",
                event => {

                    FutBlack.settings.pauseEvery =
                        Number(
                            event.target.value
                        ) || 20;

                }
            );


        // Pause duration
        document
            .getElementById(
                "fb-pause-duration"
            )
            .addEventListener(
                "input",
                event => {

                    FutBlack.settings.pauseDuration =
                        Number(
                            event.target.value
                        ) || 30;

                }
            );
    }


    // ============================================================
    // TAB SWITCHING
    // ============================================================

    function switchTab(name) {

        document
            .querySelectorAll(".fb-tab")
            .forEach(tab => {

                tab.classList.toggle(
                    "active",
                    tab.dataset.fbTab === name
                );

            });


        document
            .querySelectorAll(".fb-section")
            .forEach(section => {

                section.classList.remove(
                    "active"
                );

            });


        const target =
            document.getElementById(
                `fb-page-${name}`
            );


        if (target) {
            target.classList.add(
                "active"
            );
        }
    }


    // ============================================================
    // OPEN FUTBLACK
    // ============================================================

    function openFutBlack() {

        createPage();


        FutBlack.active = true;


        FutBlack.page.classList.add(
            "active"
        );


        if (FutBlack.navButton) {
            FutBlack.navButton.classList.add(
                "fb-selected"
            );
        }
    }


    // ============================================================
    // CLOSE FUTBLACK
    // ============================================================

    function closeFutBlack() {

        if (!FutBlack.active) {
            return;
        }


        FutBlack.active = false;


        if (FutBlack.page) {
            FutBlack.page.classList.remove(
                "active"
            );
        }


        if (FutBlack.navButton) {
            FutBlack.navButton.classList.remove(
                "fb-selected"
            );
        }
    }


    // ============================================================
    // WATCH EA NAVIGATION
    // ============================================================

    function watchEANavigation(nav) {

        nav.addEventListener(
            "click",
            event => {

                const futBlackButton =
                    event.target.closest(
                        "#futblack-nav-button"
                    );


                if (futBlackButton) {
                    return;
                }


                closeFutBlack();

            },
            false
        );
    }


    // ============================================================
    // FUTURE MARKET DATA API
    // ============================================================

    function updateMarketData(data) {

        if (!data) {
            return;
        }


        if (
            typeof data.lowestBin ===
            "number"
        ) {
            FutBlack.market.lowestBin =
                data.lowestBin;
        }


        if (
            typeof data.maxBuy ===
            "number"
        ) {
            FutBlack.market.maxBuy =
                data.maxBuy;
        }


        if (
            typeof data.sellPrice ===
            "number"
        ) {
            FutBlack.market.sellPrice =
                data.sellPrice;
        }


        if (
            typeof data.profit ===
            "number"
        ) {
            FutBlack.market.profit =
                data.profit;
        }


        const lowest =
            document.getElementById(
                "fb-lowest-bin"
            );

        const marketLowest =
            document.getElementById(
                "fb-market-price"
            );

        const maxBuy =
            document.getElementById(
                "fb-max-buy"
            );

        const sell =
            document.getElementById(
                "fb-sell-price"
            );

        const profit =
            document.getElementById(
                "fb-profit"
            );


        if (lowest) {
            lowest.textContent =
                formatCoins(
                    FutBlack.market.lowestBin
                );
        }


        if (marketLowest) {
            marketLowest.textContent =
                formatCoins(
                    FutBlack.market.lowestBin
                );
        }


        if (maxBuy) {
            maxBuy.textContent =
                formatCoins(
                    FutBlack.market.maxBuy
                );
        }


        if (sell) {
            sell.textContent =
                formatCoins(
                    FutBlack.market.sellPrice
                );
        }


        if (profit) {
            profit.textContent =
                formatCoins(
                    FutBlack.market.profit
                );
        }


        setStatus(
            "Market updated automatically."
        );
    }


    // Make future market reader able to
    // send data to FutBlack.
    window.FutBlack = {
        state: FutBlack,
        updateMarketData
    };


    // ============================================================
    // INITIALISE
    // ============================================================

    function initialise() {

        const nav =
            findBottomNavigation();


        if (!nav) {
            return false;
        }


        createNavigationButton(nav);


        console.log(
            "[FutBlack] Loaded successfully."
        );


        return true;
    }


    // EA Web App is a dynamic application.
    // Wait until its navigation exists.

    let attempts = 0;


    const startup =
        setInterval(() => {

            attempts++;


            if (initialise()) {

                clearInterval(startup);

                return;

            }


            if (attempts >= 120) {

                clearInterval(startup);

                console.warn(
                    "[FutBlack] Bottom navigation not found."
                );

            }

        }, 500);

})();
