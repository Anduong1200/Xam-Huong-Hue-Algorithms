/**
 * script.js - Research Platform Controller (Royal Edition)
 */

// Initialize Engine & Session
const engine = new XamHuongEngine(6, XAM_HUONG_RULES);
const session = new XamHuongSession(engine);

let distChart = null;
let equityChart = null; // New chart for Equity Curve

// --- DOM Elements ---
const dom = {
    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),

    // Play
    rollBtn: document.getElementById('btn-roll'),
    bowl: document.getElementById('bowl'),
    resultText: document.getElementById('result-text'),
    payoutDisplay: document.getElementById('payout-display'),

    // HUD
    balanceDisplay: document.getElementById('balance-display'),
    betInput: document.getElementById('bet-input'),
    jackpotDisplay: document.getElementById('jackpot-display'),
    playerName: document.getElementById('player-name-display'),

    // Session Stats (New)
    strkCurrent: document.getElementById('strk-current'),
    strkMaxWin: document.getElementById('strk-max-win'),
    strkMaxLoss: document.getElementById('strk-max-loss'),
    sessionLogs: document.getElementById('session-logs'),

    // Sandbox
    sandboxBoard: document.getElementById('sandbox-board'),
    sandboxOutcome: document.getElementById('sandbox-outcome'),
    sandboxScore: document.getElementById('sandbox-score'),

    // Analysis
    engineMetrics: document.getElementById('engine-metrics'),
    condProbSetup: document.getElementById('cond-prob-setup'),
    btnCalcCond: document.getElementById('btn-calc-cond'),
    condProbOutput: document.getElementById('cond-prob-output'),

    // New Analytics
    heatmapGrid: document.getElementById('heatmap-grid'),
    riskCalcBtn: document.getElementById('btn-calc-risk'),
    riskResult: document.getElementById('risk-result'),

    // Config & Heritage
    diceCountInput: document.getElementById('dice-count-input'),
    weightInputs: document.getElementById('weight-inputs'),
    probSumDisplay: document.getElementById('prob-sum-display'),
    btnApplyConfig: document.getElementById('btn-apply-config'),
    solverMode: document.getElementById('solver-mode'),
    solverTargetArea: document.getElementById('solver-target-area'),
    btnSolve: document.getElementById('btn-solve'),
    heritageList: document.getElementById('heritage-list'),
    heritageDesc: document.getElementById('heritage-desc'),

    // Global
    status: document.getElementById('log-status'),
    btnExport: document.getElementById('btn-export')
};

// --- Initialization ---
function init() {
    // Load State
    loadSession();

    setupTabs();
    setupHeritageUI();
    setupWeightInputs();
    setupSolverUI();

    initCharts();
    updateHUD();
    renderSandbox();
    updateAnalysis();
    updateSessionAnalysis(); // New streak/log update

    bindEvents();

    dom.status.innerText = "Royal Palace Engine v3.5 (Multi-Session Economy)";

    // Auto-save loop
    setInterval(saveSession, 5000);
}

function loadSession() {
    const saved = localStorage.getItem('xamhuong_session');
    if (saved) {
        try {
            session.importState(JSON.parse(saved));
            console.log("Session restored.");
        } catch (e) {
            console.error("Failed to load session", e);
            createDefaultPlayer();
        }
    } else {
        createDefaultPlayer();
    }

    if (session.players.length === 0) createDefaultPlayer();
}

function createDefaultPlayer() {
    session.addPlayer(new Player('p1', 'Royal Player', 1000));
}

function saveSession() {
    const data = session.exportState();
    localStorage.setItem('xamhuong_session', JSON.stringify(data));
    dom.status.innerText = `Saved at ${new Date().toLocaleTimeString()}`;
}

function updateHUD() {
    const p = session.getCurrentPlayer();
    if (dom.balanceDisplay) dom.balanceDisplay.innerText = p.balance.toLocaleString();
    if (dom.jackpotDisplay) dom.jackpotDisplay.innerText = session.jackpot.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (dom.betInput) session.minBet = parseInt(dom.betInput.value) || 10;

    // Update Equity Chart if visible
    updateEquityChart(p);
}

