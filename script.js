/**
 * script.js - Research Platform Controller
 */

const engine = new XamHuongEngine(6, XAM_HUONG_RULES);
let myChart = null;

// --- State Management ---
let state = {
    balance: 1000,
    bet: 10,
    jackpot: 5000,
    history: []
};

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

    // Sandbox
    sandboxBoard: document.getElementById('sandbox-board'),
    sandboxOutcome: document.getElementById('sandbox-outcome'),
    sandboxScore: document.getElementById('sandbox-score'),

    // Analysis
    engineMetrics: document.getElementById('engine-metrics'),
    condProbSetup: document.getElementById('cond-prob-setup'),
    btnCalcCond: document.getElementById('btn-calc-cond'),
    condProbOutput: document.getElementById('cond-prob-output'),

    // Heritage
    heritageList: document.getElementById('heritage-list'),
    heritageDesc: document.getElementById('heritage-desc'),

    // Config
    diceCountInput: document.getElementById('dice-count-input'),
    weightInputs: document.getElementById('weight-inputs'),
    probSumDisplay: document.getElementById('prob-sum-display'),
    btnApplyConfig: document.getElementById('btn-apply-config'),
    solverMode: document.getElementById('solver-mode'),
    solverTargetArea: document.getElementById('solver-target-area'),
    btnSolve: document.getElementById('btn-solve'),

    // HUD (Economy)
    balanceDisplay: document.getElementById('balance-display'),
    betInput: document.getElementById('bet-input'),
    jackpotDisplay: document.getElementById('jackpot-display'),

    // Research Insights
    volatilityDisplay: document.getElementById('metric-volatility'),
    entropyDisplay: document.getElementById('metric-entropy'),
    ruinDisplay: document.getElementById('metric-ruin'),

    // Global
    status: document.getElementById('log-status'),
    btnExport: document.getElementById('btn-export')
};

// --- Initialization ---
function init() {
    setupTabs();
    setupHeritageUI();
    setupWeightInputs();
    setupSolverUI();
    initChart();
    updateHUD();

    renderSandbox();
    updateAnalysis();

    bindEvents();

    dom.status.innerText = "Royal Palace Engine Expanded (v3.0).";
}

function updateHUD() {
    if (dom.balanceDisplay) dom.balanceDisplay.innerText = state.balance.toLocaleString();
    if (dom.jackpotDisplay) dom.jackpotDisplay.innerText = state.jackpot.toLocaleString();
    if (dom.betInput) state.bet = parseInt(dom.betInput.value) || 10;
}

function bindEvents() {
    dom.rollBtn.onclick = handleRoll;
    dom.btnApplyConfig.onclick = applyConfig;
    dom.btnSolve.onclick = handleSolve;
    dom.btnCalcCond.onclick = handleConditionalCalc;
    dom.btnExport.onclick = exportData;

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

            if (btn.dataset.tab === 'analysis') updateAnalysis();
        };
    });
}

// --- Heritage Logic ---
function setupHeritageUI() {
    dom.heritageList.innerHTML = '';
    const icons = {
        "HUE_COURT": "🏛️",
        "FOLK_VILLAGE": "🏮",
        "COMPETITIVE": "⚖️"
    };

    HERITAGE_PRESETS.forEach(preset => {
        const btn = document.createElement('button');
        btn.className = 'btn-preset';
        btn.innerHTML = `
            <span class="icon">${icons[preset.id] || "📜"}</span>
            <strong>${preset.name}</strong>
            <small>${preset.id}</small>
        `;
        btn.onclick = () => selectHeritage(preset);
        dom.heritageList.appendChild(btn);
    });
}

function selectHeritage(preset) {
    document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
    // Find button and mark active - simplified for now

    dom.heritageDesc.innerHTML = `
        <p>${preset.description}</p>
        <br>
        <p><strong>Configured Dice:</strong> ${preset.diceCount}</p>
        <p><strong>Rules Loaded:</strong> ${preset.rules.length}</p>
        <br>
        <button class="btn-royal" onclick="applyHeritage('${preset.id}')">Restore This Heritage</button>
    `;
}

window.applyHeritage = (id) => {
    const preset = HERITAGE_PRESETS.find(p => p.id === id);
    if (!preset) return;

    engine.setNumDice(preset.diceCount);
    engine.setWeights(preset.probabilities);
    dom.diceCountInput.value = preset.diceCount;
    updateWeightInputsUI();
    updateAnalysis();
    alert(`Engine synced to ${preset.name}`);
};

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
    document.querySelectorAll('.prob-input').forEach(input => sum += parseFloat(input.value || 0));
    dom.probSumDisplay.innerText = `Total: ${sum.toFixed(3)}`;
    dom.probSumDisplay.style.color = Math.abs(sum - 1.0) < 0.001 ? '#c5a059' : '#e74c3c';
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

