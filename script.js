const state = { config: null };
const $ = (s) => document.querySelector(s);
const root = document.documentElement;
const page = document.body;

async function loadConfig() {
  try {
    const res = await fetch("settings.yml", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    state.config = window.jsyaml.load(text) || {};
    applyConfig(state.config);
  } catch (e) {
    console.warn("settings.yml could not be loaded:", e);
  }
}

function setText(selector, value) {
  const el = $(selector);
  if (el && value != null) el.textContent = value;
}

function setNav(selector, show) {
  const el = $(selector);
  if (el) el.style.display = show ? "inline-block" : "none";
}

function applyConfig(c) {
  const s = c.site || {};
  const t = c.theme || {};
  const ch = c.character || {};
  const about = c.about || {};
  const layout = c.layout || {};
  const behavior = c.behavior || {};
  const navigation = c.navigation || {};

  document.title = s.title || document.title;

  setText("#name", ch.name || "Ruby Hoshino");
  setText("#metaName", ch.name || "Ruby Hoshino");
  setText("#animeName", s.title || "Oshi no Ko");
  setText("#role", ch.role || "Idol / Main Character");
  setText("#group", ch.group || "B-Komachi");
  setText("#description", about.description || "");
  setText("#secondaryText", about.secondary || "");
  setText("#aboutEyebrow", about.label || "ABOUT");

  if (ch.image) $("#rubyImage").src = ch.image;

  root.style.setProperty("--accent", t.accent || "#d10d61");
  root.style.setProperty("--accent-2", t.accentSecondary || "#ff4d9d");
  root.style.setProperty("--pink", t.pinkBackground || "#d10d61");

  if (layout.heroMinHeight) {
    root.style.setProperty("--hero-height", `${layout.heroMinHeight}px`);
  }

  page.classList.toggle("no-motion", behavior.animations === false);

  $("#motionToggle").checked = behavior.animations !== false;
  $("#parallaxToggle").checked = behavior.parallax !== false;
  $("#hintToggle").checked = behavior.scrollHint !== false;

  $("#scrollHint").style.display =
    behavior.scrollHint === false ? "none" : "flex";

  setNav("#characterNav", navigation.showCharacter !== false);
  setNav("#trailerNav", navigation.showTrailer !== false);

  $("#startWatch").style.display =
    navigation.showStartWatch === true ? "inline-flex" : "none";

  const saved = JSON.parse(localStorage.getItem("oshi-settings") || "null");
  if (saved) applySaved(saved);
}

function applySaved(s) {
  if (s.theme === "dark") {
    page.classList.add("dark");
    $("#themeSelect").value = "dark";
  } else {
    page.classList.remove("dark");
    $("#themeSelect").value = "light";
  }

  if (s.accent) {
    root.style.setProperty("--accent", s.accent);
    $("#accentInput").value = s.accent;
  }

  page.classList.toggle("no-motion", s.animations === false);

  $("#motionToggle").checked = s.animations !== false;
  $("#parallaxToggle").checked = s.parallax !== false;
  $("#hintToggle").checked = s.scrollHint !== false;

  $("#scrollHint").style.display =
    s.scrollHint === false ? "none" : "flex";
}

function save() {
  const s = {
    theme: $("#themeSelect").value,
    accent: $("#accentInput").value,
    animations: $("#motionToggle").checked,
    parallax: $("#parallaxToggle").checked,
    scrollHint: $("#hintToggle").checked
  };

  localStorage.setItem("oshi-settings", JSON.stringify(s));
  applySaved(s);
}

function openSettings(open = true) {
  $("#settingsPanel").classList.toggle("open", open);
  $("#settingsBackdrop").classList.toggle("open", open);

  $("#settingsPanel").setAttribute("aria-hidden", String(!open));
  $("#settingsBtn").setAttribute("aria-expanded", String(open));
}

$("#startWatch").addEventListener("click", () => {
  $("#character").scrollIntoView({ behavior: "smooth" });
});

$("#settingsBtn").addEventListener("click", () => openSettings(true));

$("#closeSettings").addEventListener("click", () => openSettings(false));
$("#settingsBackdrop").addEventListener("click", () => openSettings(false));

[
  "themeSelect",
  "accentInput",
  "motionToggle",
  "parallaxToggle",
  "hintToggle"
].forEach((id) => {
  $("#" + id).addEventListener("input", save);
  $("#" + id).addEventListener("change", save);
});

$("#resetSettings").addEventListener("click", () => {
  localStorage.removeItem("oshi-settings");
  location.reload();
});

let currentX = 0;
let currentY = 0;
let targetX = 0;
let targetY = 0;

window.addEventListener(
  "mousemove",
  (e) => {
    if (!$("#parallaxToggle").checked) return;

    targetX = (e.clientX / innerWidth - 0.5) * 12;
    targetY = (e.clientY / innerHeight - 0.5) * 8;
  },
  { passive: true }
);

function frame() {
  const image = $("#rubyImage");

  if (
    image &&
    !page.classList.contains("no-motion") &&
    $("#parallaxToggle")?.checked
  ) {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    image.style.transform =
      `translate(calc(-50% + ${currentX}px), ${currentY}px)`;
  }

  requestAnimationFrame(frame);
}

frame();

const observer = new IntersectionObserver(
  (items) => {
    items.forEach((item) => {
      if (item.isIntersecting) item.target.classList.add("show");
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".about, .details-inner").forEach((el) => {
  el.classList.add("reveal");
  observer.observe(el);
});

loadConfig();
