import { db, auth } from './firebase-config.js';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } 
from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const grid = document.getElementById('set-grid');
const detailModal = document.getElementById('detail-modal');
let currentSet = null;

function toggleBodyScroll(lock) { document.body.classList.toggle('modal-open', lock); }
function closeModal() { detailModal.classList.add('hidden'); toggleBodyScroll(false); }

function scrollWithOffset(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    const yOffset = -150; 
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
}

// ==================== ARCHIVE SEARCH ====================
async function getLegoSets(queryStr = 'Star Wars', clearGrid = true) {
    const archiveContainer = document.getElementById('archive-sets-container');
    const targetContainer = archiveContainer || grid;
    if (clearGrid) targetContainer.innerHTML = "<p style='text-align:center; padding:40px; grid-column: 1/-1;'>Searching LEGO archive...</p>";

    const key = "47757a174af36474a1bb3087c1cc4f73"; 
    const targetUrl = `https://rebrickable.com/api/v3/lego/sets/?key=${key}&search=${encodeURIComponent(queryStr)}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

    try {
        const res = await fetch(proxyUrl);
        const data = await res.json();
        if (clearGrid) targetContainer.innerHTML = ""; 
        renderGrid(data.results || [], false, targetContainer);
    } catch (err) { console.error(err); }
}

// ==================== SEARCH BAR BUILDER ====================
function createSearchBar(container, titleText = "Archive Browser") {
    const searchSection = document.createElement('div');
    searchSection.id = "archive-anchor";
    searchSection.style.cssText = "grid-column: 1 / -1; margin: 40px 0 20px; text-align: center;";
    searchSection.innerHTML = `
        <h2 style="color: var(--lego-red); margin-bottom: 20px; font-size: 2rem;">${titleText}</h2>
        <div class="search-bar" style="display: flex; justify-content: center; gap: 10px; max-width: 600px; margin: 0 auto 30px; position: relative;">
            <input type="text" id="search-input" placeholder="Search sets (e.g. 1990 Space)..." 
                   style="flex: 1; padding: 12px 20px; border-radius: 25px; border: 1px solid #ccc; font-size: 1.05rem;">
            <button id="search-btn" class="orange-btn" style="border-radius: 25px; width: 50px;"><i class="fas fa-search"></i></button>
            <div id="search-suggestions" class="search-suggestions" style="display: none;">
                <div class="suggestion-header">Popular Categories</div>
            </div>
        </div>
    `;
    container.appendChild(searchSection);

    const sInp = document.getElementById('search-input');
    const suggestionsBox = document.getElementById('search-suggestions');
    const popularSuggestions = ["Star Wars", "City", "Ninjago", "Harry Potter", "Technic"];

    function renderSuggestions() {
        suggestionsBox.innerHTML = `<div class="suggestion-header">Popular Categories</div>`;
        popularSuggestions.forEach(term => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = term;
            item.style.cssText = `padding: 12px 18px; cursor: pointer; border-bottom: 1px solid #eee;`;
            item.onclick = () => { sInp.value = term; suggestionsBox.style.display = 'none'; getLegoSets(term, true); };
            suggestionsBox.appendChild(item);
        });
    }

    sInp.onfocus = () => { renderSuggestions(); suggestionsBox.style.display = 'block'; };
    const performSearch = () => { if (sInp.value.trim()) { suggestionsBox.style.display = 'none'; getLegoSets(sInp.value.trim(), true); } };
    document.getElementById('search-btn').onclick = performSearch;
    sInp.onkeypress = (e) => { if (e.key === 'Enter') performSearch(); };
    document.addEventListener('click', (e) => { if (!searchSection.contains(e.target)) suggestionsBox.style.display = 'none'; });
}

function renderGrid(sets, isVaultView, container = grid) {
    if (isVaultView && sets.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.cssText = "text-align:center; padding:40px 20px; color:#555; grid-column: 1 / -1;";
        emptyMsg.innerHTML = `<h3 style="color: var(--lego-red);">Your Vault is Empty</h3>`;
        container.appendChild(emptyMsg);
        return;
    }
    sets.forEach(s => {
        const div = document.createElement('div');
        div.className = 'card';
        const imgUrl = isVaultView ? (s.img || s.set_img_url) : s.set_img_url;
        div.innerHTML = `<img src="${imgUrl || 'https://placehold.co/300x200'}" alt="${s.name}"><h3>${s.name}</h3><p>${s.year} • ${s.num_parts || '?'} parts</p>`;
        div.onclick = () => openModal(s, isVaultView);
        container.appendChild(div);
    });
}

