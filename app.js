/* ---------- Demo data with coordinates ---------- */
const spotsData = [
  { id:1, title:'Spot 1A (AEB Front)', campus:'BSU - Alangilan', addr:'Neptune St.', reserved:false, lat:13.755, lng:121.052 },
  { id:2, title:'Spot 2A (AEB Front)', campus:'BSU - Alangilan', addr:'Neptune St.', reserved:false, lat:13.7555, lng:121.0525 },
  { id:3, title:'Lot A-01', campus:'North', addr:'Mercury St.', reserved:false, lat:13.754, lng:121.051 },
  { id:4, title:'Lot B-12', campus:'South', addr:'Mars St.', reserved:false, lat:13.753, lng:121.053 },
  { id:5, title:'Spot 1S (Steer Hub)', campus:'BSU - Alangilan', addr:'Neptune St.', reserved:false, lat:13.756, lng:121.054 },
  { id:6, title:'Lot C-05', campus:'East', addr:'Venus St.', reserved:true, lat:13.7545, lng:121.0535 }
];

/* ---------- favorites persistence ---------- */
const FAVORITES_KEY = 'sparx_favs_v2';
function loadFavorites(){ try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') } catch(e){ return [] } }
function saveFavorites(arr){ localStorage.setItem(FAVORITES_KEY, JSON.stringify(arr)) }
let favorites = loadFavorites();

/* ---------- App state ---------- */
const state = {
  user: null, // {name,email}
  selectedSpot: null,
  reservations: [] // {id, spotId, name, vehicle, date, ref}
};

/* ---------- Leaflet map ---------- */
let map, markers = {};
function initMap(){
  try {
    if(!document.getElementById('map')) return;
    map = L.map('map', { zoomControl: false, attributionControl: false }).setView([13.755, 121.052], 16);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd' }).addTo(map);
    spotsData.forEach(s => {
      if(s.lat && s.lng){
        const m = L.circleMarker([s.lat, s.lng], { radius: 8, fillColor: s.reserved ? '#dc2626' : '#2563eb', color: '#ffffff', weight: 2, opacity: 1, fillOpacity: 0.9 }).addTo(map).bindPopup(`<strong>${escapeHtml(s.title)}</strong><br>${escapeHtml(s.campus)}`);
        m.on('click', () => { selectSpot(s.id); m.openPopup(); });
        markers[s.id] = m;
      }
    });
  } catch(e){
    console.warn('Map init failed', e);
    document.getElementById('map').innerHTML = '<div class="muted center" style="height:100%;background:#f8fafc">Map unavailable</div>';
  }
}

/* ---------- Helpers: navigation / UI ---------- */
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if(el) el.classList.add('active');
  if(id !== 'screen-login') { history.replaceState(null, '', '#' + id.replace('screen-','')); } else { history.replaceState(null, '', '#'); }
}

function openOverlay(htmlContent){
  const overlay = document.getElementById('overlay'); const content = document.getElementById('overlayContent');
  content.innerHTML = ''; content.appendChild(htmlContent); overlay.classList.add('active'); overlay.setAttribute('aria-hidden','false');
}

function closeOverlay(){ const overlay = document.getElementById('overlay'); overlay.classList.remove('active'); overlay.setAttribute('aria-hidden','true'); }

/* ---------- Escape HTML ---------- */
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ---------- Render spots list ---------- */
const spotsGrid = document.getElementById('spotsGrid');
const spotCountEl = document.getElementById('spotCount');

