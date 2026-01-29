const FACES = [1, 2, 3, 4, 5, 6];
const HUONG_FACE = 4;

/**
 * Player Class - Manages individual player state
 */
class Player {
    constructor(id, name, balance = 1000, avatar = '👤') {
        this.id = id;
        this.name = name;
        this.balance = balance;
        this.avatar = avatar;
        this.history = []; // [{ turn, event, change, balance }]
    }

    addTransaction(turn, event, amount) {
        this.balance += amount;
        this.history.push({
            timestamp: new Date().toISOString(),
            turn: turn,
            event: event,
            change: amount,
            newBalance: this.balance
        });
    }
}

/**
 * GameSession - Manages the Multiplayer Game Loop & Economy
 */
/**
 * XamHuongSession - Manages the Multiplayer Game Loop & Economy
 */
class XamHuongSession {
    constructor(engine) {
        this.engine = engine;
        this.players = [];
        this.currentPlayerIndex = 0;
        this.turnCount = 0;
        this.jackpot = 5000; // Global Jackpot
        this.minBet = 10;
        this.logs = [];

        // Streak Stats
        this.currentStreak = 0; // >0 for Win, <0 for Loss
        this.maxWinStreak = 0;
        this.maxLossStreak = 0;
    }

    addPlayer(player) {
        this.players.push(player);
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    nextTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        if (this.currentPlayerIndex === 0) this.turnCount++;
        return this.getCurrentPlayer();
    }

    processBet(amount) {
        const player = this.getCurrentPlayer();
        if (player.balance < amount) throw new Error("Insufficient balance");

        player.addTransaction(this.turnCount, "BET", -amount);

        // Economy: 5% to Jackpot
        const jackpotCont = amount * 0.05;
        this.jackpot += jackpotCont;

        return { bet: amount, jackpotContribution: jackpotCont };
    }

    resolveRoll(amount) {
        const result = this.engine.simulate();
        const player = this.getCurrentPlayer();
        const ruleId = result.bestEvent;
        const rule = this.engine.rules.find(r => r.id === ruleId);

        let payout = 0;
        let isJackpotWin = false;

        if (rule) {
            // Check for Jackpot Win (Luc Huong - 6 Reds)
            if (ruleId === 'LUC_HUONG') {
                payout = this.jackpot;
                isJackpotWin = true;
                this.jackpot = 5000; // Reset to seed
            } else {
                payout = amount * result.payout;
            }
        }

        const netChange = -amount + payout;

        // Streak Logic
        if (netChange > 0) {
            if (this.currentStreak < 0) this.currentStreak = 0;
            this.currentStreak++;
            if (this.currentStreak > this.maxWinStreak) this.maxWinStreak = this.currentStreak;
        } else if (netChange < 0) {
            if (this.currentStreak > 0) this.currentStreak = 0;
            this.currentStreak--;
            if (Math.abs(this.currentStreak) > this.maxLossStreak) this.maxLossStreak = Math.abs(this.currentStreak);
        }

        if (payout > 0) {
            player.addTransaction(this.turnCount, isJackpotWin ? "JACKPOT" : "WIN_" + ruleId, payout);
        }

        this.logTransaction(player, rule ? rule.name : "None", amount, netChange, player.balance);

        return {
            ...result,
            payout,
            isJackpotWin,
            player,
            newBalance: player.balance,
            globalJackpot: this.jackpot,
            streaks: {
                current: this.currentStreak,
                maxWin: this.maxWinStreak,
                maxLoss: this.maxLossStreak
            }
        };
    }

    logTransaction(player, resultName, bet, netChange, newBalance) {
        const log = {
            timestamp: new Date().toLocaleTimeString(),
            player: player.name,
            result: resultName,
            bet: bet,
            change: netChange,
            balance: newBalance,
            isWin: netChange >= 0
        };
        this.logs.unshift(log); // Store object instead of string for better UI rendering
        if (this.logs.length > 50) this.logs.pop();
    }

    exportState() {
        return {
            players: this.players,
            jackpot: this.jackpot,
            turnCount: this.turnCount,
            currentPlayerIndex: this.currentPlayerIndex,
            logs: this.logs,
            stats: {
                currentStreak: this.currentStreak,
                maxWinStreak: this.maxWinStreak,
                maxLossStreak: this.maxLossStreak
            }
        };
    }

    importState(data) {
        if (!data) return;
        this.jackpot = data.jackpot || 5000;
        this.turnCount = data.turnCount || 0;
        this.currentPlayerIndex = data.currentPlayerIndex || 0;
        this.logs = data.logs || [];

        if (data.stats) {
            this.currentStreak = data.stats.currentStreak || 0;
            this.maxWinStreak = data.stats.maxWinStreak || 0;
            this.maxLossStreak = data.stats.maxLossStreak || 0;
        }

        // Rehydrate players
        if (data.players) {
            this.players = data.players.map(p => {
                const np = new Player(p.id, p.name, p.balance, p.avatar);
                np.history = p.history || [];
                return np;
            });
        }
    }
}

