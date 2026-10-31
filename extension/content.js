(() => {
    "use strict";

    if (window.__FUTBLACK_V3__) return;
    window.__FUTBLACK_V3__ = true;

    console.log("[FutBlack] Starting V3");

    const state = {
        open: false,
        settings: {
            minProfit: 500,
            searchInterval: 2.0,
            pausesEnabled: true,
            pauseEvery: 20,
            pauseDuration: 30
        }
    };

    // =========================================================
    // CREATE FUTBLACK BUTTON
    // =========================================================

    function createButton() {
        if (document.getElementById("fb-launcher")) {
            return;
        }

        const button = document.createElement("button");

        button.id = "fb-launcher";
        button.type = "button";

        button.innerHTML = `
            <div class="fb-launcher-icon">FB</div>
            <div class="fb-launcher-text">FutBlack</div>
        `;

        /*
         * pointerdown is useful on mobile/touch environments.
         */
        button.addEventListener(
            "pointerdown",
            function (event) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                console.log(
                    "[FutBlack] Pointer received"
                );

                openFutBlack();
            },
            true
        );

        button.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                console.log(
                    "[FutBlack] Click received"
                );

                openFutBlack();
            },
            true
        );

        document.documentElement.appendChild(button);

        console.log(
            "[FutBlack] Launcher created"
        );
    }

    // =========================================================
    // CREATE PAGE
    // =========================================================

    function createPage() {
        if (document.getElementById("fb-page")) {
            return;
        }

        const page = document.createElement("div");

        page.id = "fb-page";

        page.innerHTML = `
            <div class="fb-header">

                <div>
                    <div class="fb-logo">
                        FUTBLACK
                    </div>

                    <div class="fb-subtitle">
                        FC 27 MARKET ASSISTANT
                    </div>
                </div>

                <div class="fb-status">
                    <span></span>
                    READY
                </div>

            </div>


            <div class="fb-tabs">

                <button
                    class="fb-tab active"
                    data-tab="live"
                >
                    LIVE FILTERS
                </button>

                <button
                    class="fb-tab"
                    data-tab="market"
                >
                    MARKET
                </button>

                <button
                    class="fb-tab"
                    data-tab="settings"
                >
                    SETTINGS
                </button>

            </div>


            <div class="fb-body">

                <!-- LIVE FILTERS -->

                <section
                    id="fb-live"
                    class="fb-section active"
                >

                    <div class="fb-section-title">
                        ACTIVE FILTER
                    </div>

                    <div class="fb-card">

                        <div class="fb-filter-header">

                            <div>
                                <span class="fb-small">
                                    CURRENT FILTER
                                </span>

                                <strong>
                                    Searching...
                                </strong>
                            </div>

                            <div class="fb-score">
                                --
                            </div>

                        </div>


                        <div class="fb-grid">

                            <div class="fb-price">
                                <span>
                                    LOWEST BIN
                                </span>

                                <strong
                                    id="fb-lowest-bin"
                                >
                                    ---
                                </strong>
                            </div>


                            <div class="fb-price">
                                <span>
                                    MAX BUY
                                </span>

                                <strong
                                    id="fb-max-buy"
                                >
                                    ---
                                </strong>
                            </div>


                            <div class="fb-price">
                                <span>
                                    SELL
                                </span>

                                <strong
                                    id="fb-sell"
                                >
                                    ---
                                </strong>
                            </div>


                            <div class="fb-price">
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


                        <div class="fb-auto">

                            <div class="fb-pulse"></div>

                            <div>
                                <strong>
                                    Automatic Market Check
                                </strong>

                                <span>
                                    Waiting for market data...
                                </span>
                            </div>

                        </div>

                    </div>


                    <div class="fb-card fb-info-card">

                        <div>
                            <span>Search interval</span>
                            <strong id="fb-info-speed">
                                2.0 s
                            </strong>
                        </div>

                        <div>
                            <span>Pauses</span>
                            <strong id="fb-info-pauses">
                                ON
                            </strong>
                        </div>

                    </div>

                </section>


                <!-- MARKET -->

                <section
                    id="fb-market"
                    class="fb-section"
                >

                    <div class="fb-section-title">
                        MARKET MONITOR
                    </div>

                    <div class="fb-card">

                        <span class="fb-small">
                            CURRENT LOWEST BIN
                        </span>

                        <div class="fb-market-price">
                            <strong>
                                ---
                            </strong>

                            <span>
                                coins
                            </span>
                        </div>


                        <div class="fb-auto">

                            <div class="fb-pulse"></div>

                            <div>
                                <strong>
                                    Auto Price Check
                                </strong>

                                <span>
                                    Market reader will run
                                    automatically.
                                </span>
                            </div>

                        </div>

                    </div>

                </section>


                <!-- SETTINGS -->

                <section
                    id="fb-settings"
                    class="fb-section"
                >

                    <div class="fb-section-title">
                        SETTINGS
                    </div>

                    <div class="fb-card">

                        <label>
                            Minimum profit
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


                        <label>
                            Search interval
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


                        <div class="fb-divider"></div>


                        <div class="fb-toggle-row">

                            <div>
                                <strong>
                                    Use pauses
                                </strong>

                                <small>
                                    Enable or disable
                                    scheduled pauses
                                </small>
                            </div>


                            <label class="fb-switch">

                                <input
                                    id="fb-pauses-enabled"
                                    type="checkbox"
                                    checked
                                >

                                <span></span>

                            </label>

                        </div>


                        <div id="fb-pause-options">

                            <label>
                                Pause every
                            </label>

                            <div class="fb-input-row">

                                <input
                                    id="fb-pause-every"
                                    type="number"
                                    value="20"
                                    min="1"
                                >

                                <span>
                                    searches
                                </span>

                            </div>


                            <label>
                                Pause duration
                            </label>

                            <div class="fb-input-row">

                                <input
                                    id="fb-pause-duration"
                                    type="number"
                                    value="30"
                                    min="1"
                                >

                                <span>
                                    seconds
                                </span>

                            </div>

                        </div>

                    </div>

                </section>

            </div>
        `;

        document.documentElement.appendChild(page);

        setupEvents();

        console.log(
            "[FutBlack] Page created"
        );
    }

    // =========================================================
    // OPEN
    // =========================================================

    function openFutBlack() {
        createPage();

        const page =
            document.getElementById("fb-page");

        const launcher =
            document.getElementById("fb-launcher");

        if (!page) {
            console.error(
                "[FutBlack] Page not found"
            );

            return;
        }

        state.open = true;

        page.classList.add("open");

        if (launcher) {
            launcher.classList.add("selected");
        }

        console.log(
            "[FutBlack] OPEN"
        );
    }

    // =========================================================
    // CLOSE
    // =========================================================

    function closeFutBlack() {
        const page =
            document.getElementById("fb-page");

        const launcher =
            document.getElementById("fb-launcher");

        state.open = false;

        if (page) {
            page.classList.remove("open");
        }

        if (launcher) {
            launcher.classList.remove("selected");
        }

        console.log(
            "[FutBlack] CLOSED"
        );
    }

    // =========================================================
    // EVENTS
    // =========================================================

    function setupEvents() {
        document
            .querySelectorAll(".fb-tab")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function () {

                        const target =
                            button.dataset.tab;

                        switchTab(target);
                    }
                );

            });


        // Search interval

        document
            .getElementById(
                "fb-search-interval"
            )
            .addEventListener(
                "input",
                function (event) {

                    const value =
                        Number(
                            event.target.value
                        );

                    if (!Number.isNaN(value)) {
                        state.settings.searchInterval =
                            value;

                        document.getElementById(
                            "fb-info-speed"
                        ).textContent =
                            `${value.toFixed(1)} s`;
                    }

                }
            );


        // Minimum profit

        document
            .getElementById(
                "fb-min-profit"
            )
            .addEventListener(
                "input",
                function (event) {

                    state.settings.minProfit =
                        Number(
                            event.target.value
                        ) || 0;

                }
            );


        // Pause toggle

        document
            .getElementById(
                "fb-pauses-enabled"
            )
            .addEventListener(
                "change",
                function (event) {

                    const enabled =
                        event.target.checked;

                    state.settings.pausesEnabled =
                        enabled;

                    document.getElementById(
                        "fb-pause-options"
                    ).style.display =
                        enabled
                            ? "block"
                            : "none";

                    document.getElementById(
                        "fb-info-pauses"
                    ).textContent =
                        enabled
                            ? "ON"
                            : "OFF";

                }
            );


        document
            .getElementById(
                "fb-pause-every"
            )
            .addEventListener(
                "input",
                function (event) {

                    state.settings.pauseEvery =
                        Number(
                            event.target.value
                        ) || 20;

                }
            );


        document
            .getElementById(
                "fb-pause-duration"
            )
            .addEventListener(
                "input",
                function (event) {

                    state.settings.pauseDuration =
                        Number(
                            event.target.value
                        ) || 30;

                }
            );
    }

    // =========================================================
    // TABS
    // =========================================================

    function switchTab(target) {
        document
            .querySelectorAll(".fb-tab")
            .forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.tab === target
                );

            });


        document
            .querySelectorAll(".fb-section")
            .forEach(section => {

                section.classList.remove(
                    "active"
                );

            });


        const page =
            document.getElementById(
                `fb-${target}`
            );

        if (page) {
            page.classList.add("active");
        }
    }

    // =========================================================
    // CLOSE WHEN EA NAVIGATION IS USED
    // =========================================================

    document.addEventListener(
        "pointerdown",
        function (event) {

            if (!state.open) return;

            if (
                event.target.closest("#fb-page") ||
                event.target.closest("#fb-launcher")
            ) {
                return;
            }

            /*
             * If the user touches the underlying EA
             * navigation, close FutBlack and allow
             * EA to handle the navigation normally.
             */
            const y = event.clientY;

            if (
                y >
                window.innerHeight - 80
            ) {
                closeFutBlack();
            }

        },
        true
    );

    // =========================================================
    // FUTURE MARKET READER
    // =========================================================

    window.FutBlack = {
        state,

        updateMarket(data) {
            if (!data) return;

            const setValue = (
                id,
                value
            ) => {

                const element =
                    document.getElementById(id);

                if (
                    element &&
                    value !== undefined &&
                    value !== null
                ) {
                    element.textContent =
                        Number(value)
                            .toLocaleString(
                                "en-US"
                            );
                }
            };

            setValue(
                "fb-lowest-bin",
                data.lowestBin
            );

            setValue(
                "fb-max-buy",
                data.maxBuy
            );

            setValue(
                "fb-sell",
                data.sell
            );

            setValue(
                "fb-profit",
                data.profit
            );
        }
    };

    // =========================================================
    // START
    // =========================================================

    createButton();

})();