function renderSpots(filter=''){
  spotsGrid.innerHTML = '';
  const list = spotsData.filter(s => (s.title + ' ' + s.campus + ' ' + s.addr).toLowerCase().includes(filter.toLowerCase()));

  // Empty State Illustration
  if(list.length === 0) {
      spotsGrid.innerHTML = `
        <div style="grid-column:1/-1;" class="empty-illu-container">
             <svg class="illu-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="40" stroke="#93C5FD" stroke-width="2" stroke-dasharray="4 4"/>
                <path d="M35 50L45 60L65 40" stroke="#93C5FD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M30 30L70 70" stroke="#93C5FD" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
                <path d="M70 30L30 70" stroke="#93C5FD" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
             </svg>
             <div class="muted" style="margin-top:16px;font-weight:600">No parking spots found.</div>
             <div class="small-muted">Try adjusting your search terms.</div>
        </div>`;
  }
  list.forEach(s => {
    const favActive = favorites.includes(s.id);
    const node = document.createElement('div');
    node.className = 'spot';
    node.tabIndex = 0;
    node.innerHTML = `
      <div class="icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17l6-6-6-6"/><path d="M20 17l-6-6 6-6"/><path d="M4 17l6-6-6-6"/></svg>
      </div>
      <div class="meta">
        <h4>${escapeHtml(s.title)}</h4>
        <p>${escapeHtml(s.campus)} · ${escapeHtml(s.addr)}</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
        <button class="fav-btn ${favActive ? 'active' : ''}" data-id="${s.id}" title="Favorite" aria-label="favorite">${favActive ? '★' : '☆'}</button>
        <div class="status ${s.reserved ? 'status-reserved' : 'status-available'}">${s.reserved ? 'Reserved' : 'Available'}</div>
      </div>
    `;
    node.addEventListener('click', (e) => { if(e.target.closest('.fav-btn')) return; selectSpot(s.id); });
    node.addEventListener('keydown', (e) => { if(e.key === 'Enter') selectSpot(s.id) });
    spotsGrid.appendChild(node);
    node.querySelectorAll('.fav-btn').forEach(b => {
      b.addEventListener('click', (ev) => { ev.stopPropagation(); const id = Number(b.dataset.id); toggleFav(id); b.classList.toggle('active'); b.textContent = favorites.includes(id) ? '★' : '☆'; renderFavorites(); });
    });
  });

  const availableCount = spotsData.filter(s => !s.reserved).length;
  spotCountEl.textContent = availableCount;

  Object.keys(markers).forEach(id => {
    const mid = Number(id); const marker = markers[mid]; const spot = spotsData.find(s => s.id === mid);
    if(!marker || !spot) return;
    marker.setStyle({ fillColor: spot.reserved ? '#dc2626' : '#2563eb', weight: favorites.includes(mid) ? 4 : 2 });
  });
}

/* ---------- Favorites ---------- */
function toggleFav(id){ if(favorites.includes(id)){ favorites = favorites.filter(x => x !== id); } else { favorites.push(id); } saveFavorites(favorites); }
function renderFavorites(){
  const favList = document.getElementById('favoritesList'); favList.innerHTML = '';
  if(favorites.length === 0){ favList.innerHTML = '<div class="muted small">No favorite spots saved.</div>'; return; }
  favorites.forEach(fid => {
    const s = spotsData.find(x => x.id === fid); if(!s) return;
    const item = document.createElement('div'); item.className = 'fav-item';
    item.innerHTML = `<div style="font-size:14px;font-weight:500">${escapeHtml(s.title)}</div><div style="display:flex;gap:8px"><button class="link-like btnViewFav" data-id="${fid}" style="font-size:13px">View on Map</button></div>`;
    favList.appendChild(item);
  });
  favList.querySelectorAll('.btnViewFav').forEach(b => {
    b.addEventListener('click', (e) => { const id = Number(e.currentTarget.dataset.id); if(markers[id]) { map.setView(markers[id].getLatLng(), 18, { animate:true }); markers[id].openPopup(); const spotEl = Array.from(document.querySelectorAll('.spot')).find(el => el.innerHTML.includes(spotsData.find(s=>s.id===id).title)); if(spotEl) spotEl.scrollIntoView({behavior:'smooth', block:'center'}); } });
  });
}

/* ---------- Selection flow ---------- */
function selectSpot(id){
  const spot = spotsData.find(x => x.id === id); if(!spot) return;
  if(state.user) document.getElementById('rname').value = state.user.name;
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); document.getElementById('rdate').valueAsDate = tomorrow;
  state.selectedSpot = spot; document.getElementById('reserveSpotName').textContent = `${spot.title} — ${spot.campus}`;
  if(map && markers[id]) { map.setView(markers[id].getLatLng(), 17, { animate:true }); markers[id].openPopup(); }
  showScreen('screen-reserve');
}

/* ---------- Live clock ---------- */
function updateClock(){ const el = document.getElementById('liveClock'); const now = new Date(); el.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}); } setInterval(updateClock, 1000); updateClock();

/* ---------- Login flow ---------- */
const loginBtn = document.getElementById('loginBtn');
function applyUser(user){
  state.user = user; const appContainer = document.getElementById('app');
  if(user){
      document.getElementById('acctName').textContent = user.name; document.getElementById('acctEmail').textContent = user.email;
      appContainer.classList.add('logged-in'); showScreen('screen-choose'); renderSpots(); setTimeout(() => { if(map) map.invalidateSize(); }, 400);
  } else {
      document.getElementById('acctName').textContent = ''; document.getElementById('acctEmail').textContent = '';
      appContainer.classList.remove('logged-in'); showScreen('screen-login');
  }
}

