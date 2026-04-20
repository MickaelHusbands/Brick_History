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
