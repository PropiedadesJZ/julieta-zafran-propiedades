const ASSETS = '';
const cards = document.getElementById('cards');
const detail = document.getElementById('detail');
const backdrop = document.getElementById('detail-backdrop');
const detailBody = document.getElementById('detail-body');
const categoryFilters = [...document.querySelectorAll('[data-category]')];
const operationFilters = [...document.querySelectorAll('[data-operation]')];
const operationTools = document.querySelector('.operation-tools');
const featuredOpen = document.getElementById('featured-open');
let properties = [];
let activeCategory = 'lagunas';
let activeOperation = 'comprar';
let previousFocus = null;

function whatsapp(property) {
  const message = property
    ? `Hola Juli, vi ${property.title} en tu página y quería consultarte por esta propiedad.`
    : 'Hola Juli, vi tu página y quería hacerte una consulta.';
  return `https://wa.me/541131652632?text=${encodeURIComponent(message)}`;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function imageSrc(name) {
  return /^https:\/\/imgar\.zonapropcdn\.com\//.test(name) ? name : ASSETS + name;
}

function categoryOf(property) {
  const value = String(property.category || property.type || '').toLowerCase();
  if (value.includes('lote') || value.includes('terreno')) return 'lote';
  if (value.includes('village')) return 'village';
  if (value.includes('lagunas')) return 'lagunas';
  if (value.includes('departamento')) return 'departamento';
  if (value.includes('cochera') || value.includes('garage')) return 'cochera';
  if (value.includes('casa')) return 'casa';
  return '';
}

function matchesOperation(property) {
  if (activeCategory === 'lote' || activeCategory === 'cochera') return true;
  const value = [...(property.filters || []), property.operation || ''].join(' ').toLowerCase();
  return activeOperation === 'comprar' ? /venta|compr/.test(value) : /alquil/.test(value);
}

function renderCards() {
  cards.replaceChildren();
  const shown = properties.filter(p => categoryOf(p) === activeCategory && matchesOperation(p));
  for (const p of shown) {
    const card = el('article', 'card');
    const imageButton = el('button', 'card-image'); imageButton.type = 'button';
    imageButton.setAttribute('aria-label', `Ver ${p.title}`);
    const image = el('img'); image.src = imageSrc(p.images[0]); image.alt = `${p.title}, ${p.location}`; image.loading = 'lazy';
    imageButton.append(image, el('span', 'card-badge', p.operation));
    imageButton.addEventListener('click', () => openDetail(p));
    const copy = el('div', 'card-text');
    const meta = el('div', 'card-meta'); meta.append(document.createTextNode(p.location), el('span'), document.createTextNode(p.type));
    const title = el('h3', '', p.title);
    const facts = el('p', 'card-facts', p.details.slice(0, 3).join('  ·  '));
    const open = el('button', 'card-open'); open.type = 'button'; open.innerHTML = 'Ver propiedad <span aria-hidden="true">↗</span>';
    open.setAttribute('aria-label', `Ver ficha de ${p.title}`); open.addEventListener('click', () => openDetail(p));
    copy.append(meta, title, facts);
    if (p.price) copy.append(el('p', 'card-price', p.price));
    copy.append(open); card.append(imageButton, copy); cards.append(card);
  }
  if (!shown.length) {
    const empty = el('div', 'empty');
    const kind = {lote:'lotes',casa:'casas',lagunas:'Lagunas',village:'Village',departamento:'departamentos',cochera:'cocheras'}[activeCategory];
    const withoutOperation = activeCategory === 'lote' || activeCategory === 'cochera';
    const subject = withoutOperation ? kind : `${kind} para ${activeOperation}`;
    const heading = withoutOperation ? `Próximamente, ${kind}` : `Próximamente, ${kind} en ${activeOperation === 'comprar' ? 'venta' : 'alquiler'}`;
    empty.append(el('span', 'empty-symbol', '✦'), el('h3', '', heading), el('p', '', 'Estoy preparando las próximas opciones. Mientras tanto, contame qué estás buscando y lo vemos juntos.'));
    const link = el('a', 'empty-link', 'Escribime por WhatsApp ↗');
    link.href = `https://wa.me/541131652632?text=${encodeURIComponent(`Hola Juli, estoy buscando ${subject}. ¿Podemos hablar?`)}`;
    link.target = '_blank'; link.rel = 'noopener noreferrer';
    empty.append(link); cards.append(empty);
  }
}

function openDetail(p, updateHash = true) {
  previousFocus = document.activeElement;
  detailBody.replaceChildren();
  const cover = el('img', 'detail-cover'); cover.src = imageSrc(p.images[0]); cover.alt = `${p.title}, imagen principal`;
  const kicker = el('p', 'detail-kicker', `${p.operation} · ${p.location}`);
  const title = el('h2', '', p.title); title.id = 'detail-title';
  const summary = el('p', 'detail-summary', p.summary);
  const price = p.price ? el('p', 'detail-price', p.price) : null;
  const facts = el('ul', 'detail-facts'); for (const fact of p.details) facts.append(el('li', '', fact));
  const cta = el('a', 'detail-cta', 'Consultar esta propiedad por WhatsApp ↗');
  cta.href = whatsapp(p); cta.target = '_blank'; cta.rel = 'noopener noreferrer';
  const gallery = el('div', 'detail-gallery');
  for (let i = 1; i < p.images.length; i++) {
    const img = el('img'); img.src = imageSrc(p.images[i]); img.alt = `${p.title}, foto ${i + 1}`; img.loading = 'lazy'; gallery.append(img);
  }
  detailBody.append(cover, kicker, title);
  if (price) detailBody.append(price);
  detailBody.append(summary, facts, cta, gallery, el('p', 'detail-note', 'Precio, expensas, medidas y disponibilidad a confirmar con Julieta.'));
  detail.hidden = backdrop.hidden = false; document.body.classList.add('no-scroll'); detail.scrollTop = 0;
  detail.querySelector('.close-detail').focus();
  if (updateHash) history.pushState(null, '', `#propiedad/${p.id}`);
}

function closeDetail(updateHash = true) {
  if (detail.hidden) return;
  detail.hidden = backdrop.hidden = true; document.body.classList.remove('no-scroll');
  if (updateHash) history.pushState(null, '', '#propiedades');
  if (previousFocus?.isConnected) previousFocus.focus();
}

function syncHash() {
  if (location.hash.startsWith('#propiedad/')) {
    const id = decodeURIComponent(location.hash.slice('#propiedad/'.length));
    const match = properties.find(p => p.id === id);
    if (match) openDetail(match, false); else closeDetail(false);
  } else closeDetail(false);
}

categoryFilters.forEach(button => button.addEventListener('click', () => {
  activeCategory = button.dataset.category;
  categoryFilters.forEach(f => { const selected = f === button; f.classList.toggle('active', selected); f.setAttribute('aria-pressed', String(selected)); });
  operationTools.hidden = activeCategory === 'lote' || activeCategory === 'cochera';
  renderCards();
}));
operationFilters.forEach(button => button.addEventListener('click', () => {
  activeOperation = button.dataset.operation;
  operationFilters.forEach(f => { const selected = f === button; f.classList.toggle('active', selected); f.setAttribute('aria-pressed', String(selected)); });
  renderCards();
}));
featuredOpen.addEventListener('click', () => { if (properties.length) openDetail(properties[0]); });
detail.querySelector('.close-detail').addEventListener('click', () => closeDetail());
backdrop.addEventListener('click', () => closeDetail());
document.addEventListener('keydown', event => {
  if (detail.hidden) return;
  if (event.key === 'Escape') closeDetail();
  if (event.key === 'Tab') {
    const focusable = [...detail.querySelectorAll('button, a[href]')];
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
window.addEventListener('hashchange', syncHash);
window.addEventListener('popstate', syncHash);

fetch('properties.json').then(response => { if (!response.ok) throw new Error('No se pudo cargar el catálogo'); return response.json(); })
  .then(data => { properties = data; document.querySelector('.catalog-note').hidden = !properties.length; renderCards(); syncHash(); })
  .catch(() => { cards.append(el('p', 'empty', 'No pudimos cargar las propiedades. Por favor, volvé a intentarlo más tarde.')); });