loginBtn.addEventListener('click', (e) => {
  e.preventDefault(); const email = document.getElementById('email').value.trim(); const pw = document.getElementById('password').value.trim();
  if(!email || !pw || !email.includes('@')){ alert('Please enter a valid email and password.'); return; }
  const tpl = document.getElementById('confirmTemplate'); const clone = tpl.content.cloneNode(true); clone.querySelector('#ovTitle').textContent = 'Verifying Credentials'; clone.querySelector('#ovMessage').textContent = 'Securely signing you in...'; openOverlay(clone);
  setTimeout(() => { closeOverlay(); const nameParts = email.split('@')[0].split('.'); const displayName = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '); applyUser({name: displayName || 'Authorized User', email}); document.getElementById('email').value = ''; document.getElementById('password').value = ''; }, 1000);
});

/* ---------- Reserve flow ---------- */
document.getElementById('backToChoose').addEventListener('click', () => showScreen('screen-choose'));
document.getElementById('backFromManage').addEventListener('click', () => showScreen('screen-choose'));
document.getElementById('confirmReserveBtn').addEventListener('click', (e) => {
  e.preventDefault(); const name = document.getElementById('rname').value.trim(); const vehicle = document.getElementById('rvehicle').value.trim(); const date = document.getElementById('rdate').value;
  if(!state.selectedSpot) { showScreen('screen-choose'); return; } if(state.selectedSpot.reserved) { alert('This spot is already reserved.'); return; } if(!name || !vehicle || !date){ alert('Please fill in all reservation details.'); return; }
  const tpl = document.getElementById('confirmTemplate'); const clone = tpl.content.cloneNode(true); clone.querySelector('#ovTitle').textContent = 'Processing Reservation'; clone.querySelector('#ovMessage').textContent = 'Finalizing your booking details...'; openOverlay(clone);
  setTimeout(() => {
    const ref = 'SPX-' + Math.random().toString(36).substring(2,8).toUpperCase(); const res = { id: Date.now(), spotId: state.selectedSpot.id, name, vehicle, date, ref }; state.reservations.push(res);
    const spot = spotsData.find(s => s.id === state.selectedSpot.id); if(spot) spot.reserved = true;
    renderSpots(document.getElementById('searchInput').value);
    document.getElementById('confSpot').textContent = state.selectedSpot.title; document.getElementById('confCampus').textContent = state.selectedSpot.campus + ' · ' + state.selectedSpot.addr; document.getElementById('confName').textContent = res.name + ' (' + res.vehicle + ')'; document.getElementById('confDate').textContent = new Date(res.date).toLocaleDateString(undefined, {weekday:'long', year:'numeric', month:'long', day:'numeric'}); document.getElementById('confRef').textContent = res.ref;
    closeOverlay(); showScreen('screen-confirm'); renderMyReservations(); document.getElementById('rvehicle').value = '';
  }, 1500);
});

/* ---------- Confirmation actions ---------- */
document.getElementById('btnDone').addEventListener('click', () => showScreen('screen-choose'));
document.getElementById('btnCancelRes').addEventListener('click', () => { const ref = document.getElementById('confRef').textContent; confirmCancelation(ref, () => showScreen('screen-choose')); });

/* ---------- Cancel / Manage list ---------- */
const myReservationsEl = document.getElementById('myReservations');
function renderMyReservations(){
  myReservationsEl.innerHTML = ''; if(state.reservations.length === 0){ myReservationsEl.innerHTML = '<div class="panel center muted" style="padding:40px">You have no active reservations.</div>'; return; }
  state.reservations.slice().reverse().forEach(r => {
    const spot = spotsData.find(s => s.id === r.spotId) || {}; const card = document.createElement('div'); card.className = 'card-compact panel'; card.style.marginBottom = '16px';
    card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px"><div><div style="font-weight:800;font-size:17px">${escapeHtml(spot.title || 'Unknown Spot')}</div><div class="muted" style="margin-top:4px">${new Date(r.date).toLocaleDateString()} · Ref: <span style="font-family:monospace">${escapeHtml(r.ref)}</span></div><div class="small-muted" style="margin-top:8px">Vehicle: ${escapeHtml(r.vehicle)}</div></div><div><button class="btn btn-ghost btnCancel" data-ref="${r.ref}" style="color:#dc2626;border-color:#fee2e2;padding:8px 12px;font-size:13px">Cancel</button></div></div>`;
    myReservationsEl.appendChild(card);
  });
  myReservationsEl.querySelectorAll('.btnCancel').forEach(b => { b.addEventListener('click', (e) => { confirmCancelation(e.currentTarget.dataset.ref); }); });
}

function confirmCancelation(ref, callback){
    const wrap = document.createElement('div'); wrap.innerHTML = `<h3 style="color:#dc2626">Cancel Reservation?</h3><p class="muted">Are you sure you want to cancel booking reference <strong>${ref}</strong>? This action cannot be undone.</p><div style="display:flex;gap:12px;margin-top:24px;justify-content:flex-end"><button id="cancelNo" class="btn btn-ghost">Keep Reservation</button><button id="cancelYes" class="btn btn-primary" style="background:#dc2626;color:white">Yes, Cancel It</button></div>`;
    openOverlay(wrap); document.getElementById('cancelNo').addEventListener('click', closeOverlay); document.getElementById('cancelYes').addEventListener('click', () => { cancelReservationByRef(ref); closeOverlay(); if(callback) callback(); });
}

function cancelReservationByRef(ref){
  const idx = state.reservations.findIndex(r => r.ref === ref); if(idx === -1) return;
  const r = state.reservations[idx]; state.reservations.splice(idx, 1); const spot = spotsData.find(s => s.id === r.spotId); if(spot) spot.reserved = false;
  renderSpots(document.getElementById('searchInput').value); renderMyReservations();
}

/* ---------- Logout ---------- */
document.getElementById('btnLogout').addEventListener('click', () => {
  const wrap = document.createElement('div'); wrap.innerHTML = `<h3>Confirm Logout</h3><p class="muted">Are you sure you want to end your session?</p><div style="display:flex;gap:12px;margin-top:24px;justify-content:flex-end"><button id="logoutNo" class="btn btn-ghost">Stay Logged In</button><button id="logoutYes" class="btn btn-primary">Logout</button></div>`;
  openOverlay(wrap); document.getElementById('logoutNo').addEventListener('click', closeOverlay); document.getElementById('logoutYes').addEventListener('click', () => { closeOverlay(); applyUser(null); });
});

/* ---------- Misc & Init ---------- */
document.getElementById('refreshBtn').addEventListener('click', () => { const btn = document.getElementById('refreshBtn'); btn.style.transition = 'transform 0.5s ease'; btn.style.transform = 'rotate(360deg)'; setTimeout(() => btn.style.transform = 'none', 500); renderSpots(document.getElementById('searchInput').value); renderMyReservations(); if(map) map.invalidateSize(); });
document.getElementById('helpBtn').addEventListener('click', () => { const wrap = document.createElement('div'); wrap.innerHTML = `<h3>System Help</h3><p class="muted">This is a demo of the SPARX Smart Parking System interface.</p><div style="margin-top:24px;text-align:right"><button id="closeHelp" class="btn btn-ghost">Close</button></div>`; openOverlay(wrap); document.getElementById('closeHelp').addEventListener('click', closeOverlay); });
document.getElementById('btnProfile').addEventListener('click', () => { const wrap = document.createElement('div'); wrap.innerHTML = `<h3>User Profile</h3><p class="muted">Name: <strong>${state.user?.name}</strong></p><p class="muted">Email: <strong>${state.user?.email}</strong></p><div style="margin-top:24px;text-align:right"><button id="closeProf" class="btn btn-ghost">Close</button></div>`; openOverlay(wrap); document.getElementById('closeProf').addEventListener('click', closeOverlay); });
document.getElementById('manageBtn').addEventListener('click', () => { renderMyReservations(); showScreen('screen-manage'); });
document.getElementById('searchInput').addEventListener('input', (e) => renderSpots(e.target.value));
document.getElementById('searchBtn').addEventListener('click', () => { const q = document.getElementById('searchInput').value; renderSpots(q); });
document.getElementById('clearFavs').addEventListener('click', () => { if(favorites.length === 0) return; if(!confirm('Are you sure you want to clear your favorite spots?')) return; favorites = []; saveFavorites(favorites); renderFavorites(); renderSpots(document.getElementById('searchInput').value); });

function init(){ applyUser(null); initMap(); renderSpots(); renderMyReservations(); renderFavorites(); }
document.addEventListener('keydown', (e) => { if(e.key === 'Escape') { closeOverlay(); } }); window.addEventListener('load', init);