function updateSessionAnalysis() {
    // 1. Update Streak Stats
    if (dom.strkCurrent) {
        const s = session.currentStreak;
        dom.strkCurrent.innerText = (s > 0 ? "+" + s : s);
        dom.strkCurrent.className = `val ${s > 0 ? 'win' : (s < 0 ? 'loss' : 'neutral')}`;
    }
    if (dom.strkMaxWin) dom.strkMaxWin.innerText = session.maxWinStreak;
    if (dom.strkMaxLoss) dom.strkMaxLoss.innerText = session.maxLossStreak;

    // 2. Render Logs
    if (dom.sessionLogs) {
        dom.sessionLogs.innerHTML = '';
        // Use session.logs array which contains objects now
        session.logs.forEach(log => {
            const div = document.createElement('div');
            const typeClass = log.isWin ? (log.result === 'Lục Hường (Jackpot)' ? 'jackpot' : 'win') : 'loss';
            const sign = log.change > 0 ? '+' : '';
            div.className = `log-entry ${typeClass}`;
            div.innerHTML = `
                <span class="log-time">${log.timestamp}</span>
                <span class="log-event">${log.result}</span>
                <span class="log-amt ${log.change > 0 ? 'pos' : 'neg'}">${sign}${log.change}</span>
            `;
            dom.sessionLogs.appendChild(div);
        });
    }
}

function bindEvents() {
    dom.rollBtn.onclick = handleRoll;
    dom.btnApplyConfig.onclick = applyConfig;
    dom.btnSolve.onclick = handleSolve;
    dom.btnCalcCond.onclick = handleConditionalCalc;
    dom.btnExport.onclick = exportData;
    if (dom.riskCalcBtn) dom.riskCalcBtn.onclick = handleRiskCalc;

    dom.diceCountInput.onchange = () => {
        engine.setNumDice(dom.diceCountInput.value);
        renderSandbox();
    };
}

// --- Tab Logic ---
function setupTabs() {
    dom.tabBtns.forEach(btn => {
        btn.onclick = () => {
            dom.tabBtns.forEach(b => b.classList.remove('active'));
            dom.tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');

            if (btn.dataset.tab === 'analysis') {
                updateAnalysis();
                updateSessionAnalysis();
            }
        };
    });
}

// --- Game Logic ---
async function handleRoll() {
    const bet = parseInt(dom.betInput.value) || 10;

    try {
        session.processBet(bet);
    } catch (e) {
        alert(e.message);
        return;
    }

    updateHUD(); // Update after bet deduction

    dom.rollBtn.disabled = true;
    dom.bowl.classList.add('wiggle');
    dom.bowl.innerHTML = '<div class="placeholder" style="color:#d4af37">Rolling...</div>';

    await new Promise(r => setTimeout(r, 600)); // Cinematic delay

    // Resolve
    const result = session.resolveRoll(bet);

    // Render
    renderDice(result.counts, dom.bowl);
    dom.bowl.classList.remove('wiggle');

    // UI Feedback
    const ruleName = result.isJackpotWin ? "👑 MEGA JACKPOT 👑" : (result.payout > 0 ? `Win: ${result.bestEvent}` : "Loss");
    dom.resultText.innerText = ruleName;

    dom.payoutDisplay.innerText = result.payout > 0 ? `+${result.payout.toLocaleString()}` : "0";
    dom.payoutDisplay.style.color = result.payout > 0 ? "#c5a059" : "#e74c3c";

    if (result.isJackpotWin) {
        confettiEffect();
    }

    updateHUD();
    updateSessionAnalysis(); // Update logs and streaks
    dom.rollBtn.disabled = false;
    saveSession();
}

