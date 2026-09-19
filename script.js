const state={config:null},$=s=>document.querySelector(s),root=document.documentElement,page=document.body,STORAGE_KEY="oshi-settings";
const defaults={theme:"light",accent:"#ca1265",animations:true,parallax:true};
let characterScale=1,currentX=0,currentY=0,targetX=0,targetY=0;

function normalizeColor(v,f){if(typeof v!=="string")return f;v=v.trim();return/^#[0-9a-fA-F]{6}$/.test(v)?v:f}
function normalizeCharacterSize(v){v=Number(v);return Number.isFinite(v)?Math.min(Math.max(v,70),130):100}
function setText(s,v){const e=$(s);if(e&&v!=null)e.textContent=v}
function getSavedSettings(){try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY));return s&&typeof s==="object"?s:null}catch{return null}}

function applyTheme(v){v=v==="dark"?"dark":"light";page.classList.toggle("dark",v==="dark");const e=$("#themeSelect");if(e)e.value=v}
function applyAccent(v){v=normalizeColor(v,defaults.accent);root.style.setProperty("--accent",v);const e=$("#accentInput");if(e)e.value=v;const m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",v)}
function applyAnimations(v){v=v!==false;page.classList.toggle("no-motion",!v);const e=$("#motionToggle");if(e)e.checked=v}
function applyParallax(v){v=v!==false;const e=$("#parallaxToggle");if(e)e.checked=v;if(!v)targetX=targetY=0}
function applyCharacterSize(v){characterScale=normalizeCharacterSize(v)/100;root.style.setProperty("--character-scale",characterScale.toFixed(2))}

function applySavedSettings(s){
  applyTheme(s.theme??defaults.theme);
  applyAccent(s.accent??defaults.accent);
  applyAnimations(s.animations??defaults.animations);
  applyParallax(s.parallax??defaults.parallax);
}

function getCurrentSettings(){return{
  theme:$("#themeSelect")?.value??defaults.theme,
  accent:$("#accentInput")?.value??defaults.accent,
  animations:$("#motionToggle")?.checked??defaults.animations,
  parallax:$("#parallaxToggle")?.checked??defaults.parallax
}}

function saveSettings(){
  const s=getCurrentSettings();
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(s))}catch{}
  applySavedSettings(s);
}

function applyConfig(c){
  const{site={},theme={},character={},about={},behavior={}}=c;
  document.title=site.title||document.title;
  const m=document.querySelector('meta[name="description"]');
  if(m&&site.description)m.setAttribute("content",site.description);
  if(site.language)document.documentElement.lang=site.language;

  setText("#name",character.name||"Ruby Hoshino");
  setText("#metaName",character.name||"Ruby Hoshino");
  setText("#animeName",site.title||"Oshi no Ko");
  setText("#role",character.role||"Idol / Main Character");
  setText("#group",character.group||"B-Komachi");
  setText("#description",about.description||"");
  setText("#secondaryText",about.secondary||"");
  setText("#aboutEyebrow",about.label||"ABOUT");

  if(character.image){const e=$("#rubyImage");if(e)e.src=character.image}

  root.style.setProperty("--accent",normalizeColor(theme.accent,defaults.accent));
  root.style.setProperty("--accent-2",normalizeColor(theme.accentSecondary,"#ff4d9d"));
  root.style.setProperty("--pink",normalizeColor(theme.pinkBackground,"#c80e61"));
  applyCharacterSize(character.size);

  const s=getSavedSettings();
  if(s)applySavedSettings(s);
  else{
    applyTheme(theme.default||defaults.theme);
    applyAccent(theme.accent||defaults.accent);
    applyAnimations(behavior.animations!==false);
    applyParallax(behavior.parallax!==false);
  }
}

async function loadConfig(){
  try{
    const r=await fetch("settings.yml",{cache:"no-store"});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const t=await r.text();
    if(!window.jsyaml||typeof window.jsyaml.load!=="function")throw new Error("js-yaml unavailable");
    state.config=window.jsyaml.load(t)||{};
    applyConfig(state.config);
  }catch(e){
    console.warn("settings.yml could not be loaded:",e);
    applyTheme(defaults.theme);
    applyAccent(defaults.accent);
    applyAnimations(defaults.animations);
    applyParallax(defaults.parallax);
    applyCharacterSize(100);
  }
}

function resetSettings(){
  try{localStorage.removeItem(STORAGE_KEY)}catch{}
  if(state.config)applyConfig(state.config);
  else{
    applyTheme(defaults.theme);
    applyAccent(defaults.accent);
    applyAnimations(defaults.animations);
    applyParallax(defaults.parallax);
    applyCharacterSize(100);
  }
}

function openSettings(v=true){
  const p=$("#settingsPanel"),b=$("#settingsBackdrop"),x=$("#settingsBtn");
  if(!p||!b||!x)return;
  p.classList.toggle("open",v);
  b.classList.toggle("open",v);
  p.setAttribute("aria-hidden",String(!v));
  x.setAttribute("aria-expanded",String(v));
}

$("#settingsBtn")?.addEventListener("click",()=>openSettings());
$("#closeSettings")?.addEventListener("click",()=>openSettings(false));
$("#settingsBackdrop")?.addEventListener("click",()=>openSettings(false));
$("#resetSettings")?.addEventListener("click",resetSettings);
$("#themeSelect")?.addEventListener("change",saveSettings);
$("#accentInput")?.addEventListener("input",saveSettings);
$("#accentInput")?.addEventListener("change",saveSettings);
$("#motionToggle")?.addEventListener("change",saveSettings);
$("#parallaxToggle")?.addEventListener("change",saveSettings);

window.addEventListener("mousemove",e=>{
  const t=$("#parallaxToggle");
  if(!t||!t.checked||page.classList.contains("no-motion"))return;
  targetX=(e.clientX/window.innerWidth-.5)*12;
  targetY=(e.clientY/window.innerHeight-.5)*8;
},{passive:true});

function frame(){
  const i=$("#rubyImage"),t=$("#parallaxToggle"),active=i&&t?.checked&&!page.classList.contains("no-motion");
  currentX+=(active?targetX:0-currentX)*.08;
  currentY+=(active?targetY:0-currentY)*.08;
  if(i)i.style.transform=`translate(calc(-50% + ${currentX}px), ${currentY}px) scale(${characterScale})`;
  requestAnimationFrame(frame);
}
frame();

const observer="IntersectionObserver"in window?new IntersectionObserver(es=>{
  es.forEach(e=>{if(e.isIntersecting)e.target.classList.add("show")});
},{threshold:.12}):null;

document.querySelectorAll(".about,.details-inner").forEach(e=>{
  e.classList.add("reveal");
  observer?observer.observe(e):e.classList.add("show");
});

loadConfig();
