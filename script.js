/**
 * script.js - UI Controller & Game Loop
 */

const engine = new XamHuongEngine();
const rollBtn = document.getElementById('btn-roll');
const bowl = document.getElementById('bowl');
const resultText = document.getElementById('result-text');
const payoutDisplay = document.getElementById('payout-display');

// Config Elements
const p4Slider = document.getElementById('p4-slider');
const p4Display = document.getElementById('p4-val-display');

// Solver Elements
const btnSolve = document.getElementById('btn-solve');
const targetEventSel = document.getElementById('target-event');
const targetRateInput = document.getElementById('target-rate');

// Analysis Elements
const exactStatsDiv = document.getElementById('exact-stats');
const btnRunMC = document.getElementById('btn-run-mc');
const mcStatsDiv = document.getElementById('mc-stats');
const mcTrialsInput = document.getElementById('mc-trials');

// Init
function init() {
    updateEngineParams();
    updateExactStats(); // Initial calculation

    // UI Listeners
    p4Slider.addEventListener('input', (e) => {
        p4Display.innerText = parseFloat(e.target.value).toFixed(6);
        updateEngineParams();
    });

    // Debounce exact stats update on slider change
    p4Slider.addEventListener('change', () => {
        updateExactStats();
    });
}

function updateEngineParams() {
    const p4 = parseFloat(p4Slider.value);
    engine.setParams(p4);
}

// Global helper for preset buttons
window.setParams = (val) => {
    p4Slider.value = val;
    p4Display.innerText = val.toFixed(6);
    updateEngineParams();
    updateExactStats();
}

/**
 * Game Flow
 */
rollBtn.addEventListener('click', async () => {
    // 1. Animation State
    rollBtn.disabled = true;
    bowl.innerHTML = '<div class="dice-placeholder">...Đang đổ...</div>';
    resultText.innerText = "Running...";
    payoutDisplay.innerText = "";

    // 2. Wait for pseudo-animation
    await new Promise(r => setTimeout(r, 600));

    // 3. Engine Roll
    const result = engine.simulate();

    // 4. Render Dice
    renderDice(result.counts);

    // 5. Show Result
    const bestEv = result.bestEvent;
    const payout = result.payout;

    // Format Result Display
    let resultHtml = `<div class="result-event">${bestEv}</div>`;

    const subEvents = result.events.filter(e => e !== bestEv && e !== "NO_EVENT").join(", ");
    if (subEvents) {
        resultHtml += `<div class="result-sub">Matches: ${subEvents}</div>`;
    }
    resultText.innerHTML = resultHtml;

    // Formatting Payout with Classes
    if (payout > 0) {
        payoutDisplay.className = 'payout-tag win';
        payoutDisplay.innerHTML = `WIN <span class="multiplier">x${payout}</span>`;
    } else {
        payoutDisplay.className = 'payout-tag lose';
        payoutDisplay.innerHTML = `LOSE`;
    }

    // Log
    logResult(result);

    rollBtn.disabled = false;
});

function renderDice(counts) {
    bowl.innerHTML = '';
    // Flatten counts
    let faces = [];
    for (let f = 1; f <= 6; f++) {
        for (let k = 0; k < counts[f]; k++) faces.push(f);
    }
    // Shuffle
    faces.sort(() => Math.random() - 0.5);

    faces.forEach(faceVal => {
        const d = document.createElement('div');
        // Map face val to class
        const faceClasses = ['first-face', 'second-face', 'third-face', 'fourth-face', 'fifth-face', 'sixth-face'];
        d.className = `dice ${faceClasses[faceVal - 1]}`;

        d.innerHTML = createDots(faceVal);
        bowl.appendChild(d);
    });
}

function createDots(face) {
    const isOdd = face % 2 !== 0; // 1, 3, 5 are odd
    const colorClass = isOdd ? 'red' : 'black';
    const dotHtml = `<span class="dot ${colorClass}"></span>`;

    // Helper to generic N dots
    const dots = (n) => Array(n).fill(dotHtml).join('');

    // Faces structure
    if (face === 1) return dots(1);
    if (face === 2) return dots(2);
    if (face === 3) return dots(3);

    if (face === 4) {
        return `
            <div class="column">${dots(2)}</div>
            <div class="column">${dots(2)}</div>
        `;
    }

    if (face === 5) {
        return `
            <div class="column">${dots(2)}</div>
            <div class="column">${dots(1)}</div>
            <div class="column">${dots(2)}</div>
        `;
    }

    if (face === 6) {
        return `
            <div class="column">${dots(3)}</div>
            <div class="column">${dots(3)}</div>
        `;
    }
    return '';
}

