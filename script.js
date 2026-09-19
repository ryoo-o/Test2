const state = {
  config: null
};

const $ = (selector) => document.querySelector(selector);
const root = document.documentElement;
const page = document.body;

const STORAGE_KEY = "oshi-settings";

const DEFAULTS = {
  theme: "light",
  accent: "#d10d61",
  animations: true,
  parallax: true,
  characterSize: 100
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function safeNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

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

function getSavedSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!saved || typeof saved !== "object") {
      return null;
    }

    return saved;
  } catch (error) {
    console.warn("Could not read saved settings:", error);
    return null;
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn("Could not save settings:", error);
  }
}

function setText(selector, value) {
  const element = $(selector);

  if (element && value != null) {
    element.textContent = value;
  }
}

function setCharacterSize(size) {
  const safeSize = clamp(
    safeNumber(size, DEFAULTS.characterSize),
    70,
    130
  );

  const scale = safeSize / 100;

  root.style.setProperty(
    "--character-scale",
    scale.toFixed(2)
  );

  const sizeInput = $("#characterSize");
  const sizeValue = $("#characterSizeValue");

  if (sizeInput) {
    sizeInput.value = String(safeSize);
  }

  if (sizeValue) {
    sizeValue.textContent = `${safeSize}%`;
  }
}

function applyTheme(theme) {
  const normalizedTheme = theme === "dark"
    ? "dark"
    : "light";

  page.classList.toggle(
    "dark",
    normalizedTheme === "dark"
  );

  const themeSelect = $("#themeSelect");

  if (themeSelect) {
    themeSelect.value = normalizedTheme;
  }
}

function applyAccent(accent) {
  const normalizedAccent = normalizeColor(
    accent,
    DEFAULTS.accent
  );

  root.style.setProperty(
    "--accent",
    normalizedAccent
  );

  const accentInput = $("#accentInput");

  if (accentInput) {
    accentInput.value = normalizedAccent;
  }

  const themeColorMeta = document.querySelector(
    'meta[name="theme-color"]'
  );

  if (themeColorMeta) {
    themeColorMeta.setAttribute(
      "content",
      normalizedAccent
    );
  }
}

function applyMotion(enabled) {
  const animationsEnabled = enabled !== false;

  page.classList.toggle(
    "no-motion",
    !animationsEnabled
  );

  const motionToggle = $("#motionToggle");

  if (motionToggle) {
    motionToggle.checked = animationsEnabled;
  }
}

function applyParallax(enabled) {
  const parallaxEnabled = enabled !== false;

  const parallaxToggle = $("#parallaxToggle");

  if (parallaxToggle) {
    parallaxToggle.checked = parallaxEnabled;
  }

  if (!parallaxEnabled) {
    targetX = 0;
    targetY = 0;
  }
}

function applySaved(saved) {
  const settings = {
    ...DEFAULTS,
    ...saved
  };

  applyTheme(settings.theme);
  applyAccent(settings.accent);
  applyMotion(settings.animations);
  applyParallax(settings.parallax);

  setCharacterSize(
    safeNumber(
      settings.characterSize,
      DEFAULTS.characterSize
    )
  );
}

function getCurrentSettings() {
  return {
    theme: $("#themeSelect")?.value || DEFAULTS.theme,
    accent: $("#accentInput")?.value || DEFAULTS.accent,
    animations: $("#motionToggle")?.checked !== false,
    parallax: $("#parallaxToggle")?.checked !== false,
    characterSize: safeNumber(
      $("#characterSize")?.value,
      DEFAULTS.characterSize
    )
  };
}

function saveCurrentSettings() {
  const settings = getCurrentSettings();

  saveSettings(settings);
  applySaved(settings);
}

function applyConfig(config) {
  const site = config.site || {};
  const theme = config.theme || {};
  const character = config.character || {};
  const about = config.about || {};
  const behavior = config.behavior || {};

  if (site.title) {
    document.title = site.title;
  }

  if (site.description) {
    const descriptionMeta = document.querySelector(
      'meta[name="description"]'
    );

    if (descriptionMeta) {
      descriptionMeta.setAttribute(
        "content",
        site.description
      );
    }
  }

  if (site.language) {
    document.documentElement.lang = site.language;
  }

  setText(
    "#name",
    character.name || "Ruby Hoshino"
  );

  setText(
    "#metaName",
    character.name || "Ruby Hoshino"
  );

  setText(
    "#animeName",
    site.title || "Oshi no Ko"
  );

  setText(
    "#role",
    character.role || "Idol / Main Character"
  );

  setText(
    "#group",
    character.group || "B-Komachi"
  );

  setText(
    "#description",
    about.description || ""
  );

  setText(
    "#secondaryText",
    about.secondary || ""
  );

  setText(
    "#aboutEyebrow",
    about.label || "ABOUT"
  );

  if (character.image) {
    const image = $("#rubyImage");

    if (image) {
      image.src = character.image;
    }
  }

  root.style.setProperty(
    "--accent",
    normalizeColor(
      theme.accent,
      DEFAULTS.accent
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
      DEFAULTS.accent
    )
  );

  const configuredTheme =
    theme.default === "dark"
      ? "dark"
      : "light";

  const configuredCharacterSize =
    safeNumber(
      character.size,
      DEFAULTS.characterSize
    );

  const savedSettings = getSavedSettings();

  if (savedSettings) {
    applySaved(savedSettings);
  } else {
    applyTheme(configuredTheme);

    applyAccent(
      theme.accent || DEFAULTS.accent
    );

    applyMotion(
      behavior.animations !== false
    );

    applyParallax(
      behavior.parallax !== false
    );

    setCharacterSize(
      configuredCharacterSize
    );
  }
}