function renderDice(counts, container) {
    container.innerHTML = '';
    const faces = [];
    for (let f = 1; f <= 6; f++) {
        for (let k = 0; k < counts[f]; k++) faces.push(f);
    }

    // Animate appearance
    faces.forEach((val, i) => {
        setTimeout(() => {
            const d = document.createElement('div');
            // Check if we have image assets (pseudo-check, assuming integrated)
            // For now, using CSS dots as requested by fallback plan, but styled nicely
            d.className = `dice face-${val}`;
            d.innerHTML = createDots(val);
            container.appendChild(d);
        }, i * 50);
    });
}

function createDots(face) {
    const isRed = (face === 4 || face === 1);
    const dotTag = isRed ? 'dot red' : 'dot';
    let dots = '';
    const patterns = {
        1: [1], 2: ['2-1', '2-2'], 3: ['3-1', '3-2', '3-3'],
        4: ['4-1', '4-2', '4-3', '4-4'], 5: ['5-1', '5-2', '5-3', '5-4', '5-5'],
        6: ['6-1', '6-2', '6-3', '6-4', '6-5', '6-6']
    };
    patterns[face].forEach(p => dots += `<span class="${dotTag} dot-${p}"></span>`);
    return dots;
}

// --- Analytics Logic ---
function initCharts() {
    // Probability Chart
    const ctx = document.getElementById('dist-chart').getContext('2d');
    distChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Prob (%)',
                data: [],
                backgroundColor: 'rgba(197, 160, 89, 0.6)',
                borderColor: '#c5a059',
                borderWidth: 1
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } } }
        }
    });

    // Equity Curve (New)
    const ctx2 = document.getElementById('equity-chart');
    if (ctx2) {
        equityChart = new Chart(ctx2.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Balance History',
                    data: [],
                    borderColor: '#e74c3c',
                    tension: 0.1,
                    pointRadius: 2
                }]
            },
            options: {
                plugins: { legend: { display: false }, title: { display: true, text: 'Player Equity Curve' } },
                scales: { x: { display: false }, y: { grid: { color: 'rgba(255,255,255,0.05)' } } }
            }
        });
    }
}

function updateAnalysis() {
    const stats = engine.calculateStats();

    // Metrics
    dom.engineMetrics.innerHTML = `
        <div class="metric-item"><span>EV (Score):</span> <strong>${stats.ev.toFixed(2)}</strong></div>
        <div class="metric-item"><span>House Edge (Est):</span> <strong>${(stats.houseEdge * 100).toFixed(2)}%</strong></div>
        <div class="metric-item"><span>Volatility (SD):</span> <strong>${stats.volatility.toFixed(2)}</strong></div>
    `;

    // Distribution Chart
    const keys = XAM_HUONG_RULES.map(r => r.id).filter(id => stats.stats[id] > 0.0001);
    distChart.data.labels = keys.map(id => XAM_HUONG_RULES.find(r => r.id === id).name);
    distChart.data.datasets[0].data = keys.map(id => (stats.stats[id] * 100).toFixed(2));
    distChart.update();

    // Heatmap update
    updateHeatmap();
}

function updateEquityChart(player) {
    if (!equityChart || !player) return;

    // Recent 50 history points
    const history = player.history.slice(-50);
    equityChart.data.labels = history.map(h => h.turn);
    equityChart.data.datasets[0].data = history.map(h => h.newBalance);
    equityChart.update();
}

function updateHeatmap() {
    if (!dom.heatmapGrid) return;
    const freqs = engine.getFaceFrequency(); // [f1, f2, f3, f4, f5, f6]
    // Expected is 1/6 (~0.166)

    dom.heatmapGrid.innerHTML = '';
    freqs.forEach((freq, idx) => {
        const face = idx + 1;
        const diff = freq - (1 / 6);
        // Color scale: Red if high deviation on 4 (Huong), else Green or neutral
        let colorClass = 'neutral';
        if (freq > 0.2) colorClass = 'hot';
        if (freq < 0.13) colorClass = 'cold';

        const div = document.createElement('div');
        div.className = `heat-cell ${colorClass}`;
        div.innerHTML = `
            <span class="face-label">Face ${face}</span>
            <span class="freq-val">${(freq * 100).toFixed(1)}%</span>
        `;
        dom.heatmapGrid.appendChild(div);
    });
}

