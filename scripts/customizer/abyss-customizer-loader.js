(function () {
  "use strict";

  const scriptId = "abyss-customizer-script";

  if (document.getElementById(scriptId)) return;

  const script = document.createElement("script");
  script.id = scriptId;
  script.src =
    "https://cdn.jsdelivr.net/gh/agzina0sicim/abyss-jellyfin@main/scripts/customizer/abyss-customizer.js";
  script.async = false;

  document.head.appendChild(script);
})();
