(function () {
  var currentScript = document.currentScript;
  var eventName =
    (currentScript && currentScript.dataset.appClickEvent) || "static_app_click";

  function isOptedOut() {
    try {
      return localStorage.getItem("analytics_optout") === "1";
    } catch (err) {
      return false;
    }
  }

  function ensureGoatCounter() {
    if (isOptedOut()) {
      window.goatcounter = window.goatcounter || {};
      window.goatcounter.no_onload = true;
      return;
    }

    if (document.querySelector("script[data-goatcounter]")) return;

    var script = document.createElement("script");
    script.dataset.goatcounter = "https://bordur.goatcounter.com/count";
    script.async = true;
    script.src = "https://gc.zgo.at/count.js";
    document.head.appendChild(script);
  }

  ensureGoatCounter();

  document.addEventListener("click", function (event) {
    var link = event.target.closest('a[href^="/app/"]');
    if (!link || isOptedOut()) return;

    try {
      if (window.goatcounter && typeof window.goatcounter.count === "function") {
        window.goatcounter.count({ event: true, path: eventName });
      }
    } catch (err) {}
  });
})();
