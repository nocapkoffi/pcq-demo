// script.js - Complete enhanced implementation

(function() {
    // ==================== RSA Simulation (Deterministic) ====================
    const RSA_PUBLIC = { e: 17, n: 3233 };
    const RSA_PRIVATE = { d: 2753, n: 3233 };

    function modExp(base, exp, mod) {
        let result = 1n;
        let b = BigInt(base) % BigInt(mod);
        let e = BigInt(exp);
        let m = BigInt(mod);
        while (e > 0n) {
            if (e & 1n) result = (result * b) % m;
            b = (b * b) % m;
            e >>= 1n;
        }
        return Number(result);
    }

    function rsaEncrypt(plain) {
        if (isNaN(plain) || plain < 0 || plain >= RSA_PUBLIC.n) return null;
        return modExp(plain, RSA_PUBLIC.e, RSA_PUBLIC.n);
    }

    function rsaDecrypt(cipher) {
        if (isNaN(cipher) || cipher < 0 || cipher >= RSA_PRIVATE.n) return null;
        return modExp(cipher, RSA_PRIVATE.d, RSA_PRIVATE.n);
    }

    // ==================== PQC Simulation (Randomized) ====================
    const PQC_MOD = 65537;
    let pqcState = {
        lastNoise: null,
        lastCiphertext: null,
        lastPlaintext: null
    };

    function modularInverse(a, mod) {
        let t = 0n, newt = 1n;
        let r = BigInt(mod), newr = BigInt(a);
        while (newr !== 0n) {
            let quotient = r / newr;
            [t, newt] = [newt, t - quotient * newt];
            [r, newr] = [newr, r - quotient * newr];
        }
        if (r > 1n) return null;
        if (t < 0n) t += BigInt(mod);
        return Number(t);
    }

    function pqcEncrypt(plain) {
        if (isNaN(plain) || plain < 0 || plain > 5000) return null;
        const noise = Math.floor(Math.random() * 2000) + 100;
        let cipher = (plain * 13 + noise) % PQC_MOD;
        pqcState = { lastNoise: noise, lastCiphertext: cipher, lastPlaintext: plain };
        return { cipher, noise };
    }

    function pqcDecrypt(cipher) {
        if (pqcState.lastNoise === null || pqcState.lastCiphertext !== cipher) {
            return null;
        }
        let temp = (cipher - pqcState.lastNoise) % PQC_MOD;
        if (temp < 0) temp += PQC_MOD;
        const inv13 = modularInverse(13, PQC_MOD);
        if (inv13 === null) return null;
        let recovered = (temp * inv13) % PQC_MOD;
        return recovered;
    }

    // ==================== State Management ====================
    let rsaHistory = [];
    let pqcHistory = [];

    // DOM Elements
    const rsaInput = document.getElementById('rsaMsg');
    const rsaEncryptBtn = document.getElementById('rsaEncryptBtn');
    const rsaDecryptBtn = document.getElementById('rsaDecryptBtn');
    const rsaResetBtn = document.getElementById('rsaResetBtn');
    const rsaResult = document.getElementById('rsaResult');
    const rsaHistoryDiv = document.getElementById('rsaHistory');

    const pqcInput = document.getElementById('pqcMsg');
    const pqcEncryptBtn = document.getElementById('pqcEncryptBtn');
    const pqcDecryptBtn = document.getElementById('pqcDecryptBtn');
    const pqcResetBtn = document.getElementById('pqcResetBtn');
    const pqcResult = document.getElementById('pqcResult');
    const pqcHistoryDiv = document.getElementById('pqcHistory');
    const noiseVisual = document.getElementById('noiseVisual');
    const noiseDots = document.getElementById('noiseDots');
    const noiseValue = document.getElementById('noiseValue');

    const rsaChallengeBtn = document.getElementById('rsaChallengeBtn');
    const pqcChallengeBtn = document.getElementById('pqcChallengeBtn');
    const rsaChallengeResults = document.getElementById('rsaChallengeResults');
    const pqcChallengeResults = document.getElementById('pqcChallengeResults');

    const liveFact = document.getElementById('liveFact');
    const walkthroughBtn = document.getElementById('walkthroughBtn');
    const modal = document.getElementById('walkthroughModal');
    const modalClose = document.querySelector('.modal-close');

    // ==================== Helper Functions ====================
    function updateRSAHistory() {
        if (rsaHistory.length === 0) {
            rsaHistoryDiv.innerHTML = '<span class="history-empty">no encryptions yet</span>';
            return;
        }
        rsaHistoryDiv.innerHTML = rsaHistory.map(h => `<span>🔐 ${h}</span>`).join('');
    }

    function updatePQCHistory() {
        if (pqcHistory.length === 0) {
            pqcHistoryDiv.innerHTML = '<span class="history-empty">no encryptions yet</span>';
            return;
        }
        pqcHistoryDiv.innerHTML = pqcHistory.map(h => `<span>🌀 ${h}</span>`).join('');
    }

    function showNoiseAnimation(noiseValueNum) {
        noiseVisual.style.display = 'block';
        noiseDots.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            dot.style.animationDelay = `${i * 0.05}s`;
            noiseDots.appendChild(dot);
        }
        noiseValue.textContent = `noise value: ${noiseValueNum}`;
        setTimeout(() => {
            noiseVisual.style.display = 'none';
        }, 1500);
    }

    // Rotating facts
    const facts = [
        "⚛️ quantum volume doubles every ~18 months",
        "🌀 lattice cryptography resists Shor & Grover",
        "🔮 NIST finalized PQC standards in 2024",
        "📡 RSA-2048 could fall within hours to fault-tolerant QC",
        "🌿 CRYSTALS-Kyber is NIST's chosen KEM",
        "✨ PQC ciphertexts are randomized — same plaintext, different output",
        "🔬 Learning With Errors (LWE) is the foundation of lattice crypto"
    ];
    let factIndex = 0;
    function rotateFact() {
        if (liveFact) {
            factIndex = (factIndex + 1) % facts.length;
            liveFact.innerHTML = facts[factIndex];
            liveFact.style.animation = 'none';
            setTimeout(() => liveFact.style.animation = '', 10);
        }
    }
    setInterval(rotateFact, 5500);

    // ==================== RSA Handlers ====================
    function rsaEncryptHandler() {
        let val = parseInt(rsaInput.value, 10);
        if (isNaN(val)) {
            rsaResult.innerHTML = '❌ enter a number';
            return;
        }
        if (val < 0 || val >= RSA_PUBLIC.n) {
            rsaResult.innerHTML = `⚠️ value must be 0–${RSA_PUBLIC.n-1}`;
            return;
        }
        const cipher = rsaEncrypt(val);
        if (cipher !== null) {
            rsaResult.innerHTML = `<span style="font-family: monospace;">🔐 ${cipher}</span><span style="display:block; font-size:0.7rem; color:#8b9a7a;">deterministic · same input → same output</span>`;
            rsaHistory.push(cipher);
            updateRSAHistory();
        } else {
            rsaResult.innerHTML = 'encryption failed';
        }
    }

    function rsaDecryptHandler() {
        let raw = rsaResult.innerText;
        let cipherMatch = raw.match(/\d+/);
        if (!cipherMatch) {
            rsaResult.innerHTML = '⚠️ encrypt something first';
            return;
        }
        let cipherVal = parseInt(cipherMatch[0], 10);
        const plain = rsaDecrypt(cipherVal);
        if (plain !== null) {
            rsaResult.innerHTML = `<span style="font-family: monospace;">🔓 ${plain}</span><span style="display:block; font-size:0.7rem; color:#8b9a7a;">recovered original message</span>`;
        } else {
            rsaResult.innerHTML = 'decryption error';
        }
    }

    function rsaResetHandler() {
        rsaHistory = [];
        updateRSAHistory();
        rsaResult.innerHTML = '—';
        rsaInput.value = '42';
    }

    // ==================== PQC Handlers ====================
    function pqcEncryptHandler() {
        let val = parseInt(pqcInput.value, 10);
        if (isNaN(val)) {
            pqcResult.innerHTML = '❌ enter numeric message';
            return;
        }
        if (val < 0 || val > 5000) {
            pqcResult.innerHTML = '⚠️ value 0–5000 recommended';
            return;
        }
        const result = pqcEncrypt(val);
        if (result) {
            pqcResult.innerHTML = `<span style="font-family: monospace;">🌀 ${result.cipher}</span><span style="display:block; font-size:0.7rem; color:#6d8f72;">✨ randomized · encrypt again to see change ✨</span>`;
            pqcHistory.push(result.cipher);
            updatePQCHistory();
            showNoiseAnimation(result.noise);
            
            // Update risk meter dynamically to show PQC is safe
            document.getElementById('pqcRiskFill').style.width = '12%';
        } else {
            pqcResult.innerHTML = 'encryption failed';
        }
    }

    function pqcDecryptHandler() {
        if (pqcState.lastNoise === null || pqcState.lastCiphertext === null) {
            pqcResult.innerHTML = '⚠️ first encrypt a message (PQC uses ephemeral noise)';
            return;
        }
        let cipherDisplay = pqcResult.innerText;
        let cipherMatch = cipherDisplay.match(/\d+/);
        if (!cipherMatch) {
            pqcResult.innerHTML = '⚠️ no recent ciphertext found, encrypt again';
            return;
        }
        let currentCipher = parseInt(cipherMatch[0], 10);
        if (currentCipher !== pqcState.lastCiphertext) {
            pqcResult.innerHTML = '⚠️ mismatch — please encrypt again';
            return;
        }
        const recovered = pqcDecrypt(currentCipher);
        if (recovered !== null) {
            pqcResult.innerHTML = `<span style="font-family: monospace;">✅ ${recovered}</span><span style="display:block; font-size:0.7rem; color:#6d8f72;">noise removed · message restored</span>`;
        } else {
            pqcResult.innerHTML = 'decryption failed';
        }
    }

    function pqcResetHandler() {
        pqcHistory = [];
        updatePQCHistory();
        pqcResult.innerHTML = '—';
        pqcInput.value = '42';
        pqcState = { lastNoise: null, lastCiphertext: null, lastPlaintext: null };
        noiseVisual.style.display = 'none';
    }

    // ==================== Challenge Functions ====================
    function rsaChallenge() {
        const message = 42;
        const results = [];
        for (let i = 0; i < 3; i++) {
            results.push(rsaEncrypt(message));
        }
        rsaChallengeResults.innerHTML = results.map(r => `[${r}]`).join(' → ');
    }

    function pqcChallenge() {
        const message = 42;
        const results = [];
        for (let i = 0; i < 3; i++) {
            const enc = pqcEncrypt(message);
            results.push(enc.cipher);
        }
        pqcChallengeResults.innerHTML = results.map(r => `[${r}]`).join(' → ');
    }

    // ==================== Walkthrough Modal ====================
    function openModal() {
        modal.style.display = 'block';
        document.getElementById('step1').style.display = 'block';
        document.getElementById('step2').style.display = 'none';
        document.getElementById('step3').style.display = 'none';
        document.getElementById('step4').style.display = 'none';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    window.nextStep = function(step) {
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`step${i}`).style.display = 'none';
        }
        if (step <= 4) {
            document.getElementById(`step${step}`).style.display = 'block';
        } else {
            closeModal();
        }
    };

    // ==================== Event Listeners ====================
    if (rsaEncryptBtn) rsaEncryptBtn.addEventListener('click', rsaEncryptHandler);
    if (rsaDecryptBtn) rsaDecryptBtn.addEventListener('click', rsaDecryptHandler);
    if (rsaResetBtn) rsaResetBtn.addEventListener('click', rsaResetHandler);
    if (pqcEncryptBtn) pqcEncryptBtn.addEventListener('click', pqcEncryptHandler);
    if (pqcDecryptBtn) pqcDecryptBtn.addEventListener('click', pqcDecryptHandler);
    if (pqcResetBtn) pqcResetBtn.addEventListener('click', pqcResetHandler);
    if (rsaChallengeBtn) rsaChallengeBtn.addEventListener('click', rsaChallenge);
    if (pqcChallengeBtn) pqcChallengeBtn.addEventListener('click', pqcChallenge);
    if (walkthroughBtn) walkthroughBtn.addEventListener('click', openModal);
    if (modalClose) modalClose.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // Initialize
    updateRSAHistory();
    updatePQCHistory();
    if (liveFact) liveFact.innerHTML = facts[0];
})();