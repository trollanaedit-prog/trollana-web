/* ============================================================
   downloaderV · Emojis 3D animados (hechos a mano, SVG)
   Cada cara se dibuja con piezas propias (no son emojis del sistema)
   y sigue la coreografía de la app: ENTRA, CAMBIA DE EXPRESIÓN a mitad,
   SE MUEVE y SALE encogiéndose.
   Uso:  DVEmoji.svg('amor')               -> SVG (texto)
         DVEmoji.play(caja, 'amor', {hold}) -> Promise (aparición completa)
   ============================================================ */
(function (w) {
  'use strict';
  let N = 0;
  const FONT_NUM = "Anton,'Bebas Neue',Impact,'Arial Narrow Bold','Arial Black',sans-serif";

  /* ---------- Paletas: luz, medio, profundo, borde, contorno ---------- */
  const PAL = {
    sun:    ['#FFF7C2', '#FFD84D', '#F9AC1C', '#E0790B', '#8C4505'],
    red:    ['#FFC9B5', '#FF7556', '#EE4129', '#B8241A', '#6E120C'],
    purple: ['#EAD9FF', '#B285FF', '#8452F2', '#5C2BC8', '#2D0E70'],
    ice:    ['#F0FAFF', '#B3E2FF', '#68BDF6', '#2F86D8', '#154C8A'],
    lime:   ['#F1FFC7', '#C2EA5F', '#8CC634', '#5D961A', '#2D560A'],
    rose:   ['#FFE6EE', '#FFB8CB', '#FC86A8', '#E35683', '#8A1C45'],
  };
  const INK = { sun: '#3D1E0C', red: '#4A0B05', purple: '#22063D', ice: '#0D2D57', lime: '#24400A', rose: '#5A1230' };
  const PUP = { sun: '#2A1408', red: '#2E0603', purple: '#1A0430', ice: '#0A1F3D', lime: '#182B06', rose: '#3A0A1F' };

  const HEART = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
  const STAR = 'M0 -7 C1 -2 2 -1 7 0 C2 1 1 2 0 7 C-1 2 -2 1 -7 0 C-2 -1 -1 -2 0 -7 Z';

  /* ---------- Recetas (expresión inicial -> final) ---------- */
  const R = {
    amor:      { pal: 'sun',    eyes: ['open', 'heart'],  brows: [null, null],       mouth: ['smile', 'grin'],   ex: ['blush'],            exB: ['hearts', 'sparkles'], ent: 'pop',   mov: 'pulse',   name: 'Amor' },
    risa:      { pal: 'sun',    eyes: ['happy', 'laugh'], brows: [null, null],       mouth: ['grin', 'laugh'],   ex: [],                   exB: ['joy'],                ent: 'jelly', mov: 'laugh',   name: 'Risa' },
    miedo:     { pal: 'sun',    eyes: ['open', 'wide'],   brows: ['worry', 'worry'], mouth: ['O', 'wavy'],       ex: ['sweat'],            exB: [],                     ent: 'zoom',  mov: 'tremble', name: 'Miedo' },
    sorpresa:  { pal: 'sun',    eyes: ['open', 'wide'],   brows: ['flat', 'raise'],  mouth: ['O', 'bigO'],       ex: [],                   exB: ['sparkles'],           ent: 'stamp', mov: 'hops',    name: 'Sorpresa' },
    diablo:    { pal: 'purple', eyes: ['half', 'angry'],  brows: ['angry', 'angry'], mouth: ['smirk', 'evil'],   ex: ['horns', 'flame'],   exB: [],                     ent: 'spin',  mov: 'tilt',    name: 'Diablo' },
    hambre:    { pal: 'sun',    eyes: ['open', 'happy'],  brows: ['raise', null],    mouth: ['smile', 'tongue'], ex: [],                   exB: ['drool', 'sparkles'],  ent: 'pop',   mov: 'wobble',  name: 'Hambre' },
    verguenza: { pal: 'rose',   eyes: ['side', 'happy'],  brows: ['worry', 'worry'], mouth: ['wavy', 'smile'],   ex: ['blush2'],           exB: ['sweat'],              ent: 'zoom',  mov: 'tilt',    name: 'Vergüenza' },
    enfado:    { pal: 'red',    eyes: ['angry', 'angry'], brows: ['angry', 'angry'], mouth: ['flat', 'teeth'],   ex: [],                   exB: ['steam', 'vein'],      ent: 'stamp', mov: 'shake',   name: 'Enfado' },
    dinero:    { pal: 'sun',    eyes: ['open', 'dollar'], brows: [null, 'raise'],    mouth: ['grin', 'laugh'],   ex: [],                   exB: ['coins', 'sparkles'],  ent: 'drop',  mov: 'hops',    name: 'Dinero' },
    frio:      { pal: 'ice',    eyes: ['half', 'open'],   brows: ['worry', 'worry'], mouth: ['teeth', 'wavy'],   ex: ['snowcap', 'flakes'], exB: [],                    ent: 'zoom',  mov: 'tremble', name: 'Frío' },
    asco:      { pal: 'lime',   eyes: ['half', 'laugh'],  brows: ['worry', 'angry'], mouth: ['wavy', 'yuck'],    ex: [],                   exB: ['stink'],              ent: 'jelly', mov: 'wobble',  name: 'Asco' },
    llorar:    { pal: 'sun',    eyes: ['teary', 'happy'], brows: ['worry', 'worry'], mouth: ['frown', 'bigO'],   ex: [],                   exB: ['tears'],              ent: 'drop',  mov: 'sob',     name: 'Llorar' },
    charla:    { pal: 'sun',    eyes: ['look', 'look'],   brows: [null, 'raise'],    mouth: ['talk', 'talk'],    ex: [],                   exB: [],                     ent: 'pop',   mov: 'tilt',    name: 'Charla' },
    cool:      { pal: 'sun',    eyes: ['shades', 'shades'], brows: [null, null],     mouth: ['smirk', 'grin'],   ex: [],                   exB: [],                     ent: 'stamp', mov: 'float',   name: 'Genial' },
  };
  const OBJ = {
    fuego:   { name: 'Fuego',   ent: 'drop',  mov: 'flick' },
    saco:    { name: 'Dinero',  ent: 'drop',  mov: 'hops' },
    pizza:   { name: 'Comida',  ent: 'spin',  mov: 'wobble' },
    peligro: { name: 'Peligro', ent: 'stamp', mov: 'shake' },
    mapa:    { name: 'Mapa',    ent: 'pop',   mov: 'float' },
    numero:  { name: 'Número',  ent: 'stamp', mov: 'float' },
    suscribir: { name: 'Botón', ent: 'pop',   mov: 'none' },
  };

  /* ============================================================
     PIEZAS
     ============================================================ */
  function defs(p, id) {
    return `<defs>
<radialGradient id="b${id}" gradientUnits="userSpaceOnUse" cx="47" cy="38" r="66" fx="42" fy="30"><stop offset="0" stop-color="${p[0]}"/><stop offset=".4" stop-color="${p[1]}"/><stop offset=".78" stop-color="${p[2]}"/><stop offset="1" stop-color="${p[3]}"/></radialGradient>
<linearGradient id="s${id}" x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stop-color="${p[3]}" stop-opacity="0"/><stop offset="1" stop-color="${p[4]}" stop-opacity=".55"/></linearGradient>
<radialGradient id="h${id}"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".55" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="e${id}" cx=".42" cy=".32" r=".72"><stop offset="0" stop-color="#fff"/><stop offset=".72" stop-color="#F7F2F8"/><stop offset="1" stop-color="#D8CDE0"/></radialGradient>
<linearGradient id="m${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#802718"/><stop offset="1" stop-color="#360A05"/></linearGradient>
<linearGradient id="t${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFA3B6"/><stop offset="1" stop-color="#E2456A"/></linearGradient>
<radialGradient id="k${id}"><stop offset="0" stop-color="#FF4F7E" stop-opacity=".7"/><stop offset="1" stop-color="#FF4F7E" stop-opacity="0"/></radialGradient>
<linearGradient id="w${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E2F5FF"/><stop offset="1" stop-color="#3496EE"/></linearGradient>
<linearGradient id="r${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8AA6"/><stop offset=".5" stop-color="#FF2E5B"/><stop offset="1" stop-color="#C70F3A"/></linearGradient>
<linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3A3"/><stop offset=".5" stop-color="#FFC21A"/><stop offset="1" stop-color="#C98400"/></linearGradient>
<linearGradient id="d${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9BFFB0"/><stop offset="1" stop-color="#11A34A"/></linearGradient>
<linearGradient id="n${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9A6FF"/><stop offset="1" stop-color="#5B21B6"/></linearGradient>
<linearGradient id="q${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4A4A5C"/><stop offset=".55" stop-color="#14141C"/><stop offset="1" stop-color="#050508"/></linearGradient>
</defs>`;
  }

  function body(p) {
    return `<ellipse class="gd" cx="60" cy="113" rx="31" ry="5" fill="#160825" opacity=".3"/>
<circle cx="60" cy="60" r="46" fill="url(#b@)"/>
<circle cx="60" cy="60" r="46" fill="url(#s@)"/>
<path d="M30.5 90.5 A43 43 0 0 0 89.5 90.5" fill="none" stroke="${p[0]}" stroke-opacity=".55" stroke-width="2.6" stroke-linecap="round"/>
<ellipse cx="43" cy="30" rx="18" ry="9" transform="rotate(-28 43 30)" fill="url(#h@)"/>
<ellipse cx="29.5" cy="47" rx="3" ry="5" transform="rotate(20 29.5 47)" fill="#fff" opacity=".35"/>
<circle cx="60" cy="60" r="45.3" fill="none" stroke="${p[4]}" stroke-opacity=".42" stroke-width="1.3"/>`;
  }

  /* --- ojos --- */
  function openEyes(ink, pup, o) {
    o = o || {};
    const rx = o.rx || 8.4, ry = o.ry || 10.2, pr = o.pr || 5.3, dy = o.dy == null ? 2.4 : o.dy, dx = o.dx || 1;
    const one = (cx) => `<ellipse cx="${cx}" cy="55" rx="${rx}" ry="${ry}" fill="url(#e@)" stroke="${ink}" stroke-opacity=".3" stroke-width="1.1"/>`;
    const p = (cx) => `<circle cx="${cx + dx}" cy="${55 + dy}" r="${pr}" fill="${pup}"/><circle cx="${cx + dx - pr * .34}" cy="${55 + dy - pr * .45}" r="${Math.max(1.3, pr * .36)}" fill="#fff"/><circle cx="${cx + dx + pr * .38}" cy="${55 + dy + pr * .4}" r="${Math.max(.7, pr * .16)}" fill="#fff" opacity=".8"/>`;
    return `<g class="eyes${o.blink === false ? '' : ' blink'}" style="animation-delay:-${(Math.random() * 3.6).toFixed(2)}s">${one(44)}${one(76)}<g class="pup${o.look ? ' look' : ''}${o.jit ? ' jit' : ''}">${p(44)}${p(76)}</g></g>`;
  }
  function lids(kind) {
    if (kind === 'half') {
      return `<path d="M34.4 55 C34.8 42.8 53.2 42.8 53.6 55 Z" fill="url(#b@)"/><path d="M66.4 55 C66.8 42.8 85.2 42.8 85.6 55 Z" fill="url(#b@)"/>
<path d="M34.8 55 Q44 57.4 53.2 55" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/><path d="M66.8 55 Q76 57.4 85.2 55" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/>`;
    }
    // enfado: párpados en diagonal
    return `<path d="M32 43 L56 50.5 L56 40 L32 40 Z" fill="url(#b@)"/><path d="M88 43 L64 50.5 L64 40 L88 40 Z" fill="url(#b@)"/>
<path d="M34.5 45.6 L54.5 51.4" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/><path d="M85.5 45.6 L65.5 51.4" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/>`;
  }
  function eyes(kind, ink, pup) {
    const st = `fill="none" stroke="${ink}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"`;
    switch (kind) {
      case 'open':  return openEyes(ink, pup);
      case 'look':  return openEyes(ink, pup, { look: true });
      case 'side':  return openEyes(ink, pup, { dx: -3.2, dy: 3.4 });
      case 'wide':  return openEyes(ink, pup, { rx: 9.8, ry: 12, pr: 3.3, dy: .6, dx: 0, jit: true });
      case 'teary': return openEyes(ink, pup, { pr: 6.6, dy: 1.6 }) +
        `<path d="M37 62.5 Q44 67.5 51 62.5 Q44 65 37 62.5 Z" fill="url(#w@)" opacity=".9"/><path d="M69 62.5 Q76 67.5 83 62.5 Q76 65 69 62.5 Z" fill="url(#w@)" opacity=".9"/>`;
      case 'half':  return openEyes(ink, pup, { dy: 3.6, blink: false }) + lids('half');
      case 'angry': return openEyes(ink, pup, { rx: 8, ry: 9.4, pr: 4.6, dy: 2.6, dx: 0, blink: false }) + lids('angry');
      case 'happy': return `<path d="M35.5 58 Q44 47.5 52.5 58" ${st}/><path d="M67.5 58 Q76 47.5 84.5 58" ${st}/>`;
      case 'laugh': return `<path d="M37 48.5 L50.5 55.5 L37 62.5" ${st}/><path d="M83 48.5 L69.5 55.5 L83 62.5" ${st}/>`;
      case 'heart': {
        const h = (cx) => `<g transform="translate(${cx} 55.5) scale(1.12) translate(-12 -12.4)"><path d="${HEART}" fill="url(#r@)" stroke="#8E0A2A" stroke-width=".9"/><ellipse cx="7.6" cy="8.2" rx="2.7" ry="1.7" transform="rotate(-35 7.6 8.2)" fill="#fff" opacity=".85"/></g>`;
        return `<g class="beat">${h(44)}${h(76)}</g>`;
      }
      case 'dollar': {
        const d = (cx) => `<text x="${cx}" y="65" text-anchor="middle" font-family="${FONT_NUM}" font-size="27" font-weight="900" fill="url(#d@)" stroke="#0A4A22" stroke-width="1.8" paint-order="stroke">$</text>`;
        return `<g class="beat">${d(44)}${d(76)}</g>`;
      }
      case 'shades':
        return `<path d="M29 46.5 H56.5 Q58 46.5 57.4 48.6 L54.6 59 Q53.4 64.5 47.6 64.5 H38.2 Q32.6 64.5 31.4 59 L28.4 48.6 Q27.8 46.5 29 46.5 Z" fill="url(#q@)"/>
<path d="M63.5 46.5 H91 Q92.2 46.5 91.6 48.6 L88.6 59 Q87.4 64.5 81.8 64.5 H72.4 Q66.6 64.5 65.4 59 L62.6 48.6 Q62 46.5 63.5 46.5 Z" fill="url(#q@)"/>
<path d="M56.6 50.2 Q60 47.6 63.4 50.2" fill="none" stroke="#0B0B10" stroke-width="2.6" stroke-linecap="round"/>
<path d="M29.5 48 L16 44.5 M90.5 48 L104 44.5" stroke="#0B0B10" stroke-width="2.6" stroke-linecap="round"/>
<path class="glint" d="M35 50.5 L41.5 61 M40.5 50.5 L44 56 M69.5 50.5 L76 61 M75 50.5 L78.5 56" stroke="#fff" stroke-opacity=".38" stroke-width="2.2" stroke-linecap="round"/>`;
      default: return '';
    }
  }

  /* --- cejas --- */
  function brows(kind, ink) {
    const st = `fill="none" stroke="${ink}" stroke-linecap="round"`;
    switch (kind) {
      case 'raise': return `<path d="M35 38 Q44 31.5 53 37" ${st} stroke-width="3.6"/><path d="M67 37 Q76 31.5 85 38" ${st} stroke-width="3.6"/>`;
      case 'angry': return `<path d="M33.5 40 L54.5 47.5" ${st} stroke-width="4.8"/><path d="M86.5 40 L65.5 47.5" ${st} stroke-width="4.8"/>`;
      case 'worry': return `<path d="M35 45 Q43 41.5 52 37.5" ${st} stroke-width="3.6"/><path d="M85 45 Q77 41.5 68 37.5" ${st} stroke-width="3.6"/>`;
      case 'flat':  return `<path d="M36 41 Q44 39.5 52 41" ${st} stroke-width="3.4"/><path d="M68 41 Q76 39.5 84 41" ${st} stroke-width="3.4"/>`;
      default: return '';
    }
  }

  /* --- bocas --- */
  function openMouth(path, id, teeth, tongue, ink) {
    return `<clipPath id="c${id}"><path d="${path}"/></clipPath><path d="${path}" fill="url(#m@)"/>
<g clip-path="url(#c${id})">${teeth || ''}${tongue || ''}</g>
<path d="${path}" fill="none" stroke="${ink}" stroke-opacity=".55" stroke-width="1.5" stroke-linejoin="round"/>`;
  }
  function mouth(kind, ink, uid) {
    const st = `fill="none" stroke="${ink}" stroke-width="4.3" stroke-linecap="round" stroke-linejoin="round"`;
    switch (kind) {
      case 'smile': return `<path d="M43.5 78.5 Q60 94 76.5 78.5" ${st}/>`;
      case 'smirk': return `<path d="M45 86.5 Q63 91.5 77.5 77.5" ${st}/>`;
      case 'flat':  return `<path d="M46 86 L74 86" ${st}/>`;
      case 'frown': return `<path d="M45 92.5 Q60 80 75 92.5" ${st}/>`;
      case 'wavy':  return `<path d="M41.5 88 Q46 83 50.5 88 T59.5 88 T68.5 88 T77.5 88" fill="none" stroke="${ink}" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>`;
      case 'grin':  return openMouth('M40 76 Q60 80.5 80 76 Q78.5 100.5 60 101.5 Q41.5 100.5 40 76 Z', uid,
        '<path d="M38 72 H82 V82.6 Q60 86.2 38 82.6 Z" fill="#fff"/>', '<ellipse cx="60" cy="100.5" rx="13.5" ry="7.5" fill="url(#t@)"/>', ink);
      case 'laugh': return openMouth('M35.5 71.5 Q60 76.5 84.5 71.5 Q82.5 106.5 60 107.5 Q37.5 106.5 35.5 71.5 Z', uid,
        '<path d="M33 66 H87 V80.5 Q60 85 33 80.5 Z" fill="#fff"/>', '<ellipse cx="60" cy="106" rx="17" ry="10" fill="url(#t@)"/>', ink);
      case 'evil':  return openMouth('M36.5 73.5 Q60 86.5 83.5 73.5 Q77.5 99.5 60 100.5 Q42.5 99.5 36.5 73.5 Z', uid,
        '<path d="M42 70 L48.5 87 L53 76.5 Z M78 70 L71.5 87 L67 76.5 Z" fill="#fff"/>', '<ellipse cx="60" cy="100" rx="12" ry="6.5" fill="url(#t@)"/>', ink);
      case 'O':     return openMouth('M60 77.5 C65 77.5 68 82 68 87.5 C68 93.5 64.5 97 60 97 C55.5 97 52 93.5 52 87.5 C52 82 55 77.5 60 77.5 Z', uid,
        '', '<ellipse cx="60" cy="96" rx="6" ry="3.6" fill="url(#t@)"/>', ink);
      case 'bigO':  return openMouth('M60 73.5 C67.5 73.5 72 80.5 72 88 C72 96.5 67 102.5 60 102.5 C53 102.5 48 96.5 48 88 C48 80.5 52.5 73.5 60 73.5 Z', uid,
        '', '<ellipse cx="60" cy="101.5" rx="9.5" ry="5.6" fill="url(#t@)"/>', ink);
      case 'talk':  return `<g class="talk">${openMouth('M45.5 79.5 Q60 77 74.5 79.5 Q73.5 95 60 95.5 Q46.5 95 45.5 79.5 Z', uid, '<path d="M46 78 H74 V83.4 Q60 85.2 46 83.4 Z" fill="#fff"/>', '<ellipse cx="60" cy="93" rx="8" ry="4.4" fill="url(#t@)"/>', ink)}</g>`;
      case 'teeth': return `<g class="chatter"><rect x="41.5" y="79.5" width="37" height="14" rx="7" fill="#fff" stroke="${ink}" stroke-width="2.6"/>
<path d="M42 86.5 H78 M50.8 80 V93 M60 79.6 V93.4 M69.2 80 V93" stroke="${ink}" stroke-opacity=".55" stroke-width="1.4"/></g>`;
      case 'tongue': return `<path d="M43 78.5 Q60 93 77 78.5" ${st}/>
<path d="M57.8 85.6 Q56.8 101 66 101.6 Q74.4 101.6 73.2 86.6 Q65.4 89.6 57.8 85.6 Z" fill="url(#t@)" stroke="${ink}" stroke-opacity=".45" stroke-width="1.2"/>
<path d="M65.6 88.6 L66.3 96" stroke="#C2335A" stroke-width="1.3" stroke-linecap="round"/>`;
      case 'yuck': return `<path d="M42 84 Q47 80 52 84 T62 84 T72 84 T80 83" ${st}/>
<path d="M53 85.5 Q52 99 60.5 99.6 Q68.6 99.6 67.5 86.6 Q60 89 53 85.5 Z" fill="url(#t@)" stroke="${ink}" stroke-opacity=".45" stroke-width="1.2"/>`;
      default: return '';
    }
  }

  /* --- extras --- */
  const heartAt = (x, y, s, cls) => `<g class="${cls || ''}" style="--x:${x}px;--y:${y}px"><g transform="translate(${x} ${y}) scale(${s}) translate(-12 -12)"><path d="${HEART}" fill="url(#r@)"/><ellipse cx="7.6" cy="8.2" rx="2.6" ry="1.6" transform="rotate(-35 7.6 8.2)" fill="#fff" opacity=".8"/></g></g>`;
  const starAt = (x, y, s, d) => `<g class="twinkle" style="animation-delay:${d}s"><path transform="translate(${x} ${y}) scale(${s})" d="${STAR}" fill="#FFF7CC" stroke="#FFC93D" stroke-width=".6"/></g>`;
  function flamePaths(id, tx, ty, s) {
    return `<g transform="translate(${tx} ${ty}) scale(${s})">
<path class="fl fa" d="M60 4 C64 22 84 34 88 58 C92 82 78 108 60 108 C40 108 28 92 30 72 C31 58 40 50 44 38 C48 50 52 54 56 56 C54 40 52 22 60 4 Z" fill="url(#f1${id})"/>
<path class="fl fb" d="M60 32 C64 47 79 58 79 77 C79 95 71 106 60 106 C47 106 40.5 96 41.5 82 C42.5 72 50 66 52 57.5 C55 66 57.2 68 59.4 69.2 C58 58 56 46 60 32 Z" fill="url(#f2${id})"/>
<path class="fl fc" d="M60 60 C63.5 71 71 78 71 89.5 C71 99.5 66.5 105.5 60 105.5 C53 105.5 49.5 99.5 49.5 91 C49.5 84 54.5 79.5 57 73.5 C58.2 78.6 59.2 80 60.2 80.5 C59.3 74 58.3 67 60 60 Z" fill="url(#f3${id})"/>
</g>`;
  }
  function flameDefs(id) {
    return `<linearGradient id="f1${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#E8290B"/><stop offset=".6" stop-color="#FF5A0E"/><stop offset="1" stop-color="#FF9A1F"/></linearGradient>
<linearGradient id="f2${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF7A00"/><stop offset="1" stop-color="#FFC21A"/></linearGradient>
<linearGradient id="f3${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FFE07A"/><stop offset="1" stop-color="#FFFBEA"/></linearGradient>`;
  }
  function extra(kind, id, ink) {
    switch (kind) {
      case 'blush':  return `<ellipse cx="32.5" cy="71.5" rx="9.5" ry="6" fill="url(#k@)"/><ellipse cx="87.5" cy="71.5" rx="9.5" ry="6" fill="url(#k@)"/>`;
      case 'blush2': return `<ellipse cx="32" cy="70" rx="12.5" ry="8" fill="url(#k@)"/><ellipse cx="88" cy="70" rx="12.5" ry="8" fill="url(#k@)"/>
<path d="M26 68 l3 -4 M31 69 l3 -4 M36 68.5 l3 -4 M84 68.5 l3 -4 M89 69 l3 -4 M94 68 l3 -4" stroke="#E0386B" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round"/>`;
      case 'sweat':  return `<g class="sweat"><path d="M97 15 C100 22.5 104.5 27 104.5 32.5 A7.5 7.5 0 0 1 89.5 32.5 C89.5 27 94 22.5 97 15 Z" fill="url(#w@)" stroke="#2B7BCB" stroke-opacity=".5" stroke-width="1"/><ellipse cx="94.3" cy="30.5" rx="1.7" ry="3.2" fill="#fff" opacity=".9"/></g>`;
      case 'tears':  return `<path class="flow" d="M38 64 Q33.5 80 36.5 101" fill="none" stroke="url(#w@)" stroke-width="7" stroke-linecap="round" opacity=".92"/><path class="flow" d="M82 64 Q86.5 80 83.5 101" fill="none" stroke="url(#w@)" stroke-width="7" stroke-linecap="round" opacity=".92"/>`;
      case 'joy':    return `<g class="fling l"><path d="M27 52 C25 56 22 58 22.5 61.5 A4.6 4.6 0 0 0 31.6 61.5 C31.8 58 29 56 27 52 Z" fill="url(#w@)"/></g><g class="fling r"><path d="M93 52 C95 56 98 58 97.5 61.5 A4.6 4.6 0 0 1 88.4 61.5 C88.2 58 91 56 93 52 Z" fill="url(#w@)"/></g>`;
      case 'hearts': return heartAt(14, 34, .62, 'rise') + heartAt(105, 26, .5, 'rise d2') + heartAt(108, 64, .42, 'rise d3');
      case 'sparkles': return starAt(16, 18, 1.05, 0) + starAt(104, 14, .8, .35) + starAt(110, 76, .7, .7);
      case 'coins': {
        const coin = (x, y, cls) => `<g class="coin ${cls}"><ellipse cx="${x}" cy="${y}" rx="9" ry="9" fill="url(#g@)" stroke="#8A5A00" stroke-width="1.4"/><ellipse cx="${x}" cy="${y}" rx="6.4" ry="6.4" fill="none" stroke="#B87800" stroke-width="1.1"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-family="${FONT_NUM}" font-size="11" fill="#8A5A00">$</text></g>`;
        return coin(12, 74, 'l') + coin(108, 70, 'r') + coin(100, 22, 't');
      }
      case 'steam': {
        const puff = (x, y, cls) => `<g class="steam ${cls}"><circle cx="${x}" cy="${y}" r="6.2"/><circle cx="${x + (cls === 'l' ? -6 : 6)}" cy="${y - 7}" r="7.6"/><circle cx="${x + (cls === 'l' ? 1 : -1)}" cy="${y - 14}" r="5.4"/></g>`;
        return `<g fill="#fff" opacity=".95">${puff(16, 42, 'l')}${puff(104, 42, 'r')}</g>`;
      }
      case 'vein':   return `<g class="throb" stroke="#D3123E" stroke-width="3.4" fill="none" stroke-linecap="round"><path d="M82 17 Q87 22 92 17"/><path d="M82 31 Q87 26 92 31"/><path d="M80 19 Q85 24 80 29"/><path d="M94 19 Q89 24 94 29"/></g>`;
      case 'horns':  return `<path d="M27.5 33 C19.5 22 20.5 8.5 28 0 C29.6 11.6 36 19.5 45.5 22.5 Z" fill="url(#n@)" stroke="#2D0E70" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M92.5 33 C100.5 22 99.5 8.5 92 0 C90.4 11.6 84 19.5 74.5 22.5 Z" fill="url(#n@)" stroke="#2D0E70" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M26.5 7 C25 14 27 21 32 26" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.6" stroke-linecap="round"/>`;
      case 'flame':  return `<defs>${flameDefs(id)}</defs><g class="crown">${flamePaths(id, 39, -22, .35)}</g>`;
      case 'drool':  return `<g class="drip"><path d="M72.5 92 C74.5 97 76.5 99.5 76.5 102.5 A4 4 0 0 1 68.5 102.5 C68.5 99.5 70.5 97 72.5 92 Z" fill="url(#w@)"/></g>`;
      case 'snowcap': return `<g transform="translate(0 4) scale(1 .72)"><path d="M17.5 47 C21 22 41 10.5 60 10.5 C79 10.5 99 22 102.5 47 C99.5 50.5 96.5 45.5 93.2 49.6 C90.2 53.6 87.2 46.6 84 50.4 C80.8 54.6 77.8 48.4 74.6 51.6 C71.6 54.8 68.6 49.4 65.4 52.4 C62.4 55.4 59.4 49.6 56.4 52.4 C53.2 55.4 50.4 49.6 47.2 52 C44 54.4 41.2 48.6 38 51 C34.8 53.4 32 47 28.8 49.8 C25.6 52.6 22.4 45.6 17.5 47 Z" fill="#F6FCFF" stroke="#BCE2FF" stroke-width="1.2"/>
<path d="M30 49.4 L31.4 58 L33 50.2 M56.4 52.6 L57.8 61.5 L59.4 52.8 M84.2 50.6 L85.6 59 L87.2 50.8" fill="#E8F7FF" stroke="#A6D8FF" stroke-width="1" stroke-linejoin="round"/>
<ellipse cx="45" cy="22" rx="12" ry="4" transform="rotate(-18 45 22)" fill="#fff"/></g>`;
      case 'flakes': {
        const f = (x, y, s, d) => `<g class="drift" style="animation-delay:${d}s"><path transform="translate(${x} ${y}) scale(${s})" d="M0 -8 V8 M-7 -4 L7 4 M-7 4 L7 -4 M-2.5 -6 L0 -3.5 L2.5 -6 M-2.5 6 L0 3.5 L2.5 6" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></g>`;
        return f(10, 28, .9, 0) + f(110, 40, .75, .6) + f(108, 88, .6, 1.1) + f(12, 92, .55, .3);
      }
      case 'stink':  return `<g class="stinks" fill="none" stroke="#7BB82B" stroke-width="3" stroke-linecap="round"><path class="rise" d="M40 8 Q44 3 40 -2 T40 -12"/><path class="rise d2" d="M60 4 Q64 -1 60 -6 T60 -16"/><path class="rise d3" d="M80 8 Q84 3 80 -2 T80 -12"/></g>`;
      default: return '';
    }
  }

  /* ============================================================
     CARA COMPLETA
     ============================================================ */
  function faceSVG(kind, opts) {
    const r = R[kind]; if (!r) return '';
    const id = 'v' + (++N);
    const p = PAL[r.pal], ink = INK[r.pal], pup = PUP[r.pal];
    const layer = (i) => {
      const e = eyes(r.eyes[i], ink, pup), b = brows(r.brows[i], ink), m = mouth(r.mouth[i], ink, id + 'm' + i);
      return e + b + m;
    };
    const same = r.eyes[0] === r.eyes[1] && r.mouth[0] === r.mouth[1] && r.brows[0] === r.brows[1];
    const exA = r.ex.map(x => extra(x, id, ink)).join('');
    const exB = r.exB.map(x => extra(x, id, ink)).join('');
    const BACK = ['horns', 'flame', 'flakes'], MID = ['snowcap', 'blush', 'blush2'];
    const back = r.ex.filter(x => BACK.includes(x)).map(x => extra(x, id, ink)).join('');
    const mid = r.ex.filter(x => MID.includes(x)).map(x => extra(x, id, ink)).join('');
    const front = r.ex.filter(x => !BACK.includes(x) && !MID.includes(x)).map(x => extra(x, id, ink)).join('');
    const svg = `<svg class="emoji-svg${opts && opts.final ? ' swap' : ''}" viewBox="-12 -16 144 144" style="--ink:${ink}" aria-hidden="true" focusable="false">${defs(p, id)}${back}${body(p)}${mid}
<g class="${same ? 'xs' : 'xa'}">${layer(0)}</g>${same ? '' : `<g class="xb">${layer(1)}</g>`}${front}<g class="xb">${exB}</g></svg>`;
    return svg.replace(/@\)/g, id + ')');
  }

  /* ============================================================
     OBJETOS
     ============================================================ */
  function objSVG(kind) {
    const id = 'o' + (++N);
    const gd = `<ellipse class="gd" cx="60" cy="113" rx="28" ry="5" fill="#160825" opacity=".3"/>`;
    switch (kind) {
      case 'fuego':
        return `<svg class="emoji-svg obj-fuego" viewBox="-12 -16 144 144" aria-hidden="true"><defs>${flameDefs(id)}
<radialGradient id="fg${id}"><stop offset="0" stop-color="#FF9A1F" stop-opacity=".55"/><stop offset="1" stop-color="#FF5A0E" stop-opacity="0"/></radialGradient></defs>
${gd}<circle class="glow" cx="60" cy="76" r="50" fill="url(#fg${id})"/>${flamePaths(id, 0, 0, 1)}
<g class="embers" fill="#FFC21A"><circle class="em" cx="38" cy="40" r="2.4"/><circle class="em d2" cx="86" cy="30" r="2"/><circle class="em d3" cx="70" cy="14" r="1.8"/></g></svg>`;
      case 'saco':
        return `<svg class="emoji-svg obj-saco" viewBox="-12 -16 144 144" aria-hidden="true"><defs>
<radialGradient id="sk${id}" gradientUnits="userSpaceOnUse" cx="48" cy="60" r="60"><stop offset="0" stop-color="#F2C98A"/><stop offset=".55" stop-color="#C98A45"/><stop offset="1" stop-color="#7A4A1A"/></radialGradient>
<linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3A3"/><stop offset=".5" stop-color="#FFC21A"/><stop offset="1" stop-color="#C98400"/></linearGradient></defs>
${gd}<path d="M41 47 C27 58 20 73 22.5 87 C25 102 40 110 60 110 C80 110 95 102 97.5 87 C100 73 93 58 79 47 Z" fill="url(#sk${id})" stroke="#5A3410" stroke-width="1.6"/>
<path d="M43 26 C47 33 51 38 53 46 L67 46 C69 38 73 33 77 26 C71 29.5 66.5 27 60 22 C53.5 27 49 29.5 43 26 Z" fill="url(#sk${id})" stroke="#5A3410" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M44.5 47.5 Q60 55 75.5 47.5" fill="none" stroke="#4A2A0C" stroke-width="5.5" stroke-linecap="round"/>
<path d="M44.5 47.5 Q60 55 75.5 47.5" fill="none" stroke="#B9874A" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="3 4"/>
<ellipse cx="38" cy="78" rx="7" ry="16" transform="rotate(15 38 78)" fill="#fff" opacity=".2"/>
<text x="60" y="97" text-anchor="middle" font-family="${FONT_NUM}" font-size="38" fill="url(#g${id})" stroke="#6B4A00" stroke-width="1.8" paint-order="stroke">$</text>
<g class="coin l"><ellipse cx="14" cy="80" rx="9" ry="9" fill="url(#g${id})" stroke="#8A5A00" stroke-width="1.4"/><text x="14" y="84" text-anchor="middle" font-family="${FONT_NUM}" font-size="11" fill="#8A5A00">$</text></g>
<g class="coin r"><ellipse cx="106" cy="74" rx="9" ry="9" fill="url(#g${id})" stroke="#8A5A00" stroke-width="1.4"/><text x="106" y="78" text-anchor="middle" font-family="${FONT_NUM}" font-size="11" fill="#8A5A00">$</text></g></svg>`;
      case 'pizza':
        return `<svg class="emoji-svg obj-pizza" viewBox="-12 -16 144 144" aria-hidden="true"><defs>
<linearGradient id="cr${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F5B868"/><stop offset="1" stop-color="#B8691E"/></linearGradient>
<linearGradient id="ch${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE38A"/><stop offset=".6" stop-color="#FFC23D"/><stop offset="1" stop-color="#F59E0B"/></linearGradient>
<radialGradient id="pp${id}" cx=".38" cy=".34"><stop offset="0" stop-color="#F0614F"/><stop offset="1" stop-color="#A8150E"/></radialGradient></defs>
${gd}<path d="M24.5 36 Q60 18 95.5 36 L63.5 106 Q60 112 56.5 106 Z" fill="url(#ch${id})" stroke="#C7790E" stroke-width="1.4" stroke-linejoin="round"/>
<path d="M31 50 Q33 58 30.5 63 A3 3 0 0 0 36.5 63 Q36.5 57 35.5 52 Z M84 47 Q82 56 85 61 A3 3 0 0 1 79 61 Q79 55 80 50 Z" fill="#FFC23D"/>
<path d="M19 27 Q60 6 101 27 Q103 33 97 38 Q60 19 23 38 Q17 33 19 27 Z" fill="url(#cr${id})" stroke="#8A4A12" stroke-width="1.4"/>
<path d="M30 27 Q60 14 90 27" fill="none" stroke="#FFE2B0" stroke-opacity=".7" stroke-width="2.2" stroke-linecap="round"/>
<circle cx="45" cy="50" r="8" fill="url(#pp${id})"/><circle cx="72" cy="51" r="8.6" fill="url(#pp${id})"/><circle cx="58.5" cy="74" r="7.2" fill="url(#pp${id})"/><circle cx="60" cy="94" r="4.4" fill="url(#pp${id})"/>
<g fill="#7A0D08" opacity=".55"><circle cx="43" cy="49" r="1.1"/><circle cx="47" cy="53" r=".9"/><circle cx="70" cy="49" r="1.1"/><circle cx="74.6" cy="53.6" r=".9"/><circle cx="57" cy="72.6" r="1"/></g>
<path d="M50 61 l3 2 M66 63 l-2.5 2.5 M53 86 l2.6 1.4 M66 82 l-2.4 1.8" stroke="#3E8E2E" stroke-width="2.6" stroke-linecap="round"/></svg>`;
      case 'peligro':
        return `<svg class="emoji-svg obj-peligro" viewBox="-12 -16 144 144" aria-hidden="true"><defs>
<linearGradient id="wy${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE45C"/><stop offset="1" stop-color="#FFB300"/></linearGradient>
<radialGradient id="wg${id}"><stop offset="0" stop-color="#FF3B3B" stop-opacity=".5"/><stop offset="1" stop-color="#FF3B3B" stop-opacity="0"/></radialGradient></defs>
${gd}<circle class="alarm" cx="60" cy="62" r="58" fill="url(#wg${id})"/>
<path d="M60 10 Q65 10 67.5 14.6 L106.5 89.4 Q109.5 96.5 101.5 98 L18.5 98 Q10.5 96.5 13.5 89.4 L52.5 14.6 Q55 10 60 10 Z" fill="url(#wy${id})" stroke="#16161C" stroke-width="5.5" stroke-linejoin="round"/>
<path d="M57 22 L27 82" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>
<rect x="54.5" y="37" width="11" height="36" rx="5.5" fill="#16161C"/><circle cx="60" cy="85" r="6.4" fill="#16161C"/></svg>`;
      default: return '';
    }
  }

  function mapaHTML(city, country, flag) {
    const id = 'm' + (++N);
    return `<div class="obj-mapa"><div class="mp-card"><svg class="mp-tile" viewBox="0 0 170 96" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<rect width="170" height="96" fill="#EEF3E2"/><path d="M-5 70 C30 60 50 82 85 72 S140 50 175 62 L175 96 L-5 96 Z" fill="#A8D8F7"/>
<path d="M98 8 C112 4 126 12 124 26 C122 38 104 40 96 30 C90 22 90 12 98 8 Z" fill="#C8E7AE"/><path d="M14 14 C22 10 34 14 32 24 C30 32 18 32 14 26 Z" fill="#C8E7AE"/>
<g fill="none" stroke-linecap="round"><path d="M-5 40 C40 36 70 50 175 34" stroke="#D5DAE3" stroke-width="9"/><path d="M-5 40 C40 36 70 50 175 34" stroke="#fff" stroke-width="6"/>
<path d="M60 -5 C66 30 58 60 70 100" stroke="#D5DAE3" stroke-width="8"/><path d="M60 -5 C66 30 58 60 70 100" stroke="#fff" stroke-width="5"/>
<path d="M120 -5 L132 100" stroke="#FFD27A" stroke-width="5"/><path d="M-5 16 L60 22" stroke="#fff" stroke-width="3"/><path d="M84 46 L150 80" stroke="#fff" stroke-width="3"/></g></svg>
<span class="mp-pin"><svg viewBox="0 0 30 40" aria-hidden="true"><defs><linearGradient id="pn${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF7A7A"/><stop offset="1" stop-color="#D3123E"/></linearGradient></defs><path d="M15 39 C15 39 2 23.5 2 14 A13 13 0 0 1 28 14 C28 23.5 15 39 15 39 Z" fill="url(#pn${id})" stroke="#8E0A2A" stroke-width="1.2"/><circle cx="15" cy="14" r="5" fill="#fff"/><ellipse cx="10" cy="8.5" rx="3" ry="2" transform="rotate(-30 10 8.5)" fill="#fff" opacity=".6"/></svg></span>
<span class="mp-shadow"></span>
<div class="mp-lab"><i class="mp-flag ${flag}"></i><b>${city}</b><small>${country}</small></div></div></div>`;
  }
  function numeroHTML(num, word) {
    const id = 'n' + (++N);
    let layers = '';
    for (let i = 9; i >= 1; i--) layers += `<text x="${110 + i * .85}" y="${80 + i * 1.05}" fill="${i > 6 ? '#1F0440' : '#3B0A75'}">${num}</text>`;
    return `<div class="obj-num"><svg viewBox="0 0 220 124" aria-hidden="true"><defs>
<linearGradient id="ng${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3E8FF"/><stop offset=".45" stop-color="#C084FC"/><stop offset="1" stop-color="#7E22CE"/></linearGradient></defs>
<g font-family="${FONT_NUM}" font-size="86" text-anchor="middle">${layers}
<text x="110" y="80" fill="url(#ng${id})" stroke="#2A0554" stroke-width="3" paint-order="stroke">${num}</text>
<text x="110" y="80" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1" transform="translate(-1.2 -1.2)">${num}</text></g>
<text x="110" y="116" text-anchor="middle" font-family="${FONT_NUM}" font-size="25" letter-spacing="1.5" fill="#fff" stroke="#3B0A75" stroke-width="5" paint-order="stroke">${word}</text></svg></div>`;
  }
  function suscribirHTML() {
    return `<div class="obj-sub"><span class="sb-btn"><svg class="sb-bell" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a2.2 2.2 0 0 0 2.2-2.2h-4.4A2.2 2.2 0 0 0 12 22zm6.6-6.6V10.9c0-3.4-1.8-6.2-5-7V3.2a1.6 1.6 0 0 0-3.2 0v.7c-3.2.8-5 3.6-5 7v4.5L3.2 17.6v1.1h17.6v-1.1z" fill="currentColor"/></svg><b class="sb-a">SUSCRIBIRSE</b><b class="sb-b"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>SUSCRITO</b></span>
<svg class="sb-cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2.5l15 9.2-6.6 1.4 3.7 7.3-3 1.5-3.7-7.3-5.4 4.3z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg></div>`;
  }

  /* ============================================================
     COREOGRAFÍA (Web Animations API)
     ============================================================ */
  const ENT = {
    pop:   { d: 460, k: [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.2)', opacity: 1, offset: .55 }, { transform: 'scale(.93)', offset: .78 }, { transform: 'scale(1)' }] },
    drop:  { d: 640, k: [{ transform: 'translateY(-150%) scale(.9,1.12)', opacity: 0 }, { opacity: 1, offset: .18 }, { transform: 'translateY(0) scale(.94,1.06)', offset: .52 }, { transform: 'translateY(4%) scale(1.26,.76)', offset: .64 }, { transform: 'translateY(-14%) scale(.94,1.07)', offset: .82 }, { transform: 'translateY(0) scale(1)' }] },
    spin:  { d: 600, k: [{ transform: 'rotate(-220deg) scale(0)', opacity: 0 }, { transform: 'rotate(18deg) scale(1.12)', opacity: 1, offset: .7 }, { transform: 'rotate(-6deg) scale(.97)', offset: .86 }, { transform: 'rotate(0) scale(1)' }] },
    jelly: { d: 680, k: [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.28,.74)', opacity: 1, offset: .36 }, { transform: 'scale(.8,1.22)', offset: .56 }, { transform: 'scale(1.1,.9)', offset: .72 }, { transform: 'scale(.96,1.04)', offset: .87 }, { transform: 'scale(1)' }] },
    zoom:  { d: 420, k: [{ transform: 'scale(2.5)', opacity: 0, filter: 'blur(7px)' }, { transform: 'scale(.95)', opacity: 1, filter: 'blur(0)', offset: .75 }, { transform: 'scale(1)', filter: 'blur(0)' }] },
    stamp: { d: 460, k: [{ transform: 'scale(2.7) rotate(-14deg)', opacity: 0 }, { transform: 'scale(.84) rotate(5deg)', opacity: 1, offset: .5 }, { transform: 'scale(1.07) rotate(-2deg)', offset: .72 }, { transform: 'scale(1) rotate(0)' }] },
  };
  const MOV = {
    hops:    { d: 560,  k: [{ transform: 'translateY(0) scale(1.08,.92)' }, { transform: 'translateY(-15%) scale(.96,1.05)', offset: .45, easing: 'cubic-bezier(.3,0,.6,1)' }, { transform: 'translateY(0) scale(1.08,.92)' }], g: [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.72)', opacity: .55, offset: .45 }, { transform: 'scale(1)', opacity: 1 }] },
    laugh:   { d: 240,  k: [{ transform: 'translateY(0) rotate(-3deg)' }, { transform: 'translateY(-6%) rotate(3deg)' }, { transform: 'translateY(0) rotate(-3deg)' }] },
    float:   { d: 1600, k: [{ transform: 'translateY(0)' }, { transform: 'translateY(-6%) rotate(2deg)' }, { transform: 'translateY(0)' }], ease: 'ease-in-out' },
    tilt:    { d: 1100, k: [{ transform: 'rotate(-9deg)' }, { transform: 'rotate(9deg)' }, { transform: 'rotate(-9deg)' }], ease: 'ease-in-out' },
    shake:   { d: 150,  k: [{ transform: 'translateX(-4.5%) rotate(-2deg)' }, { transform: 'translateX(4.5%) rotate(2deg)' }, { transform: 'translateX(-4.5%) rotate(-2deg)' }] },
    tremble: { d: 90,   k: [{ transform: 'translate(-1.6%,.8%)' }, { transform: 'translate(1.4%,-1%)' }, { transform: 'translate(-1%,1.2%)' }, { transform: 'translate(1.6%,-.6%)' }] },
    pulse:   { d: 820,  k: [{ transform: 'scale(1)' }, { transform: 'scale(1.13)', offset: .15 }, { transform: 'scale(1)', offset: .3 }, { transform: 'scale(1.09)', offset: .45 }, { transform: 'scale(1)', offset: .65 }, { transform: 'scale(1)' }] },
    wobble:  { d: 700,  k: [{ transform: 'rotate(-7deg) scale(1.03,.97)' }, { transform: 'rotate(7deg) scale(.97,1.03)' }, { transform: 'rotate(-7deg) scale(1.03,.97)' }], ease: 'ease-in-out' },
    sob:     { d: 380,  k: [{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(2.5%) scale(1.03,.97)', offset: .3 }, { transform: 'translateY(0) scale(1)' }] },
    flick:   { d: 900,  k: [{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(1.04,.98) rotate(-1.5deg)' }, { transform: 'scale(.98,1.04) rotate(1.5deg)' }, { transform: 'scale(1) rotate(0)' }], ease: 'ease-in-out' },
    none:    null,
  };
  const EXIT = [{ transform: 'scale(1) rotate(0)', opacity: 1 }, { transform: 'scale(1.12) rotate(-4deg)', opacity: 1, offset: .3 }, { transform: 'scale(0) rotate(24deg)', opacity: 0 }];
  const REDUCE = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  const FLAGS = { es: 'España', mx: 'México', ar: 'Argentina', co: 'Colombia', jp: 'Japón' };

  function markup(kind, data) {
    if (R[kind]) return faceSVG(kind);
    if (kind === 'mapa') return mapaHTML((data && data.city) || 'MADRID', (data && data.country) || 'España', (data && data.flag) || 'es');
    if (kind === 'numero') return numeroHTML((data && data.num) || '50%', (data && data.word) || 'DESCUENTO');
    if (kind === 'suscribir') return suscribirHTML();
    return objSVG(kind);
  }

  /* Reproduce una aparición completa dentro de "box" (posición relativa). */
  async function play(box, kind, o) {
    o = o || {};
    const info = R[kind] || OBJ[kind]; if (!info || !box) return;
    const hold = o.hold || 1700;
    const el = document.createElement('div');
    el.className = 'emo emo-' + kind + (o.cls ? ' ' + o.cls : '');
    el.innerHTML = `<i class="emo-gnd"></i><div class="emo-pos"><div class="emo-mv">${markup(kind, o.data)}</div></div>`;
    box.appendChild(el);
    const pos = el.querySelector('.emo-pos'), mv = el.querySelector('.emo-mv'), gnd = el.querySelector('.emo-gnd');
    const svg = el.querySelector('.emoji-svg');
    const handle = { el, stop: () => { try { el.remove(); } catch (_) {} } };
    if (o.onStart) o.onStart(handle);

    if (REDUCE) {
      el.classList.add('on'); if (svg) svg.classList.add('swap');
      await wait(Math.min(hold, 1600)); el.remove(); return;
    }
    const ent = ENT[o.ent || info.ent] || ENT.pop;
    gnd.animate([{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1)' }], { duration: ent.d, fill: 'forwards', easing: 'ease-out' });
    el.classList.add('on');
    await pos.animate(ent.k, { duration: ent.d, fill: 'forwards', easing: 'cubic-bezier(.22,.9,.3,1)' }).finished.catch(() => {});
    if (!el.isConnected) return;
    if (kind === 'suscribir') { el.classList.add('go'); setTimeout(() => el.classList.add('clicked'), 760); }
    if (kind === 'mapa') el.classList.add('drop');

    const m = MOV[o.mov || info.mov];
    let a1, a2;
    if (m) {
      a1 = mv.animate(m.k, { duration: m.d, iterations: Infinity, easing: m.ease || 'linear' });
      if (m.g) a2 = gnd.animate(m.g, { duration: m.d, iterations: Infinity });
    }
    if (svg) setTimeout(() => {
      if (!el.isConnected) return;
      svg.classList.add('swap');
      svg.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.1,.9)', offset: .35 }, { transform: 'scale(.97,1.03)', offset: .7 }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });
    }, Math.round(hold * .42));
    if (hold === Infinity) { handle.anims = [a1, a2]; return handle; }
    await wait(hold);
    if (!el.isConnected) return;
    gnd.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
    await pos.animate(EXIT, { duration: 320, fill: 'forwards', easing: 'cubic-bezier(.5,0,.75,0)' }).finished.catch(() => {});
    if (a1) a1.cancel(); if (a2) a2.cancel();
    el.remove();
  }

  w.DVEmoji = {
    faces: Object.keys(R).filter(k => k !== 'cool'),
    objects: Object.keys(OBJ),
    name: (k) => (R[k] || OBJ[k] || {}).name || k,
    svg: (k, o) => R[k] ? faceSVG(k, o) : markup(k, o),
    play,
    flags: FLAGS,
  };
})(window);