function openModal(set, isVaultView) {
    currentSet = set;
    document.getElementById('m-img').src = isVaultView ? (set.img || set.set_img_url) : set.set_img_url;
    document.getElementById('m-title').innerText = set.name;
    document.getElementById('m-meta').innerText = `Year: ${set.year} | Parts: ${set.num_parts || '?'}`;

    const bobZone = document.getElementById('bob-zone');
    const guestZone = document.getElementById('guest-zone');
    const noteField = document.getElementById('build-log');
    const addBtn = document.getElementById('add-to-vault-btn');
    const updateBtn = document.getElementById('update-log-btn');
    const removeBtn = document.getElementById('remove-vault-btn');

    if (auth.currentUser) {
        bobZone.classList.remove('hidden'); guestZone.classList.add('hidden');
        if (isVaultView) {
            noteField.value = set.buildLog || ""; addBtn.classList.add('hidden');
            updateBtn.classList.remove('hidden'); removeBtn.classList.remove('hidden');
            updateBtn.onclick = () => updateSet(set.docId); removeBtn.onclick = () => removeSet(set.docId);
        } else {
            noteField.value = ""; addBtn.classList.remove('hidden');
            updateBtn.classList.add('hidden'); removeBtn.classList.add('hidden');
            addBtn.onclick = saveSet;
        }
    } else {
        bobZone.classList.add('hidden'); guestZone.classList.remove('hidden');
        document.getElementById('guest-login-trigger').onclick = () => { closeModal(); document.getElementById('login-modal').classList.remove('hidden'); }
    }
    detailModal.classList.remove('hidden'); toggleBodyScroll(true);
}

async function saveSet() {
    if (!auth.currentUser) return;
    await addDoc(collection(db, "vault"), { uid: auth.currentUser.uid, name: currentSet.name, img: currentSet.set_img_url, year: currentSet.year, num_parts: currentSet.num_parts || 0, buildLog: document.getElementById('build-log').value.trim() });
    closeModal(); await loadVault(); scrollWithOffset('my-vault-anchor'); 
}

async function updateSet(docId) {
    await updateDoc(doc(db, "vault", docId), { buildLog: document.getElementById('build-log').value.trim() });
    closeModal(); loadVault();
}

async function removeSet(id) {
    if (confirm("Remove this set?")) { await deleteDoc(doc(db, "vault", id)); closeModal(); loadVault(); }
}

export async function loadVault() {
    if (!auth.currentUser) return;
    grid.innerHTML = "";
    try {
        const q = query(collection(db, "vault"), where("uid", "==", auth.currentUser.uid));
        const snap = await getDocs(q);
        const vaultSets = [];
        snap.forEach(docSnap => vaultSets.push({ ...docSnap.data(), docId: docSnap.id }));

        const vaultHeader = document.createElement('div');
        vaultHeader.id = "my-vault-anchor"; 
        vaultHeader.style.cssText = "margin-bottom: 25px; text-align: center; width: 100%; grid-column: 1 / -1;";
        vaultHeader.innerHTML = `<h2 style="color: var(--lego-red); font-size: 2.2rem;">My Vault</h2>`;
        grid.appendChild(vaultHeader);

        renderGrid(vaultSets, true);
        const divider = document.createElement('div');
        divider.style.cssText = "grid-column: 1/-1; border-top: 2px solid #ddd; margin-top: 40px;";
        grid.appendChild(divider);

        createSearchBar(grid, "Full Archive");
        const archiveSetsContainer = document.createElement('div');
        archiveSetsContainer.id = "archive-sets-container";
        archiveSetsContainer.style.cssText = "display: contents;"; 
        grid.appendChild(archiveSetsContainer);
        getLegoSets('Star Wars', false);
    } catch (err) { console.error(err); }
}

function initLoggedOut() {
    grid.innerHTML = "";
    createSearchBar(grid, "Archive Browser");
    const container = document.createElement('div');
    container.id = "archive-sets-container";
    container.style.cssText = "display: contents;";
    grid.appendChild(container);
    getLegoSets('Star Wars', false);
}

window.addEventListener('DOMContentLoaded', () => initLoggedOut());

document.getElementById('vault-link').onclick = async (e) => {
    e.preventDefault(); if (auth.currentUser) { await loadVault(); scrollWithOffset('my-vault-anchor'); }
};

const archiveLink = document.querySelector('a[href="#gallery"]');
if (archiveLink) { archiveLink.onclick = (e) => { e.preventDefault(); scrollWithOffset('archive-anchor'); }; }