/**
 * XamHuongEngine - Core Probability & Logic Engine
 */
class XamHuongEngine {
    constructor(numDice = 6, customRules = null) {
        this.numDice = numDice;
        this.faceWeights = [0, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6];
        this.rules = customRules || [];
        if (this.rules.length === 0) this.initDefaultRules();

        // Analytics History (for Heatmaps)
        this.rollHistory = []; // { counts: [], timestamp }
    }

    initDefaultRules() {
        this.rules = [
            { id: "LUC_HUONG", name: "Lục Hường (Jackpot)", score: 100, check: (c) => c[4] === 6 },
            {
                id: "LUC_PHU", name: "Lục Phú", score: 50, check: (c) => {
                    for (let i = 1; i <= 6; i++) if (i !== 4 && c[i] === 6) return true;
                    return false;
                }
            },
            { id: "NGU_HUONG", name: "Ngũ Hường", score: 60, check: (c) => c[4] === 5 },
            {
                id: "NGU_TU", name: "Ngũ Tử", score: 10, check: (c) => {
                    for (let i = 1; i <= 6; i++) if (i !== 4 && c[i] === 5) return true;
                    return false;
                }
            },
            { id: "TU_HUONG", name: "Tứ Hường", score: 30, check: (c) => c[4] === 4 },
            {
                id: "PHAN_SONG_TAM", name: "Phân Song Tam", score: 20, check: (c) => {
                    if (c[4] !== 3) return false;
                    for (let i = 1; i <= 6; i++) if (i !== 4 && c[i] === 3) return true;
                    return false;
                }
            },
            {
                id: "SUUT", name: "Suốt", score: 10, check: (c) => {
                    for (let i = 1; i <= 6; i++) if (c[i] !== 1) return false;
                    return true;
                }
            },
            {
                id: "THUONG_HA_MA", name: "Thượng Hạ Mã", score: 5, check: (c) => {
                    let pairs = 0;
                    for (let i = 1; i <= 6; i++) if (c[i] === 2) pairs++;
                    return pairs === 3;
                }
            },
            { id: "TAM_HUONG", name: "Tam Hường", score: 8, check: (c) => c[4] === 3 },
            { id: "NHI_HUONG", name: "Nhị Hường", score: 1, check: (c) => c[4] === 2 },
            { id: "NHAT_HUONG", name: "Nhất Hường", score: 0, check: (c) => c[4] === 1 }
        ];
    }

    setNumDice(n) {
        this.numDice = parseInt(n) || 6;
    }

    setWeights(weights) {
        let sum = weights.reduce((a, b) => a + b, 0);
        if (sum === 0) {
            this.faceWeights = [0, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6];
        } else {
            this.faceWeights = [0, ...weights.map(w => w / sum)];
        }
    }

    setP4(p4) {
        const pOther = (1 - p4) / 5;
        this.setWeights([pOther, pOther, pOther, p4, pOther, pOther]);
    }

    /**
     * Simulation
     */
    simulate() {
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        const cdf = [0];
        let acc = 0;
        for (let i = 1; i <= 6; i++) {
            acc += this.faceWeights[i];
            cdf.push(acc);
        }

        for (let i = 0; i < this.numDice; i++) {
            const r = Math.random();
            for (let f = 1; f <= 6; f++) {
                if (r < cdf[f]) {
                    counts[f]++;
                    break;
                }
            }
        }

        // Record for Heatmap
        this.recordRoll(counts);

        return { counts, ...this.resolveRound(counts) };
    }

    recordRoll(counts) {
        this.rollHistory.push(counts);
        if (this.rollHistory.length > 10000) this.rollHistory.shift();
    }

    getFaceFrequency() {
        if (this.rollHistory.length === 0) return [0, 0, 0, 0, 0, 0];
        const totals = [0, 0, 0, 0, 0, 0, 0];
        this.rollHistory.forEach(c => {
            for (let f = 1; f <= 6; f++) totals[f] += c[f];
        });
        const totalRolls = this.rollHistory.length * this.numDice;
        return totals.slice(1).map(t => t / totalRolls);
    }

    resolveRound(counts) {
        let activeRules = [];
        let maxScore = 0;
        let primaryEvent = "NONE";

        for (const rule of this.rules) {
            if (rule.check(counts)) {
                activeRules.push(rule.id);
                // Support for dynamic payouts (e.g. Tứ Tự Cáp)
                const currentPayout = typeof rule.getPayout === 'function'
                    ? rule.getPayout(counts)
                    : (rule.score || 0);

                if (currentPayout > maxScore) {
                    maxScore = currentPayout;
                    primaryEvent = rule.id;
                }
            }
        }
        return { events: activeRules, bestEvent: primaryEvent, payout: maxScore };
    }

