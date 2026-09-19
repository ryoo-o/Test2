const state = {
  config: null
};

const $ = (selector) => document.querySelector(selector);
const root = document.documentElement;
const page = document.body;
const STORAGE_KEY = "oshi-settings";

const defaults = {
  theme: "light",
  accent: "#ca1265",
  animations: true,
  parallax: true
};

let characterScale = 1;
let currentX = 0;
let currentY = 0;
let targetX = 0;
let targetY = 0;

function normalizeColor(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  const color = value.trim();

  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color;
  }

  return fallback;
}

function normalizeCharacterSize(value) {
  const size = Number(value);

  if (!Number.isFinite(size)) {
    return 100;
  }

  return Math.min(Math.max(size, 70), 130);
}

function setText(selector, value) {
  const element = $(selector);

  if (element && value != null) {
    element.textContent = value;
  }
}

function getSavedSettings() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    );

    if (!saved || typeof saved !== "object") {
      return null;
    }

    return saved;
  } catch {
    return null;
  }
}

function applyTheme(theme) {
  const value = theme === "dark"
    ? "dark"
    : "light";

  page.classList.toggle(
    "dark",
    value === "dark"
  );

  const select = $("#themeSelect");

  if (select) {
    select.value = value;
  }
}

function applyAccent(accent) {
  const value = normalizeColor(
    accent,
    defaults.accent
  );

  root.style.setProperty(
    "--accent",
    value
  );

  const input = $("#accentInput");

  if (input) {
    input.value = value;
  }

  const themeColor =
    document.querySelector(
      'meta[name="theme-color"]'
    );

  if (themeColor) {
    themeColor.setAttribute(
      "content",
      value
    );
  }
}

function applyAnimations(enabled) {
  const value = enabled !== false;

  page.classList.toggle(
    "no-motion",
    !value
  );

  const toggle = $("#motionToggle");

  if (toggle) {
    toggle.checked = value;
  }
}

function applyParallax(enabled) {
  const value = enabled !== false;

  const toggle = $("#parallaxToggle");

  if (toggle) {
    toggle.checked = value;
  }

  if (!value) {
    targetX = 0;
    targetY = 0;
  }
}

function applyCharacterSize(size) {
  const value = normalizeCharacterSize(size);

  characterScale = value / 100;

  root.style.setProperty(
    "--character-scale",
    characterScale.toFixed(2)
  );
}

function applySavedSettings(saved) {
  applyTheme(
    saved.theme ?? defaults.theme
  );

  applyAccent(
    saved.accent ?? defaults.accent
  );

  applyAnimations(
    saved.animations ?? defaults.animations
  );

  applyParallax(
    saved.parallax ?? defaults.parallax
  );
}

function getCurrentSettings() {
  return {
    theme:
      $("#themeSelect")?.value ??
      defaults.theme,

    accent:
      $("#accentInput")?.value ??
      defaults.accent,

    animations:
      $("#motionToggle")?.checked ??
      defaults.animations,

    parallax:
      $("#parallaxToggle")?.checked ??
      defaults.parallax
  };
}

function saveSettings() {
  const settings = getCurrentSettings();

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings)
    );
  } catch {}

  applySavedSettings(settings);
}

function applyConfig(config) {
  const site = config.site || {};
  const theme = config.theme || {};
  const character = config.character || {};
  const about = config.about || {};
  const behavior = config.behavior || {};

  document.title =
    site.title ||
    document.title;

  const descriptionMeta =
    document.querySelector(
      'meta[name="description"]'
    );

  if (
    descriptionMeta &&
    site.description
  ) {
    descriptionMeta.setAttribute(
      "content",
      site.description
    );
  }

  if (site.language) {
    document.documentElement.lang =
      site.language;
  }

  setText(
    "#name",
    character.name ||
      "Ruby Hoshino"
  );

  setText(
    "#metaName",
    character.name ||
      "Ruby Hoshino"
  );

  setText(
    "#animeName",
    site.title ||
      "Oshi no Ko"
  );

  setText(
    "#role",
    character.role ||
      "Idol / Main Character"
  );

  setText(
    "#group",
    character.group ||
      "B-Komachi"
  );

  setText(
    "#description",
    about.description ||
      ""
  );

  setText(
    "#secondaryText",
    about.secondary ||
      ""
  );

  setText(
    "#aboutEyebrow",
    about.label ||
      "ABOUT"
  );

  if (character.image) {
    const image = $("#rubyImage");

    if (image) {
      image.src =
        character.image;
    }
  }

  root.style.setProperty(
    "--accent",
    normalizeColor(
      theme.accent,
      defaults.accent
    )
  );

  root.style.setProperty(
    "--accent-2",
    normalizeColor(
      theme.accentSecondary,
      "#ff4d9d"
    )
  );

  root.style.setProperty(
    "--pink",
    normalizeColor(
      theme.pinkBackground,
      "#c80e61"
    )
  );

  applyCharacterSize(
    character.size
  );

  const saved =
    getSavedSettings();

  if (saved) {
    applySavedSettings(saved);
  } else {
    applyTheme(
      theme.default ||
        defaults.theme
    );

    applyAccent(
      theme.accent ||
        defaults.accent
    );

    applyAnimations(
      behavior.animations !== false
    );

    applyParallax(
      behavior.parallax !== false
    );
  }
}

