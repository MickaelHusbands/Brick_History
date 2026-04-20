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