function handleRiskCalc() {
    // Grab inputs directly from new form elements
    const inputs = document.querySelectorAll('#risk-form input');
    if (inputs.length < 3) return;

    const bal = parseFloat(inputs[0].value);
    const bet = parseFloat(inputs[1].value);
    const target = parseFloat(inputs[2].value);

    // Using engine's implementation:
    const ror = engine.calculateRiskOfRuin(bal, bet, bal); // Probability of ruining before doubling
    dom.riskResult.innerText = `Risk of Ruin (to double): ${(ror * 100).toFixed(2)}%`;
}

// --- Other Handlers ---
function confettiEffect() {
    // Placeholder for visual effect
    const b = document.body;
    const c = document.createElement('div');
    c.innerText = "👑💰👑";
    c.style.position = 'fixed';
    c.style.top = '50%';
    c.style.left = '50%';
    c.style.fontSize = '5rem';
    c.style.transform = 'translate(-50%, -50%)';
    c.style.zIndex = '9999';
    c.style.animation = 'fadeOut 2s forwards';
    b.appendChild(c);
    setTimeout(() => c.remove(), 2000);
}

// Re-implement Sandbox & Config Logic (Simplified for brevity as they are mostly unchanged)
const sandboxState = [1, 2, 3, 4, 5, 6];
function renderSandbox() {
    if (!dom.sandboxBoard) return;
    dom.sandboxBoard.innerHTML = '';
    const n = parseInt(dom.diceCountInput.value);
    while (sandboxState.length < n) sandboxState.push(1);
    while (sandboxState.length > n) sandboxState.pop();

    sandboxState.forEach((val, idx) => {
        const d = document.createElement('div');
        d.className = 'dice clickable';
        d.innerHTML = createDots(val);
        d.onclick = () => {
            sandboxState[idx] = (sandboxState[idx] % 6) + 1;
            renderSandbox();
            sandboxUpdate();
        };
        dom.sandboxBoard.appendChild(d);
    });
    sandboxUpdate();
}

function sandboxUpdate() {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    sandboxState.forEach(v => counts[v]++);
    const res = engine.resolveRound(counts);
    dom.sandboxOutcome.innerText = res.bestEvent !== "NONE" ? XAM_HUONG_RULES.find(r => r.id === res.bestEvent).name : "None";
    dom.sandboxScore.innerText = res.payout;
}

// Heritage Config Handlers
function setupHeritageUI() {
    dom.heritageList.innerHTML = '';
    HERITAGE_PRESETS.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'btn-preset';
        btn.innerText = p.name;
        btn.onclick = () => {
            dom.heritageDesc.innerText = p.description;
            // Apply logic...
            engine.setNumDice(p.diceCount);
            engine.setWeights(p.probabilities);
            updateWeightInputsUI();
            alert(`Restored ${p.name}`);
        };
        dom.heritageList.appendChild(btn);
    });
}
// --- Config Logic ---
function setupWeightInputs() {
    dom.weightInputs.innerHTML = '';
    for (let i = 1; i <= 6; i++) {
        const div = document.createElement('div');
        div.className = `weight-item face-${i}`;
        div.innerHTML = `
            <label>Face ${i}:</label>
            <input type="number" step="0.01" class="prob-input" data-face="${i}" value="${(1 / 6).toFixed(3)}">
        `;
        dom.weightInputs.appendChild(div);
    }

    document.querySelectorAll('.prob-input').forEach(input => {
        input.onchange = validateProbSum;
    });
}

function updateWeightInputsUI() {
    const weights = engine.faceWeights;
    document.querySelectorAll('.prob-input').forEach(input => {
        const f = input.dataset.face;
        input.value = weights[f].toFixed(3);
    });
    validateProbSum();
}