    /**
     * Exact Statistics using Partition Generation
     * Optimized for general N.
     */
    calculateStats() {
        const partitions = [];
        const generate = (index, rem, current) => {
            if (index === 6) {
                current[6] = rem;
                partitions.push([...current]);
                return;
            }
            for (let i = 0; i <= rem; i++) {
                current[index] = i;
                generate(index + 1, rem - i, current);
            }
        };
        generate(1, this.numDice, [0, 0, 0, 0, 0, 0, 0]);

        const f = [1];
        for (let i = 1; i <= Math.max(this.numDice, 10); i++) f[i] = f[i - 1] * i;

        let ev = 0;
        let secondMoment = 0;
        const eventProbs = {};

        for (const p of partitions) {
            const counts = { 1: p[1], 2: p[2], 3: p[3], 4: p[4], 5: p[5], 6: p[6] };
            let denom = 1;
            let probTerm = 1;
            for (let i = 1; i <= 6; i++) {
                denom *= f[p[i]] || 1;
                probTerm *= Math.pow(this.faceWeights[i], p[i]);
            }
            const prob = (f[this.numDice] / denom) * probTerm;

            const res = this.resolveRound(counts);
            // EV calculation uses raw score, but prompt implies custom economy. 
            // We use Rule Score as multiplier for EV calc.
            ev += prob * res.payout;
            secondMoment += prob * (res.payout * res.payout);

            res.events.forEach(id => {
                eventProbs[id] = (eventProbs[id] || 0) + prob;
            });
            const bestKey = `BEST_${res.bestEvent}`;
            eventProbs[bestKey] = (eventProbs[bestKey] || 0) + prob;
        }

        const variance = secondMoment - (ev * ev);
        const volatility = Math.sqrt(variance);

        return {
            ev,
            stats: eventProbs,
            houseEdge: (100 - ev) / 100, // Roughly
            volatility,
            entropy: this.calculateEntropy()
        };
    }

    calculateEntropy() {
        let h = 0;
        for (let i = 1; i <= 6; i++) {
            const p = this.faceWeights[i];
            if (p > 0) h -= p * Math.log2(p);
        }
        return h;
    }

    calculateRiskOfRuin(balance, bet, targetProfit) {
        const stats = this.calculateStats();
        // Simplified Logic for RoR
        // P(Win) approx by any payout
        const probNone = stats.stats['BEST_NONE'] || 0;
        const pWin = 1 - probNone;
        const pLoss = probNone;

        if (pWin >= pLoss) return 0.01; // Positive edge case

        const qp = pLoss / pWin;
        const b = balance / bet;
        const t = (balance + targetProfit) / bet;

        const prob = (Math.pow(qp, t) - Math.pow(qp, b)) / (Math.pow(qp, t) - 1);
        return Math.max(0, Math.min(1, prob));
    }

    getConditionalStats(fixedDice) {
        const remaining = this.numDice - fixedDice.length;
        if (remaining < 0) return {};

        const baseCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        fixedDice.forEach(d => baseCounts[d]++);

        // Recursive partition generation for remaining
        const partitions = [];
        const generate = (index, rem, current) => {
            if (index === 6) {
                current[6] = rem;
                partitions.push([...current]);
                return;
            }
            for (let i = 0; i <= rem; i++) {
                current[index] = i;
                generate(index + 1, rem - i, current);
            }
        };
        generate(1, remaining, [0, 0, 0, 0, 0, 0, 0]);

        const f = [1];
        for (let i = 1; i <= Math.max(remaining, 10); i++) f[i] = f[i - 1] * i;

        const condProbs = {};
        for (const p of partitions) {
            let denom = 1;
            let probTerm = 1;
            for (let i = 1; i <= 6; i++) {
                denom *= f[p[i]] || 1;
                probTerm *= Math.pow(this.faceWeights[i], p[i]);
            }
            const prob = (f[remaining] / denom) * probTerm;

            const finalCounts = { ...baseCounts };
            for (let i = 1; i <= 6; i++) finalCounts[i] += p[i];

            const res = this.resolveRound(finalCounts);
            res.events.forEach(id => {
                condProbs[id] = (condProbs[id] || 0) + prob;
            });
        }
        return condProbs;
    }

    solveP4(eventId, targetRate) {
        let low = 0, high = 1;
        for (let i = 0; i < 20; i++) {
            let mid = (low + high) / 2;
            this.setP4(mid);
            let stats = this.calculateStats();
            let p = stats.stats[eventId] || 0;
            if (p < targetRate) low = mid;
            else high = mid;
        }
        const best = high;
        this.setP4(1 / 6);
        return best;
    }

    solveHouseEdge(targetEdge) {
        let low = 0, high = 1;
        for (let i = 0; i < 20; i++) {
            let mid = (low + high) / 2;
            this.setP4(mid);
            let stats = this.calculateStats();
            // Simplify House Edge logic approximation
            if (stats.houseEdge > targetEdge) low = mid;
            else high = mid;
        }
        const best = high;
        this.setP4(1 / 6);
        return best;
    }
}
