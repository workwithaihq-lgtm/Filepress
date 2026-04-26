// --- GLOBAL STATE & CREDITS ---
const MAX_CREDITS = 5;
let currentCredits = parseInt(localStorage.getItem('os_cred_v6'));
if (isNaN(currentCredits)) currentCredits = MAX_CREDITS;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateCreditUI();
    injectModals();
    
    // Register SW
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
});

function updateCreditUI() {
    const el = document.getElementById('creditCounter');
    if(el) el.innerText = currentCredits;
    localStorage.setItem('os_cred_v6', currentCredits);
}

function initTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        if(document.getElementById('themeIcon')) document.getElementById('themeIcon').innerText = '☀️';
    } else {
        document.documentElement.classList.remove('dark');
        if(document.getElementById('themeIcon')) document.getElementById('themeIcon').innerText = '🌙';
    }
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    initTheme();
}

// --- UI TOASTS ---
function showToast(msg, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'fixed bottom-6 right-6 z-[999] flex flex-col gap-3 pointer-events-none items-end';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const colors = type === 'success' ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700';
    toast.className = `px-6 py-4 rounded-xl font-bold shadow-2xl text-white text-sm transition-all duration-300 transform translate-y-10 opacity-0 border ${colors}`;
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-10', 'opacity-0'), 10);
    setTimeout(() => { toast.classList.add('translate-y-10', 'opacity-0'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// --- EXECUTION & AD LOGIC ---
function executeTool(cost, btnElement, logicCallback) {
    if (currentCredits < cost) {
        document.getElementById('rewardModal').classList.remove('hidden');
        return;
    }
    
    const originalText = btnElement.innerText;
    btnElement.innerText = "⏳ Processing...";
    btnElement.disabled = true;
    
    logicCallback().then((success) => {
        if (success) {
            currentCredits -= cost;
            updateCreditUI();
        }
    }).catch(err => {
        console.error(err); showToast("Execution Error", "error");
    }).finally(() => {
        btnElement.innerText = originalText; btnElement.disabled = false;
    });
}

function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.target = "_blank";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    
    // Trigger Post-Download Ad Interstitial
    setTimeout(() => {
        document.getElementById('interstitialModal').classList.remove('hidden');
        setTimeout(() => document.getElementById('closeAdBtn').classList.remove('hidden'), 3000); // Allow close after 3s
    }, 1000);
}

// --- DYNAMIC MODAL INJECTION ---
function injectModals() {
    const modalsHTML = `
    <div id="rewardModal" class="fixed inset-0 bg-gray-900/90 backdrop-blur-md hidden items-center justify-center z-[100] px-4">
        <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border border-gray-200 dark:border-gray-700">
            <h2 class="text-2xl font-black mb-2 text-gray-900 dark:text-white">Engine Depleted</h2>
            <p class="text-gray-500 mb-6 text-sm">Watch a brief sponsor payload to refresh your credits.</p>
            <div class="w-full h-32 bg-gray-100 dark:bg-gray-900 rounded-lg mb-6 flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-700">
                <span class="text-blue-500 font-black" id="rewardTimer">Sponsor Unit</span>
            </div>
            <button onclick="playRewardAd()" id="playAdBtn" class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">Watch Ad</button>
            <button onclick="document.getElementById('rewardModal').classList.add('hidden')" class="mt-4 text-gray-400 text-sm font-bold w-full">Abort</button>
        </div>
    </div>
    
    <div id="interstitialModal" class="fixed inset-0 bg-gray-900/95 backdrop-blur-lg hidden items-center justify-center z-[100] px-4">
        <div class="w-full max-w-lg h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl flex flex-col items-center justify-center relative border border-gray-700 shadow-2xl">
            <span class="text-gray-500 font-bold mb-4">Advertisement</span>
            <button id="closeAdBtn" onclick="document.getElementById('interstitialModal').classList.add('hidden'); this.classList.add('hidden');" class="absolute top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-sm hidden shadow-lg border border-gray-600 hover:bg-red-600 transition-colors">Close Ad ✕</button>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalsHTML);
}

function playRewardAd() {
    const btn = document.getElementById('playAdBtn');
    const timer = document.getElementById('rewardTimer');
    btn.classList.add('hidden');
    let timeLeft = 5;
    
    const int = setInterval(() => {
        timer.innerText = \`\${timeLeft}s remaining\`;
        timeLeft--;
        if(timeLeft < 0) {
            clearInterval(int);
            currentCredits = MAX_CREDITS; updateCreditUI();
            document.getElementById('rewardModal').classList.add('hidden');
            showToast("Credits Restored!", "success");
            btn.classList.remove('hidden'); timer.innerText = "Sponsor Unit";
        }
    }, 1000);
}
