import { eventConfig } from './event-config.js?v=20261019-5';
import { validDate, safeMapUrl, calendarFile, remainingTime, whatsappUrl } from './event-utils.js?v=20261019-5';

const $ = selector => document.querySelector(selector);
const photos = [
  { src: 'assets/henri-explorador-960.webp', alt: 'Henri sorrindo ao ar livre com seu chapéu azul de ursinho', caption: 'Pequeno fazendeiro' },
  { src: 'assets/henri-sorriso-960.webp', alt: 'Henri sorrindo com uma peruca verde e amarela e um casaquinho claro', caption: 'Um sorriso que é festa' },
];
const photoDialog = $('#photo-dialog');
const rsvpDialog = $('#rsvp-dialog');
let currentPhoto = 0;
let previousFocus = null;

function openDialog(dialog) {
  previousFocus = document.activeElement;
  dialog.showModal();
  document.body.classList.add('dialog-open');
}

function displayPhoto(index) {
  currentPhoto = (index + photos.length) % photos.length;
  const photo = photos[currentPhoto];
  $('#dialog-photo').src = photo.src;
  $('#dialog-photo').alt = photo.alt;
  $('#photo-caption').textContent = `${photo.caption} · ${currentPhoto + 1} de ${photos.length}`;
}

document.querySelectorAll('.photo-open').forEach(button => {
  button.addEventListener('click', () => { displayPhoto(Number(button.dataset.photo)); openDialog(photoDialog); });
});
$('#photo-prev').addEventListener('click', () => displayPhoto(currentPhoto - 1));
$('#photo-next').addEventListener('click', () => displayPhoto(currentPhoto + 1));
photoDialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    displayPhoto(currentPhoto + (event.key === 'ArrowRight' ? 1 : -1));
  }
});

document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    previousFocus?.focus({ preventScroll: true });
  });
});

$('#rsvp-whatsapp').addEventListener('click', event => {
  event.preventDefault();
  $('#form-error').hidden = true;
  openDialog(rsvpDialog);
  $('#guest-name').focus();
});

document.querySelectorAll('.count-button').forEach(button => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.counter);
    const current = Number(input.value);
    const validCurrent = input.value !== '' && Number.isInteger(current) ? current : 0;
    input.value = String(Math.max(0, Math.min(99, validCurrent + Number(button.dataset.change))));
    $('#form-error').hidden = true;
  });
});

$('#rsvp-form').addEventListener('submit', event => {
  event.preventDefault();
  const adults = Number($('#guest-adults').value);
  const children = Number($('#guest-children').value);
  const error = $('#form-error');
  if (!Number.isInteger(adults) || !Number.isInteger(children) || adults < 0 || children < 0 || adults > 99 || children > 99 || adults + children === 0) {
    error.textContent = 'Informe pelo menos uma pessoa, usando quantidades inteiras de 0 a 99.';
    error.hidden = false;
    return;
  }
  const url = whatsappUrl(eventConfig.whatsapp, $('#guest-name').value, adults, children);
  if (!url) {
    error.textContent = 'Não foi possível preparar a confirmação. Tente novamente mais tarde.';
    error.hidden = false;
    return;
  }
  error.hidden = true;
  window.location.assign(url);
});

const mobileLinks = [...document.querySelectorAll('.mobile-bottom-nav a')];
const sections = mobileLinks.map(link => $(link.getAttribute('href')));
let scrollScheduled = false;
function updateActiveLink() {
  const trigger = window.innerHeight * .4;
  let activeIndex = 0;
  sections.forEach((section, index) => { if (section.getBoundingClientRect().top <= trigger) activeIndex = index; });
  mobileLinks.forEach((link, index) => {
    link.classList.toggle('is-active', index === activeIndex);
    if (index === activeIndex) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
  scrollScheduled = false;
}
window.addEventListener('scroll', () => { if (!scrollScheduled) { scrollScheduled = true; requestAnimationFrame(updateActiveLink); } }, { passive: true });
window.addEventListener('resize', updateActiveLink, { passive: true });
updateActiveLink();

function notify(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => { toast.hidden = true; }, 5000);
}

const startsAt = validDate(eventConfig.startsAt);
const endsAt = validDate(eventConfig.endsAt);
const allDayDate = /^\d{4}-\d{2}-\d{2}$/.test(eventConfig.allDayDate || '') ? new Date(`${eventConfig.allDayDate}T12:00:00Z`) : null;
let timeZone = eventConfig.timeZone || 'America/Campo_Grande';
try { new Intl.DateTimeFormat('pt-BR', { timeZone }); } catch { timeZone = 'America/Campo_Grande'; }
const format = (date, options) => new Intl.DateTimeFormat('pt-BR', { timeZone, ...options }).format(date);
const eventHasEnded = () => startsAt && (endsAt && endsAt > startsAt ? Date.now() >= endsAt.getTime() : Date.now() > startsAt.getTime() + 86400000);
const detailsComplete = Boolean(startsAt && eventConfig.venueName && eventConfig.address);

if (!startsAt && allDayDate && !Number.isNaN(allDayDate.getTime())) {
  $('#event-date').textContent = format(allDayDate, { day: 'numeric', month: 'long' });
  $('#event-date-note').textContent = format(allDayDate, { weekday: 'long', year: 'numeric' });
  $('#calendar-download').hidden = false;
}
if (startsAt) {
  $('#event-date').textContent = format(startsAt, { day: 'numeric', month: 'long' });
  $('#event-date-note').textContent = format(startsAt, { weekday: 'long', year: 'numeric' });
  $('#event-time').textContent = format(startsAt, { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':00', 'h').replace(':', 'h');
  $('#event-time-note').textContent = 'Horário local da festa.';
  $('#calendar-download').hidden = false;
  if (detailsComplete) {
    $('#countdown').hidden = false;
    const updateCountdown = () => {
      const now = Date.now();
      const values = $('#countdown-values');
      if (now >= startsAt.getTime()) {
        $('#countdown-label').textContent = eventHasEnded() ? 'Uma festança para guardar no coração.' : 'A porteira abriu: chegou a hora da festa!';
        values.replaceChildren();
      } else {
        const remaining = remainingTime(startsAt, now);
        const units = [[remaining.days, 'dias'], [remaining.hours, 'horas'], [remaining.minutes, 'minutos']];
        values.replaceChildren(...units.map(([number, label]) => {
          const unit = document.createElement('span');
          const small = document.createElement('small');
          unit.textContent = String(number).padStart(2, '0');
          small.textContent = label;
          unit.append(small);
          return unit;
        }));
      }
    };
    updateCountdown();
    setInterval(updateCountdown, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) updateCountdown(); });
  }
}
if (eventConfig.venueName) $('#event-venue').textContent = eventConfig.venueName;
if (eventConfig.address) $('#event-address').textContent = eventConfig.address;
const map = safeMapUrl(eventConfig.mapsUrl, eventConfig.address);
if (map) { $('#map-link').href = map; $('#map-link').hidden = false; }
if (detailsComplete) $('#event-status').textContent = 'Tudo pronto para abrir a porteira e festejar.';

$('#calendar-download').addEventListener('click', () => {
  const content = calendarFile(eventConfig);
  if (!content) return;
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'henri-1-aninho-fazenda.ics';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('Abra o arquivo baixado para adicionar a festa à sua agenda.');
});