async function loadConfig() {
  try {
    const response =
      await fetch(
        "settings.yml",
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const text =
      await response.text();

    if (
      !window.jsyaml ||
      typeof window.jsyaml.load !==
        "function"
    ) {
      throw new Error(
        "js-yaml unavailable"
      );
    }

    state.config =
      window.jsyaml.load(text) || {};

    applyConfig(
      state.config
    );
  } catch (error) {
    console.warn(
      "settings.yml could not be loaded:",
      error
    );

    applyTheme(
      defaults.theme
    );

    applyAccent(
      defaults.accent
    );

    applyAnimations(
      defaults.animations
    );

    applyParallax(
      defaults.parallax
    );

    applyCharacterSize(100);
  }
}

function resetSettings() {
  try {
    localStorage.removeItem(
      STORAGE_KEY
    );
  } catch {}

  if (state.config) {
    applyConfig(
      state.config
    );
  } else {
    applyTheme(
      defaults.theme
    );

    applyAccent(
      defaults.accent
    );

    applyAnimations(
      defaults.animations
    );

    applyParallax(
      defaults.parallax
    );

    applyCharacterSize(100);
  }
}

function openSettings(open = true) {
  const panel =
    $("#settingsPanel");

  const backdrop =
    $("#settingsBackdrop");

  const button =
    $("#settingsBtn");

  if (
    !panel ||
    !backdrop ||
    !button
  ) {
    return;
  }

  panel.classList.toggle(
    "open",
    open
  );

  backdrop.classList.toggle(
    "open",
    open
  );

  panel.setAttribute(
    "aria-hidden",
    String(!open)
  );

  button.setAttribute(
    "aria-expanded",
    String(open)
  );
}

$("#settingsBtn")?.addEventListener(
  "click",
  () => openSettings(true)
);

$("#closeSettings")?.addEventListener(
  "click",
  () => openSettings(false)
);

$("#settingsBackdrop")?.addEventListener(
  "click",
  () => openSettings(false)
);

$("#resetSettings")?.addEventListener(
  "click",
  resetSettings
);

$("#themeSelect")?.addEventListener(
  "change",
  saveSettings
);

$("#accentInput")?.addEventListener(
  "input",
  saveSettings
);

$("#accentInput")?.addEventListener(
  "change",
  saveSettings
);

$("#motionToggle")?.addEventListener(
  "change",
  saveSettings
);

$("#parallaxToggle")?.addEventListener(
  "change",
  saveSettings
);

window.addEventListener(
  "mousemove",
  (event) => {
    const toggle =
      $("#parallaxToggle");

    if (
      !toggle ||
      !toggle.checked ||
      page.classList.contains(
        "no-motion"
      )
    ) {
      return;
    }

    targetX =
      (
        event.clientX /
          window.innerWidth -
        0.5
      ) * 12;

    targetY =
      (
        event.clientY /
          window.innerHeight -
        0.5
      ) * 8;
  },
  {
    passive: true
  }
);

function frame() {
  const image =
    $("#rubyImage");

  const toggle =
    $("#parallaxToggle");

  if (
    image &&
    toggle?.checked &&
    !page.classList.contains(
      "no-motion"
    )
  ) {
    currentX +=
      (targetX - currentX) *
      0.08;

    currentY +=
      (targetY - currentY) *
      0.08;
  } else {
    currentX +=
      (0 - currentX) *
      0.08;

    currentY +=
      (0 - currentY) *
      0.08;
  }

  if (image) {
    image.style.transform =
      `translate(calc(-50% + ${currentX}px), ${currentY}px) scale(${characterScale})`;
  }

  requestAnimationFrame(
    frame
  );
}

frame();

const observer =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach(
            (entry) => {
              if (
                entry.isIntersecting
              ) {
                entry.target.classList.add(
                  "show"
                );
              }
            }
          );
        },
        {
          threshold: 0.12
        }
      )
    : null;

document
  .querySelectorAll(
    ".about, .details-inner"
  )
  .forEach((element) => {
    element.classList.add(
      "reveal"
    );

    if (observer) {
      observer.observe(
        element
      );
    } else {
      element.classList.add(
        "show"
      );
    }
  });

loadConfig();
