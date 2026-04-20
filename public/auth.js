import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { loadVault } from './app.js'; 

const logOpen = document.getElementById('login-open-btn');
const logExec = document.getElementById('login-exec-btn');
const logOut = document.getElementById('logout-btn');
const logModal = document.getElementById('login-modal');
const userInfo = document.getElementById('user-info');
const vaultLink = document.getElementById('vault-link');

logOpen.onclick = () => logModal.classList.remove('hidden');

logExec.onclick = async () => {
    const e = document.getElementById('email').value;
    const p = document.getElementById('password').value;
    try {
        await signInWithEmailAndPassword(auth, e, p);
        logModal.classList.add('hidden');
    } catch (err) { alert("Error: " + err.message); }
};

logOut.onclick = () => signOut(auth);

let wasLoggedIn = false;
onAuthStateChanged(auth, (user) => {
    if (user) {
        wasLoggedIn = true; 
        logOpen.classList.add('hidden');
        userInfo.classList.remove('hidden');
        vaultLink.classList.remove('hidden');
        document.getElementById('user-display').innerText = user.email;
        
        // Load content and instantly reset page to top
        loadVault(); 
        window.scrollTo({ top: 0, behavior: 'instant' }); 
    } else {
        logOpen.classList.remove('hidden');
        userInfo.classList.add('hidden');
        vaultLink.classList.add('hidden');
        if (wasLoggedIn) { window.location.reload(); }
    }
});
