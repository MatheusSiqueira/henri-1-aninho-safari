const targetDate = new Date("2026-11-10T00:00:00-04:00");

const els = {
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds"),
  message: document.querySelector("#countdown-message"),
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function updateCountdown() {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    els.days.textContent = "00";
    els.hours.textContent = "00";
    els.minutes.textContent = "00";
    els.seconds.textContent = "00";
    els.message.textContent = "A aventura começou! 🦁";
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  els.days.textContent = pad(days);
  els.hours.textContent = pad(hours);
  els.minutes.textContent = pad(minutes);
  els.seconds.textContent = pad(seconds);
}

updateCountdown();
setInterval(updateCountdown, 1000);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

const safariTrigger = document.querySelector("#safari-trigger");
const hero = document.querySelector(".hero");
let safariTimer;

function playSafariAnimation() {
  if (!hero) return;

  clearTimeout(safariTimer);
  hero.classList.remove("is-safari-playing");
  void hero.offsetWidth;
  hero.classList.add("is-safari-playing");

  safariTimer = setTimeout(() => {
    hero.classList.remove("is-safari-playing");
  }, 1250);
}

safariTrigger?.addEventListener("click", playSafariAnimation);
safariTrigger?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    playSafariAnimation();
  }
});

document.querySelector("#download-ics")?.addEventListener("click", () => {
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Henri 1 aninho//Convite//PT-BR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    "UID:henri-1-aninho-20261110@convite",
    "DTSTAMP:20261012T180000Z",
    "DTSTART;VALUE=DATE:20261110",
    "DTEND;VALUE=DATE:20261111",
    "SUMMARY:1 aninho do Henri",
    "DESCRIPTION:Uma aventura muito especial: o primeiro aninho do Henri!",
    "LOCATION:Zitão Park, Av. Monte Castelo, 36 - Monte Castelo, Campo Grande - MS, 79010-400",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "henri-1-aninho.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});