async function loadConfig() {
  try {
    const response = await fetch(
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

    const text = await response.text();

    if (
      !window.jsyaml ||
      typeof window.jsyaml.load !== "function"
    ) {
      throw new Error(
        "js-yaml is not available."
      );
    }

    state.config =
      window.jsyaml.load(text) || {};

    applyConfig(state.config);
  } catch (error) {
    console.warn(
      "settings.yml could not be loaded:",
      error
    );

    applyTheme(DEFAULTS.theme);
    applyAccent(DEFAULTS.accent);
    applyMotion(DEFAULTS.animations);
    applyParallax(DEFAULTS.parallax);
    setCharacterSize(DEFAULTS.characterSize);
  }
}

function openSettings(open = true) {
  const panel = $("#settingsPanel");
  const backdrop = $("#settingsBackdrop");
  const button = $("#settingsBtn");

  if (!panel || !backdrop || !button) {
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

$("#themeSelect")?.addEventListener(
  "change",
  saveCurrentSettings
);

$("#accentInput")?.addEventListener(
  "input",
  saveCurrentSettings
);

$("#accentInput")?.addEventListener(
  "change",
  saveCurrentSettings
);

$("#motionToggle")?.addEventListener(
  "change",
  saveCurrentSettings
);

$("#parallaxToggle")?.addEventListener(
  "change",
  saveCurrentSettings
);

$("#characterSize")?.addEventListener(
  "input",
  () => {
    const value = safeNumber(
      $("#characterSize").value,
      DEFAULTS.characterSize
    );

    setCharacterSize(value);

    saveCurrentSettings();
  }
);

$("#resetSettings")?.addEventListener(
  "click",
  () => {
    try {
      localStorage.removeItem(
        STORAGE_KEY
      );
    } catch (error) {
      console.warn(
        "Could not reset saved settings:",
        error
      );
    }

    if (state.config) {
      applyConfig(state.config);
    } else {
      applyTheme(DEFAULTS.theme);
      applyAccent(DEFAULTS.accent);
      applyMotion(DEFAULTS.animations);
      applyParallax(DEFAULTS.parallax);
      setCharacterSize(
        DEFAULTS.characterSize
      );
    }
  }
);

let currentX = 0;
let currentY = 0;
let targetX = 0;
let targetY = 0;

window.addEventListener(
  "mousemove",
  (event) => {
    const parallaxToggle =
      $("#parallaxToggle");

    if (
      !parallaxToggle ||
      !parallaxToggle.checked
    ) {
      return;
    }

    targetX =
      (event.clientX / window.innerWidth - 0.5) * 12;

    targetY =
      (event.clientY / window.innerHeight - 0.5) * 8;
  },
  {
    passive: true
  }
);

function frame() {
  const image = $("#rubyImage");
  const parallaxToggle =
    $("#parallaxToggle");

  if (
    image &&
    !page.classList.contains("no-motion") &&
    parallaxToggle?.checked
  ) {
    currentX +=
      (targetX - currentX) * 0.08;

    currentY +=
      (targetY - currentY) * 0.08;
  } else {
    currentX +=
      (0 - currentX) * 0.08;

    currentY +=
      (0 - currentY) * 0.08;
  }

  if (image) {
    const scale =
      getComputedStyle(root)
        .getPropertyValue(
          "--character-scale"
        )
        .trim() || "1";

    image.style.transform =
      `translate(calc(-50% + ${currentX}px), ${currentY}px) scale(${scale})`;
  }

  requestAnimationFrame(frame);
}

frame();

const observer =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (items) => {
          items.forEach((item) => {
            if (item.isIntersecting) {
              item.target.classList.add(
                "show"
              );
            }
          });
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
    element.classList.add("reveal");

    if (observer) {
      observer.observe(element);
    } else {
      element.classList.add("show");
    }
  });

loadConfig();
