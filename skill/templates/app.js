const galleryAssets = __GALLERY_JSON__;
const audioUrl = __AUDIO_URL__;
const rsvpEnabled = __RSVP_ENABLED__;
const musicEnabled = __MUSIC_ENABLED__;
const guestContributions = __GUEST_CONTRIBUTIONS_JSON__;
const recapMode = __RECAP_MODE__;
const gallery = document.querySelector("#gallery");
const previous = document.querySelector("#previous");
const next = document.querySelector("#next");
const counter = document.querySelector("#counter");
const continueButton = document.querySelector("#continue");
const invitation = document.querySelector("#invitation");
const rsvpForm = document.querySelector("#rsvp-form");
const reduceMotion = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
let current = 0;

function renderGallery(state) {
  if (state === "loading") {
    gallery.innerHTML = '<p class="gallery-loading">照片加载中…</p>';
    previous.disabled = true;
    next.disabled = true;
    counter.textContent = "—";
    return;
  }
  if (!galleryAssets.length) {
    gallery.innerHTML = '<p class="gallery-empty">暂无已确认照片</p>';
    previous.disabled = true;
    next.disabled = true;
    counter.textContent = "—";
    return;
  }
  const item = galleryAssets[current];
  gallery.innerHTML = "";
  const image = document.createElement("img");
  image.src = item.url;
  image.alt = item.title || `相册图片 ${current + 1}`;
  image.loading = current === 0 ? "eager" : "lazy";
  image.addEventListener("error", () => {
    gallery.innerHTML = '<p class="gallery-empty">这张照片暂时无法加载</p>';
  }, { once: true });
  gallery.append(image);
  previous.disabled = galleryAssets.length < 2;
  next.disabled = galleryAssets.length < 2;
  counter.textContent = `${current + 1} / ${galleryAssets.length}`;
}

function move(step) {
  if (!galleryAssets.length) return;
  current = (current + step + galleryAssets.length) % galleryAssets.length;
  renderGallery("ready");
}

renderGallery("loading");
window.requestAnimationFrame(() => renderGallery(galleryAssets.length ? "ready" : "empty"));
previous.addEventListener("click", () => move(-1));
next.addEventListener("click", () => move(1));
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") move(-1);
  if (event.key === "ArrowRight") move(1);
});
if (recapMode) {
  continueButton.addEventListener("click", () => {
    invitation.hidden = false;
    invitation.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    document.querySelector("#invitation-title").focus?.();
  });
}

if (audioUrl && musicEnabled) {
  const audio = document.createElement("audio");
  audio.src = audioUrl;
  audio.loop = true;
  audio.preload = "none";
  audio.setAttribute("aria-label", "背景音乐");
  document.body.append(audio);
  const musicToggle = document.createElement("button");
  musicToggle.type = "button";
  musicToggle.className = "continue";
  musicToggle.textContent = "播放音乐";
  musicToggle.addEventListener("click", async () => {
    if (audio.paused) {
      try { await audio.play(); musicToggle.textContent = "暂停音乐"; }
      catch { musicToggle.textContent = "浏览器阻止播放"; }
    } else { audio.pause(); musicToggle.textContent = "播放音乐"; }
  });
  document.querySelector(".recap").append(musicToggle);
}

if (rsvpEnabled) rsvpForm.hidden = false;

function saveLocal(key, form, status, matchFields = []) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    const records = JSON.parse(localStorage.getItem(key) || "[]");
    const now = new Date().toISOString();
    const existingIndex = matchFields.length ? records.findIndex((record) => matchFields.every((field) => record[field] === values[field])) : -1;
    const previous = existingIndex >= 0 ? records[existingIndex] : null;
    const nextRecord = { ...values, createdAt: previous?.createdAt || now, updatedAt: now };
    if (existingIndex >= 0) records[existingIndex] = nextRecord;
    else records.push(nextRecord);
    localStorage.setItem(key, JSON.stringify(records));
    status.textContent = existingIndex >= 0 ? "已更新本机演示数据。" : "已保存到本机演示数据。";
    form.reset();
  });
}

if (rsvpEnabled) saveLocal("weddingInvitation.rsvp", rsvpForm, document.querySelector("#rsvp-status"), ["guestName", "contactSuffix"]);
for (const contribution of guestContributions) {
  const form = document.querySelector(`[data-contribution-id="${contribution.id}"]`);
  if (form) saveLocal(contribution.storageKey, form, form.querySelector("[data-status]"));
}
