(function () {
  if (window.__bordurAppClickTrackingInitialized) return;
  window.__bordurAppClickTrackingInitialized = true;

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

  function isTrackedAppHref(href, absoluteHref) {
    if (typeof href === "string") {
      if (
        href === "/app" ||
        href.indexOf("/app/") === 0 ||
        href.indexOf("/app?") === 0 ||
        href.indexOf("/app#") === 0
      ) {
        return true;
      }
    }

    if (!absoluteHref) return false;

    try {
      var parsedUrl = new URL(absoluteHref, window.location.origin);
      var pathname = parsedUrl.pathname;
      return (
        parsedUrl.origin === window.location.origin &&
        (pathname === "/app" || pathname.indexOf("/app/") === 0)
      );
    } catch (err) {
      return false;
    }
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[href]");
    if (!link || isOptedOut()) return;
    if (!isTrackedAppHref(link.getAttribute("href"), link.href)) return;

    // Prevent future double counting if a per-link GoatCounter event is added.
    if (link.hasAttribute("data-goatcounter-click")) return;

    try {
      if (window.goatcounter && typeof window.goatcounter.count === "function") {
        window.goatcounter.count({ event: true, path: eventName });
      }
    } catch (err) {}
  });
})();
