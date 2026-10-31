(() => {
    "use strict";

    if (window.__FUTBLACK_LOADED__) return;
    window.__FUTBLACK_LOADED__ = true;

    const state = {
        lowestBin: null,
        targetProfit: 500,
        searchInterval: 2.0,
        pausesEnabled: true,
        pauseEvery: 20,
        pauseDuration: 30
    };

    function roundDownToValidPrice(price) {
        if (price <= 1000) {
            return Math.floor(price / 50) * 50;
        }

        if (price <= 10000) {
            return Math.floor(price / 100) * 100;
        }

        if (price <= 50000) {
            return Math.floor(price / 250) * 250;
        }

        if (price <= 100000) {
            return Math.floor(price / 500) * 500;
        }

        return Math.floor(price / 1000) * 1000;
    }

    function calculatePrices(lowestBin, targetProfit) {
        const tax = Math.floor(lowestBin * 0.05);
        const netSale = lowestBin - tax;

        const rawMaxBuy = netSale - targetProfit;
        const maxBuy = roundDownToValidPrice(rawMaxBuy);

        const realProfit = netSale - maxBuy;

        return {
            lowestBin,
            tax,
            netSale,
            maxBuy,
            realProfit
        };
    }

    function formatCoins(value) {
        if (value === null || value === undefined) {
            return "---";
        }

        return Math.floor(value).toLocaleString("en-US");
    }

    function createPanel() {
        if (document.getElementById("futblack-panel")) return;

        const panel = document.createElement("div");
        panel.id = "futblack-panel";

        panel.innerHTML = `
            <div class="fb-header">
                <div>
                    <div class="fb-title">FUTBLACK</div>
                    <div class="fb-subtitle">FC Market Assistant</div>
                </div>

                <button id="fb-collapse">−</button>
            </div>

            <div id="fb-content">

                <div class="fb-section-title">
                    PRICE CHECK
                </div>

                <div class="fb-price-box">

                    <div class="fb-row">
                        <span>Lowest BIN</span>
                        <strong id="fb-lowest-bin">---</strong>
                    </div>

                    <div class="fb-row">
                        <span>EA Tax</span>
                        <strong id="fb-tax">---</strong>
                    </div>

                    <div class="fb-row">
                        <span>Net Sale</span>
                        <strong id="fb-net-sale">---</strong>
                    </div>

                    <div class="fb-divider"></div>

                    <div class="fb-row fb-important">
                        <span>MAX BUY</span>
                        <strong id="fb-max-buy">---</strong>
                    </div>

                    <div class="fb-row">
                        <span>Profit</span>
                        <strong id="fb-profit">---</strong>
                    </div>

                </div>

                <label class="fb-label">
                    Minimum Profit
                </label>

                <input
                    id="fb-target-profit"
                    class="fb-input"
                    type="number"
                    min="0"
                    step="50"
                    value="500"
                >

                <button id="fb-check-price" class="fb-main-button">
                    CHECK LOWEST BIN
                </button>

                <div
                    id="fb-status"
                    class="fb-status"
                >
                    Waiting for market...
                </div>

                <div class="fb-section-title">
                    SEARCH SETTINGS
                </div>

                <label class="fb-label">
                    Search interval
                </label>

                <div class="fb-input-unit">
                    <input
                        id="fb-search-interval"
                        class="fb-input"
                        type="number"
                        min="0.5"
                        step="0.1"
                        value="2.0"
                    >
                    <span>sec</span>
                </div>

                <div class="fb-switch-row">
                    <span>Use pauses</span>

                    <label class="fb-switch">
                        <input
                            id="fb-pauses-enabled"
                            type="checkbox"
                            checked
                        >
                        <span class="fb-slider"></span>
                    </label>
                </div>

                <div id="fb-pause-settings">

                    <label class="fb-label">
                        Pause every
                    </label>

                    <div class="fb-input-unit">
                        <input
                            id="fb-pause-every"
                            class="fb-input"
                            type="number"
                            min="1"
                            value="20"
                        >
                        <span>searches</span>
                    </div>

                    <label class="fb-label">
                        Pause duration
                    </label>

                    <div class="fb-input-unit">
                        <input
                            id="fb-pause-duration"
                            class="fb-input"
                            type="number"
                            min="1"
                            value="30"
                        >
                        <span>sec</span>
                    </div>

                </div>

            </div>
        `;

        document.body.appendChild(panel);

        attachEvents();
    }

    function attachEvents() {
        const profitInput =
            document.getElementById("fb-target-profit");

        const pauseToggle =
            document.getElementById("fb-pauses-enabled");

        const pauseSettings =
            document.getElementById("fb-pause-settings");

        const collapse =
            document.getElementById("fb-collapse");

        const content =
            document.getElementById("fb-content");

        profitInput.addEventListener("change", () => {
            state.targetProfit =
                Number(profitInput.value) || 0;

            updateCalculations();
        });

        document
            .getElementById("fb-search-interval")
            .addEventListener("change", event => {
                state.searchInterval =
                    Number(event.target.value) || 2;
            });

        pauseToggle.addEventListener("change", () => {
            state.pausesEnabled =
                pauseToggle.checked;

            pauseSettings.style.display =
                state.pausesEnabled
                    ? "block"
                    : "none";
        });

        document
            .getElementById("fb-pause-every")
            .addEventListener("change", event => {
                state.pauseEvery =
                    Number(event.target.value) || 20;
            });

        document
            .getElementById("fb-pause-duration")
            .addEventListener("change", event => {
                state.pauseDuration =
                    Number(event.target.value) || 30;
            });

        collapse.addEventListener("click", () => {
            const hidden =
                content.style.display === "none";

            content.style.display =
                hidden ? "block" : "none";

            collapse.textContent =
                hidden ? "−" : "+";
        });

        document
            .getElementById("fb-check-price")
            .addEventListener("click", () => {

                /*
                 * Nel prossimo step collegheremo qui
                 * il lettore dei risultati mercato.
                 */

                setStatus(
                    "Price reader not connected yet."
                );
            });
    }

    function updateCalculations() {
        if (!state.lowestBin) return;

        const result = calculatePrices(
            state.lowestBin,
            state.targetProfit
        );

        document.getElementById(
            "fb-lowest-bin"
        ).textContent =
            formatCoins(result.lowestBin);

        document.getElementById(
            "fb-tax"
        ).textContent =
            formatCoins(result.tax);

        document.getElementById(
            "fb-net-sale"
        ).textContent =
            formatCoins(result.netSale);

        document.getElementById(
            "fb-max-buy"
        ).textContent =
            formatCoins(result.maxBuy);

        document.getElementById(
            "fb-profit"
        ).textContent =
            formatCoins(result.realProfit);
    }

    function setStatus(message) {
        const status =
            document.getElementById("fb-status");

        if (status) {
            status.textContent = message;
        }
    }

    /*
     * Questa funzione verrà chiamata dal
     * Market Reader quando avrà trovato
     * il Lowest BIN.
     */
    function setLowestBin(price) {
        if (!price || price <= 0) return;

        state.lowestBin = price;

        updateCalculations();

        setStatus(
            `Lowest BIN found: ${formatCoins(price)}`
        );
    }

    window.FutBlack = {
        state,
        setLowestBin,
        calculatePrices
    };

    createPanel();

})();
