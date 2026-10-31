(() => {
    "use strict";

    if (window.__FUTBLACK_MARKET_READER__) {
        return;
    }

    window.__FUTBLACK_MARKET_READER__ = true;

    console.log("[FutBlack Market] Reader started");

    const MarketReader = {
        auctions: [],
        lowestBin: null,
        lastScan: null
    };


    // =========================================================
    // NUMBER PARSER
    // =========================================================

    function parseCoins(text) {

        if (!text) {
            return null;
        }

        /*
         * Examples:
         *
         * 10,000
         * 1.300
         * 950
         * 10 000
         */

        const cleaned = String(text)
            .replace(/[^\d.,\s]/g, "")
            .replace(/[\s.,]/g, "");

        if (!cleaned) {
            return null;
        }

        const value = Number(cleaned);

        if (!Number.isFinite(value)) {
            return null;
        }

        return value;
    }


    // =========================================================
    // NORMALIZE TEXT
    // =========================================================

    function normalizeText(text) {

        return String(text || "")
            .replace(/\u00a0/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }


    // =========================================================
    // CHECK IF WE ARE ON SEARCH RESULTS
    // =========================================================

    function isSearchResultsPage() {

        const bodyText =
            normalizeText(
                document.body?.innerText
            ).toLowerCase();

        return (
            bodyText.includes("search results") &&
            bodyText.includes("buy now")
        );
    }


    // =========================================================
    // FIND TEXT ELEMENTS
    // =========================================================

    function findBuyNowLabels() {

        const all =
            document.querySelectorAll(
                "body *"
            );

        const matches = [];

        for (const element of all) {

            /*
             * Ignore FutBlack's own UI.
             */

            if (
                element.closest("#fb-page") ||
                element.closest("#fb-launcher")
            ) {
                continue;
            }


            /*
             * We only want leaf-ish elements.
             *
             * This avoids selecting huge containers
             * containing the entire results page.
             */

            if (
                element.children.length > 3
            ) {
                continue;
            }


            const text =
                normalizeText(
                    element.innerText
                );


            if (!text) {
                continue;
            }


            const lower =
                text.toLowerCase();


            if (
                lower === "buy now:" ||
                lower === "buy now"
            ) {

                matches.push(element);

            }

        }

        return matches;
    }


    // =========================================================
    // FIND AUCTION CONTAINER
    // =========================================================

    function findAuctionContainer(label) {

        let current =
            label.parentElement;


        for (
            let depth = 0;
            depth < 8 && current;
            depth++
        ) {

            const text =
                normalizeText(
                    current.innerText
                );


            const lower =
                text.toLowerCase();


            const hasStart =
                lower.includes(
                    "start price"
                );


            const hasBuyNow =
                lower.includes(
                    "buy now"
                );


            const hasTime =
                lower.includes(
                    "time"
                );


            /*
             * Result rows in the screenshot contain:
             *
             * Start Price
             * Buy Now
             * Time
             */

            if (
                hasStart &&
                hasBuyNow &&
                hasTime &&
                text.length < 500
            ) {

                return current;

            }


            current =
                current.parentElement;
        }


        return null;
    }


    // =========================================================
    // EXTRACT BUY NOW FROM CONTAINER
    // =========================================================

    function extractBuyNow(container) {

        if (!container) {
            return null;
        }


        const text =
            normalizeText(
                container.innerText
            );


        /*
         * Try direct textual extraction first.
         *
         * Example:
         *
         * Buy Now:
         * 10,000
         */

        const match =
            text.match(
                /buy\s*now\s*:?\s*([\d][\d.,\s]*)/i
            );


        if (match) {

            const value =
                parseCoins(
                    match[1]
                );


            if (
                value !== null &&
                value > 0
            ) {

                return value;

            }

        }


        /*
         * Fallback:
         * inspect descendants after the Buy Now label.
         */

        const descendants =
            [
                ...container.querySelectorAll("*")
            ];


        for (
            let i = 0;
            i < descendants.length;
            i++
        ) {

            const element =
                descendants[i];


            const elementText =
                normalizeText(
                    element.innerText
                );


            if (
                elementText.toLowerCase() ===
                    "buy now:" ||
                elementText.toLowerCase() ===
                    "buy now"
            ) {

                for (
                    let x = i + 1;
                    x <
                    Math.min(
                        i + 8,
                        descendants.length
                    );
                    x++
                ) {

                    const candidateText =
                        normalizeText(
                            descendants[x]
                                .innerText
                        );


                    if (
                        /^[\d.,\s]+$/.test(
                            candidateText
                        )
                    ) {

                        const value =
                            parseCoins(
                                candidateText
                            );


                        if (
                            value !== null &&
                            value > 0
                        ) {

                            return value;

                        }

                    }

                }

            }

        }


        return null;
    }


    // =========================================================
    // TRY TO FIND PLAYER NAME
    // =========================================================

    function extractPlayerName(container) {

        if (!container) {
            return "Unknown";
        }


        const text =
            normalizeText(
                container.innerText
            );


        /*
         * Usually the player's name appears before
         * "Start Price".
         */

        const split =
            text.split(
                /start\s*price/i
            );


        if (!split.length) {
            return "Unknown";
        }


        let possibleName =
            normalizeText(
                split[0]
            );


        /*
         * Avoid extremely long garbage.
         */

        if (
            !possibleName ||
            possibleName.length > 80
        ) {
            return "Unknown";
        }


        return possibleName;
    }


    // =========================================================
    // SCAN MARKET
    // =========================================================

    function scanMarket() {

        if (!isSearchResultsPage()) {
            return;
        }


        const labels =
            findBuyNowLabels();


        if (!labels.length) {

            console.log(
                "[FutBlack Market] Search Results detected, but no Buy Now labels found."
            );

            return;

        }


        const auctions = [];

        const usedContainers =
            new Set();


        for (const label of labels) {

            const container =
                findAuctionContainer(
                    label
                );


            if (!container) {
                continue;
            }


            /*
             * Avoid reading same auction twice.
             */

            if (
                usedContainers.has(
                    container
                )
            ) {
                continue;
            }


            usedContainers.add(
                container
            );


            const buyNow =
                extractBuyNow(
                    container
                );


            if (
                buyNow === null ||
                buyNow <= 0
            ) {
                continue;
            }


            const player =
                extractPlayerName(
                    container
                );


            auctions.push({
                player,
                buyNow,
                element: container
            });

        }


        if (!auctions.length) {

            console.log(
                "[FutBlack Market] No valid auctions extracted."
            );

            return;

        }


        auctions.sort(
            (a, b) =>
                a.buyNow -
                b.buyNow
        );


        const lowest =
            auctions[0];


        MarketReader.auctions =
            auctions;

        MarketReader.lowestBin =
            lowest.buyNow;

        MarketReader.lastScan =
            Date.now();


        // ================================================
        // DEBUG OUTPUT
        // ================================================

        console.group(
            "[FutBlack Market] MARKET SCAN"
        );


        console.log(
            "Auctions found:",
            auctions.length
        );


        console.table(
            auctions.map(
                auction => ({
                    Player:
                        auction.player,

                    "Buy Now":
                        auction.buyNow
                })
            )
        );


        console.log(
            "LOWEST BIN:",
            lowest.buyNow
        );


        console.log(
            "Lowest player:",
            lowest.player
        );


        console.groupEnd();


        // ================================================
        // SEND DATA TO FUTBLACK
        // ================================================

        if (
            window.FutBlack &&
            typeof window.FutBlack.updateMarket
                === "function"
        ) {

            window.FutBlack.updateMarket({
                lowestBin:
                    lowest.buyNow
            });

        }


        // ================================================
        // VISUAL DEBUG BADGE
        // ================================================

        showDebugBadge(
            auctions.length,
            lowest.buyNow
        );
    }


    // =========================================================
    // DEBUG BADGE
    // =========================================================

    function showDebugBadge(
        count,
        lowest
    ) {

        let badge =
            document.getElementById(
                "fb-market-debug"
            );


        if (!badge) {

            badge =
                document.createElement(
                    "div"
                );


            badge.id =
                "fb-market-debug";


            badge.style.position =
                "fixed";

            badge.style.top =
                "150px";

            badge.style.right =
                "8px";

            badge.style.zIndex =
                "2147483647";

            badge.style.background =
                "#000";

            badge.style.color =
                "#fff";

            badge.style.border =
                "1px solid #fff";

            badge.style.borderRadius =
                "7px";

            badge.style.padding =
                "8px 10px";

            badge.style.fontFamily =
                "Arial, sans-serif";

            badge.style.fontSize =
                "10px";

            badge.style.fontWeight =
                "700";

            badge.style.pointerEvents =
                "none";


            document.documentElement
                .appendChild(
                    badge
                );
        }


        badge.innerHTML = `
            FUTBLACK MARKET<br>
            Results: ${count}<br>
            Lowest: ${Number(lowest)
                .toLocaleString("en-US")}
        `;
    }


    // =========================================================
    // REMOVE DEBUG BADGE WHEN LEAVING RESULTS
    // =========================================================

    function cleanupBadge() {

        if (isSearchResultsPage()) {
            return;
        }


        const badge =
            document.getElementById(
                "fb-market-debug"
            );


        if (badge) {
            badge.remove();
        }
    }


    // =========================================================
    // MUTATION OBSERVER
    // =========================================================

    let scanTimer = null;


    const observer =
        new MutationObserver(() => {

            clearTimeout(
                scanTimer
            );


            scanTimer =
                setTimeout(
                    () => {

                        if (
                            isSearchResultsPage()
                        ) {

                            scanMarket();

                        } else {

                            cleanupBadge();

                        }

                    },
                    350
                );

        });


    observer.observe(
        document.documentElement,
        {
            childList: true,
            subtree: true,
            characterData: true
        }
    );


    // =========================================================
    // FALLBACK SCAN
    // =========================================================

    setInterval(
        () => {

            if (
                isSearchResultsPage()
            ) {
                scanMarket();
            } else {
                cleanupBadge();
            }

        },
        3000
    );


    // =========================================================
    // PUBLIC DEBUG API
    // =========================================================

    window.FutBlackMarket = {

        state:
            MarketReader,

        scan:
            scanMarket

    };


    console.log(
        "[FutBlack Market] Ready"
    );

})();
