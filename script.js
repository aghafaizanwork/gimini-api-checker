// GSAP Intro Animation
window.addEventListener('load', () => {
    const tl = gsap.timeline();

    tl.from('.card', {
        duration: 1.2,
        y: 50,
        opacity: 0,
        scale: 0.95,
        ease: 'power3.out'
    })
        .from('.card-header > *', {
            duration: 0.8,
            y: 20,
            opacity: 0,
            stagger: 0.2,
            ease: 'back.out(1.7)'
        }, '-=0.5')
        .from('.input-group', {
            duration: 0.8,
            x: -20,
            opacity: 0,
            stagger: 0.1,
            ease: 'power2.out'
        }, '-=0.6')
        .from('#check-btn', {
            duration: 0.6,
            scale: 0.9,
            opacity: 0,
            ease: 'elastic.out(1, 0.5)'
        }, '-=0.4');
});

// Elements
const checkBtn = document.getElementById('check-btn');
const btnText = document.querySelector('.btn-text');
const loader = document.querySelector('.loader');
const resultsSection = document.getElementById('results-area');
const latencyDisplay = document.getElementById('latency-value');
const statusDisplay = document.getElementById('status-value');
const apiResponsePre = document.getElementById('api-response');
const statusDot = document.querySelector('.status-dot');
const statusText = document.querySelector('.status-text');
const copyBtn = document.getElementById('copy-btn');

// State
let isProcessing = false;

// Event Listeners
checkBtn.addEventListener('click', handleApiCheck);
copyBtn.addEventListener('click', copyToClipboard);

async function handleApiCheck() {
    if (isProcessing) return;

    const apiKey = document.getElementById('api-key').value.trim();
    const prompt = document.getElementById('prompt-input').value.trim();
    const model = document.getElementById('model-select').value;

    if (!apiKey) {
        showErrorUI("API KEY MISSING");
        animateShake('.input-group:first-child');
        return;
    }

    setLoadingState(true);

    // Prepare Request
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{
            parts: [{ text: prompt }]
        }]
    };

    const startTime = performance.now();

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `HTTP Error ${response.status}`);
        }

        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No content returned.";
        showSuccessUI(latency, generatedText);

    } catch (error) {
        showErrorUI("CONNECTION FAILED", error.message);
    } finally {
        setLoadingState(false);
    }
}

function setLoadingState(loading) {
    isProcessing = loading;

    if (loading) {
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        gsap.to(checkBtn, { opacity: 0.8, pointerEvents: 'none' });

        // Reset Displays
        resultsSection.classList.add('hidden');
        statusDot.className = 'status-dot'; // reset colors
        statusText.textContent = "SYSTEM PROCESSING...";
        statusText.style.color = "#fff";
    } else {
        btnText.classList.remove('hidden');
        loader.classList.add('hidden');
        gsap.to(checkBtn, { opacity: 1, pointerEvents: 'all' });
    }
}

function showSuccessUI(latency, text) {
    // Status Indicators
    statusDot.className = 'status-dot status-online';
    statusText.textContent = "SYSTEM ONLINE";
    statusText.style.color = "var(--neon-green)";

    // Results Area
    resultsSection.classList.remove('hidden');
    gsap.fromTo(resultsSection, { height: 0, opacity: 0 }, { duration: 0.6, height: 'auto', opacity: 1, ease: 'power2.out' });

    // Metrics
    latencyDisplay.textContent = `${latency} ms`;
    latencyDisplay.style.color = "var(--neon-green)";

    statusDisplay.textContent = "200 OK";
    statusDisplay.style.color = "var(--neon-green)";

    // Typewriter Effect for Response
    apiResponsePre.textContent = "";
    typeWriter(text, 0);
}

function showErrorUI(shortMsg, detailMsg = "") {
    // Status Indicators
    statusDot.className = 'status-dot status-error';
    statusText.textContent = shortMsg;
    statusText.style.color = "var(--neon-red)";

    // Results Area (for details)
    resultsSection.classList.remove('hidden');
    gsap.fromTo(resultsSection, { height: 0, opacity: 0 }, { duration: 0.6, height: 'auto', opacity: 1, ease: 'power2.out' });

    // Metrics
    latencyDisplay.textContent = "--";
    latencyDisplay.style.color = "var(--neon-red)";

    statusDisplay.textContent = "ERROR";
    statusDisplay.style.color = "var(--neon-red)";

    // Show Error
    apiResponsePre.textContent = `Error: ${detailMsg || shortMsg}`;
    apiResponsePre.style.color = "var(--neon-red)";

    animateShake('.card');
}

function animateShake(selector) {
    gsap.to(selector, {
        duration: 0.1,
        x: -10,
        yoyo: true,
        repeat: 5,
        ease: 'power1.inOut',
        onComplete: () => gsap.to(selector, { x: 0 })
    });
}

function typeWriter(text, i) {
    if (i < text.length) {
        apiResponsePre.textContent += text.charAt(i);
        apiResponsePre.scrollTop = apiResponsePre.scrollHeight;

        // Dynamic speed based on text length to keep it snappy
        const speed = text.length > 200 ? 5 : 20;

        setTimeout(() => typeWriter(text, i + 1), speed);
    } else {
        apiResponsePre.style.color = "var(--neon-cyan)";
    }
}

function copyToClipboard() {
    const text = apiResponsePre.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "COPIED!";
        copyBtn.style.color = "var(--neon-green)";
        copyBtn.style.borderColor = "var(--neon-green)";

        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.color = "";
            copyBtn.style.borderColor = "";
        }, 2000);
    });
}