// --- Game Logic ---
async function handleRoll() {
    updateHUD();
    if (state.balance < state.bet) {
        alert("Insufficient balance for this royal wager!");
        return;
    }

    dom.rollBtn.disabled = true;
    state.balance -= state.bet;
    state.jackpot += state.bet * 0.05; // 5% of bet to jackpot
    updateHUD();

    dom.bowl.classList.add('wiggle');
    dom.bowl.innerHTML = '<div class="placeholder">Churning Royal Dice...</div>';

    await new Promise(r => setTimeout(r, 800));

    const result = engine.simulate();
    renderDice(result.counts, dom.bowl);
    dom.bowl.classList.remove('wiggle');

    const rule = XAM_HUONG_RULES.find(r => r.id === result.bestEvent);
    dom.resultText.innerText = rule ? rule.name : "None";

    let winAmount = 0;
    if (rule) {
        if (rule.isJackpot) {
            winAmount = state.jackpot;
            state.jackpot = 5000; // Reset jackpot
            alert("🏛️ MEGA JACKPOT! You have achieved Lục Hường!");
        } else {
            winAmount = state.bet * result.payout;
        }
    }

    state.balance += winAmount;
    dom.payoutDisplay.innerText = winAmount > 0 ? `+${winAmount.toLocaleString()}` : "0";
    dom.payoutDisplay.style.color = winAmount > 0 ? "#c5a059" : "#e74c3c";

    updateHUD();
    dom.rollBtn.disabled = false;
    dom.status.innerText = `Result: ${result.bestEvent} (${winAmount})`;
}

function renderDice(counts, container) {
    container.innerHTML = '';
    const faces = [];
    for (let f = 1; f <= 6; f++) {
        for (let k = 0; k < counts[f]; k++) faces.push(f);
    }

    faces.forEach(val => {
        const d = document.createElement('div');
        d.className = `dice face-${val}`;
        d.innerHTML = createDots(val);
        container.appendChild(d);
    });
}

function createDots(face) {
    const isRed = (face === 4 || face === 1);
    const dotTag = isRed ? 'dot red' : 'dot';

    let dots = '';
    const patterns = {
        1: [1],
        2: ['2-1', '2-2'],
        3: ['3-1', '3-2', '3-3'],
        4: ['4-1', '4-2', '4-3', '4-4'],
        5: ['5-1', '5-2', '5-3', '5-4', '5-5'],
        6: ['6-1', '6-2', '6-3', '6-4', '6-5', '6-6']
    };

    patterns[face].forEach(p => {
        dots += `<span class="${dotTag} dot-${p}"></span>`;
    });
    return dots;
}

// --- Sandbox Logic ---
const sandboxState = [1, 2, 3, 4, 5, 6];

function renderSandbox() {
    dom.sandboxBoard.innerHTML = '';
    // Adapt to N dice
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
            updateSandboxResult();
        };
        dom.sandboxBoard.appendChild(d);
    });
    updateSandboxResult();
}

function updateSandboxResult() {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    sandboxState.forEach(v => counts[v]++);

    const res = engine.resolveRound(counts);
    dom.sandboxOutcome.innerText = res.bestEvent !== "NONE" ? XAM_HUONG_RULES.find(r => r.id === res.bestEvent).name : "None";
    dom.sandboxScore.innerText = res.payout;

    dom.condProbSetup.innerText = `[${sandboxState.slice(0, 2).join(', ')}]`;
}

// --- Analysis Logic ---
function initChart() {
    const ctx = document.getElementById('dist-chart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Event Probability (%)',
                data: [],
                backgroundColor: 'rgba(197, 160, 89, 0.6)',
                borderColor: '#c5a059',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function updateAnalysis() {
    const stats = engine.calculateStats();

    // Engine Metrics
    dom.engineMetrics.innerHTML = `
        <div class="metric-item"><span>Theoretical EV:</span> <strong>${stats.ev.toFixed(3)}</strong></div>
        <div class="metric-item"><span>House Edge:</span> <strong>${(stats.houseEdge * 100).toFixed(2)}%</strong></div>
        <div class="metric-item"><span>Dice Count (N):</span> <strong>${engine.numDice}</strong></div>
    `;

    // Mathematical Insights
    if (dom.volatilityDisplay) dom.volatilityDisplay.innerText = stats.volatility.toFixed(2);
    if (dom.entropyDisplay) dom.entropyDisplay.innerText = stats.entropy.toFixed(3) + " bits";

    const targetProfit = state.balance * 0.5;
    const ruin = engine.calculateRiskOfRuin(state.balance, state.bet, targetProfit);
    if (dom.ruinDisplay) dom.ruinDisplay.innerText = (ruin * 100).toFixed(1) + "%";

    // Chart
    const keys = XAM_HUONG_RULES.map(r => r.id).filter(id => stats.stats[id] > 0.0001);
    const labels = keys.map(id => XAM_HUONG_RULES.find(r => r.id === id).name);
    const data = keys.map(id => (stats.stats[id] * 100).toFixed(2));

    myChart.data.labels = labels;
    myChart.data.datasets[0].data = data;
    myChart.update();
}

async function handleConditionalCalc() {
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
                <div class='label'>${rule.name}</div>
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
    const stats = engine.calculateStats();
    let csv = "Event,Probability\n";
    XAM_HUONG_RULES.forEach(r => {
        csv += `${r.name},${(stats.stats[r.id] || 0)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xam_huong_data_N${engine.numDice}.csv`;
    a.click();
}

init();