function validateProbSum() {
    let sum = 0;
    if (dom.probSumDisplay) {
        document.querySelectorAll('.prob-input').forEach(input => sum += parseFloat(input.value || 0));
        dom.probSumDisplay.innerText = `Total: ${sum.toFixed(3)}`;
        dom.probSumDisplay.style.color = Math.abs(sum - 1.0) < 0.001 ? '#c5a059' : '#e74c3c';
    }
}

function applyConfig() {
    const weights = [];
    document.querySelectorAll('.prob-input').forEach(input => weights.push(parseFloat(input.value || 0)));
    engine.setWeights(weights);
    engine.setNumDice(dom.diceCountInput.value);
    updateAnalysis();
    alert("Engine parameters synchronized.");
}

// --- Solver Logic ---
function setupSolverUI() {
    dom.solverMode.onchange = updateSolverInputs;
    updateSolverInputs();
}

function updateSolverInputs() {
    const mode = dom.solverMode.value;
    if (mode === 'winrate') {
        dom.solverTargetArea.innerHTML = `
            <div class="input-row">
                <label>Identify Pattern:</label>
                <select id="solve-event-id">
                    ${XAM_HUONG_RULES.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                </select>
            </div>
            <div class="input-row">
                <label>Target Probability (0-1):</label>
                <input type="number" id="solve-target-rate" value="0.5" step="0.05">
            </div>
        `;
    } else {
        dom.solverTargetArea.innerHTML = `
            <div class="input-row">
                <label>Target Edge (e.g. 0.05):</label>
                <input type="number" id="solve-target-edge" value="0.05" step="0.01">
            </div>
        `;
    }
}

async function handleSolve() {
    const mode = dom.solverMode.value;
    dom.btnSolve.innerText = "Computing...";
    dom.btnSolve.disabled = true;

    await new Promise(r => setTimeout(r, 100)); // UI breathe

    let resultP4;
    if (mode === 'winrate') {
        const id = document.getElementById('solve-event-id').value;
        const rate = parseFloat(document.getElementById('solve-target-rate').value);
        resultP4 = engine.solveP4(id, rate);
    } else {
        const edge = parseFloat(document.getElementById('solve-target-edge').value);
        resultP4 = engine.solveHouseEdge(edge);
    }

    engine.setP4(resultP4);
    updateWeightInputsUI();
    updateAnalysis();

    dom.btnSolve.innerText = "Run Optimization";
    dom.btnSolve.disabled = false;
    alert(`Optimal p4 found: ${resultP4.toFixed(4)}`);
}

async function handleConditionalCalc() {
    // Check if state is available
    if (typeof sandboxState === 'undefined') return;

    const fixed = sandboxState.slice(0, 2);
    dom.condProbOutput.innerHTML = "<div class='status'>Analyzing Royal Outcomes...</div>";

    await new Promise(r => setTimeout(r, 400));

    const probs = engine.getConditionalStats(fixed);
    const sorted = Object.entries(probs)
        .filter(([id, p]) => p > 0.005)
        .sort((a, b) => b[1] - a[1]);

    let html = "<div class='prob-results'>";
    sorted.forEach(([id, p]) => {
        const rule = XAM_HUONG_RULES.find(r => r.id === id);
        const percent = (p * 100).toFixed(1);
        html += `
            <div class='prob-card'>
                <div class='label'>${rule ? rule.name : id}</div>
                <div class='value'>${percent}%</div>
                <div class='prob-bar-container'>
                    <div class='prob-bar' style='width: ${percent}%'></div>
                </div>
            </div>
        `;
    });
    html += "</div>";
    dom.condProbOutput.innerHTML = html;
}

function exportData() {
    const format = confirm("Export format:\nOK = JSON (Full Session)\nCancel = CSV (Basic History)") ? "json" : "csv";

    if (format === 'json') {
        const data = session.exportState();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `xam_huong_session_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
    } else {
        const logs = session.players[0].history;
        let csv = "Timestamp,Turn,Event,Change,Balance\n";
        logs.forEach(l => {
            csv += `${l.timestamp},${l.turn},${l.event},${l.change},${l.newBalance}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `xam_huong_history.csv`;
        a.click();
    }
}

// Start
init();
