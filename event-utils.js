export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function phoneNumber(value) {
  return typeof value === 'string' && /^\d{11,15}$/.test(value) ? value : null;
}

export function safeMapUrl(value, address) {
  if (value) {
    try { const url = new URL(value); if (url.protocol === 'https:') return url.href; } catch { /* Use the address instead. */ }
  }
  if (!address) return null;
  const url = new URL('https://www.google.com/maps/search/');
  url.searchParams.set('api', '1');
  url.searchParams.set('query', address);
  return url.href;
}

export function whatsappUrl(phone, name, companions) {
  if (!phoneNumber(phone) || !name.trim()) return null;
  let message = `Olá! Sou ${name.trim()} e quero confirmar minha presença no aniversário de 1 aninho do Henri. 🐮🌻`;
  if (companions.trim()) message += `\nVou com: ${companions.trim()}.`;
  message += '\nEstamos felizes em fazer parte dessa festança na Fazenda do Zenon!';
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function calendarEscape(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

function foldLine(line) {
  const encoder = new TextEncoder();
  let current = '', bytes = 0;
  const lines = [];
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (bytes + size > 75) { lines.push(current); current = ' '; bytes = 1; }
    current += character; bytes += size;
  }
  lines.push(current);
  return lines.join('\r\n');
}

export function calendarFile(config, now = new Date()) {
  const start = validDate(config.startsAt);
  if (!start) return null;
  const end = validDate(config.endsAt);
  const stamp = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Henri//Fazenda do Zenon//PT-BR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT', `UID:henri-fazenda-do-zenon-${stamp(start)}`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(start)}`];
  if (end && end > start) lines.push(`DTEND:${stamp(end)}`);
  lines.push('SUMMARY:Henri faz 1 aninho — Fazenda do Zenon', `LOCATION:${calendarEscape([config.venueName, config.address].filter(Boolean).join(' — '))}`, 'DESCRIPTION:Vamos celebrar o primeiro aninho do Henri com a turma da fazenda!', 'END:VEVENT', 'END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

export function remainingTime(date, now = Date.now()) {
  const totalMinutes = Math.max(0, Math.floor((date.getTime() - now) / 60000));
  return { days: Math.floor(totalMinutes / 1440), hours: Math.floor(totalMinutes / 60) % 24, minutes: totalMinutes % 60 };
}
