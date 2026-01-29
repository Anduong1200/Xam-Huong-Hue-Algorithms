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
    resultText.innerText = `${bestEv}`;

    // More detailed sub-text
    const subEvents = result.events.filter(e => e !== bestEv && e !== "NO_EVENT").join(", ");
    if (subEvents) resultText.innerHTML += `<br><span style="font-size:0.8em; color:#888;">Matches: ${subEvents}</span>`;

    payoutDisplay.innerText = payout > 0 ? `WIN x${payout}` : "LOSE";

    // Log
    logResult(result);

    rollBtn.disabled = false;
});

function renderDice(counts) {
    bowl.innerHTML = '';
    // Flatten counts to array of faces for rendering
    let faces = [];
    for (let f = 1; f <= 6; f++) {
        for (let k = 0; k < counts[f]; k++) faces.push(f);
    }
    // Shuffle for visual randomness
    faces.sort(() => Math.random() - 0.5);

    faces.forEach(faceVal => {
        const d = document.createElement('div');
        d.className = `dice face-${faceVal}`;
        d.innerHTML = createDots(faceVal);
        bowl.appendChild(d);
    });
}

function createDots(face) {
    let html = '';
    const isRed = (face === 1 || face === 4);
    const colorClass = isRed ? 'red' : 'black';
    // For 1 and 4, all dots are red. For others, usually black? 
    // Wait, typical Chinese dice: 1 is big red, 4 is red. 
    // Others are black.

    // Logic:
    let dotColor = (face === 1 || face === 4) ? 'red' : 'black';

    for (let i = 0; i < face; i++) {
        html += `<div class="dot ${dotColor}"></div>`;
    }
    return html;
}

function logResult(res) {
    const list = document.getElementById('game-log');
    const li = document.createElement('li');
    // Compact log
    const diceStr = res.counts.slice(1).map((c, i) => c > 0 ? `${i + 1}:${c}` : '').filter(s => s).join(', ');
    li.innerHTML = `Roll: [${diceStr}] &rarr; <b>${res.bestEvent}</b> (x${res.payout})`;
    list.prepend(li);
}

/**
 * Solver
 */
btnSolve.addEventListener('click', () => {
    const evap = targetEventSel.value;
    const rate = parseFloat(targetRateInput.value);

    btnSolve.innerText = "Solving...";
    setTimeout(() => {
        const p4Found = engine.solveP4(evap, rate);
        // Apply
        setParams(p4Found);
        btnSolve.innerText = "Tìm p4";
        alert(`Found p4 = ${p4Found.toFixed(6)} for P(${evap}) >= ${rate}`);
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

        let html = `Trials: ${n}<br>`;
        // Sort by frequency
        Object.entries(hits).sort((a, b) => b[1] - a[1]).forEach(([ev, count]) => {
            html += `${ev}: ${((count / n) * 100).toFixed(2)}%<br>`;
        });

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