function logResult(res) {
    const list = document.getElementById('game-log');
    const li = document.createElement('li');
    // Compact log
    const diceStr = res.counts.slice(1).map((c, i) => c > 0 ? `${i + 1}:${c}` : '').filter(s => s).join(', ');
    const outcomeClass = res.payout > 0 ? 'win' : 'lose';
    li.innerHTML = `<span class="log-dice">[${diceStr}]</span> <span class="log-outcome ${outcomeClass}">${res.bestEvent} (x${res.payout})</span>`;
    list.prepend(li);
}

/**
 * Solver
 */
btnSolve.addEventListener('click', () => {
    const evap = targetEventSel.value;
    const rate = parseFloat(targetRateInput.value);

    btnSolve.innerText = "Solving...";
    btnSolve.disabled = true;

    setTimeout(() => {
        const p4Found = engine.solveP4(evap, rate);
        // Apply
        setParams(p4Found);
        btnSolve.innerText = "Tìm p4";
        btnSolve.disabled = false;
        // Optional: toast or highlight effect
    }, 50);
});

/**
 * Analysis UI Update
 */
function updateExactStats() {
    exactStatsDiv.innerHTML = "Calculating...";
    // prevent UI blocking
    setTimeout(() => {
        const stats = engine.enumerateExact();

        // Header
        let html = `<div class="stat-row highlight">
            <span>House Edge:</span>
            <span>${(stats.house_edge * 100).toFixed(2)}%</span>
        </div>`;
        html += `<div class="stat-row">
            <span>Expected Value (EV):</span>
            <span>${stats.ev.toFixed(4)}</span>
        </div><hr>`;

        // Grid for details
        html += `<div class="stats-columns">`;

        // Column 1: General Hường
        html += `<div class="col"><h5>Based on Hường (K)</h5>`;
        const kStats = ["K=1", "K=2", "K=3", "K>=2", "K>=3"];
        kStats.forEach(key => {
            let p = stats.stats[key] || 0;
            html += `<div class="stat-item"><span>${key}:</span> <b>${(p * 100).toFixed(2)}%</b></div>`;
        });
        html += `</div>`;

        // Column 2: Patterns
        html += `<div class="col"><h5>Special Patterns</h5>`;
        const special = ["PHAN_SONG_TAM", "SUUT", "THUONG_HA_MA", "LUC_HUONG", "LUC_PHU", "TU_HUONG"];
        special.forEach(key => {
            let p = stats.stats[key] || 0;
            // Highlight rare ones
            let style = p < 0.01 ? 'color:#ffab91' : '';
            html += `<div class="stat-item" style="${style}"><span>${key}:</span> <b>${(p * 100).toFixed(3)}%</b></div>`;
        });
        html += `</div>`;
        html += `</div>`; // end grid

        exactStatsDiv.innerHTML = html;
    }, 10);
}

btnRunMC.addEventListener('click', () => {
    const n = parseInt(mcTrialsInput.value);
    mcStatsDiv.innerText = "Running...";

    setTimeout(() => {
        let hits = {};
        for (let i = 0; i < n; i++) {
            let res = engine.simulate();
            let ev = res.bestEvent;
            hits[ev] = (hits[ev] || 0) + 1;
        }

        let html = `<div class="mc-summary">Trials: <b>${n}</b></div>`;
        html += `<table class="mc-table"><thead><tr><th>Event</th><th>Prob (%)</th></tr></thead><tbody>`;

        // Sort by frequency
        Object.entries(hits).sort((a, b) => b[1] - a[1]).forEach(([ev, count]) => {
            let percent = ((count / n) * 100).toFixed(2);
            html += `<tr><td>${ev}</td><td>${percent}%</td></tr>`;
        });

        html += `</tbody></table>`;
        mcStatsDiv.innerHTML = html;
    }, 50);
});

// Tab Switcher
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
});

init();
