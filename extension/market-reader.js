(() => {
    "use strict";

    console.log("[FutBlack] MARKET READER TEST LOADED");

    const old = document.getElementById("fb-reader-test");
    if (old) old.remove();

    const test = document.createElement("div");

    test.id = "fb-reader-test";

    test.textContent = "FUTBLACK READER OK";

    Object.assign(test.style, {
        position: "fixed",
        top: "160px",
        right: "10px",
        zIndex: "2147483647",
        background: "#000000",
        color: "#ffffff",
        border: "2px solid #ffffff",
        borderRadius: "8px",
        padding: "10px",
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        fontWeight: "900",
        pointerEvents: "none"
    });

    document.documentElement.appendChild(test);
})();
