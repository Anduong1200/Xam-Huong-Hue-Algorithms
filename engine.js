const FACES = [1, 2, 3, 4, 5, 6];
const HUONG_FACE = 4;

/**
 * XamHuongEngine - Core Probability & Logic Engine
 */
class XamHuongEngine {
    constructor(numDice = 6, customRules = null) {
        this.numDice = numDice;
        // faceWeights[1..6], 0-indexed for internal use 0..5 or 1..6? 
        // Let's use 1-indexed for consistency with dice faces.
        this.faceWeights = [0, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6];
        this.rules = customRules || [];
        if (this.rules.length === 0) this.initDefaultRules();
    }

    initDefaultRules() {
        this.rules = [
            { id: "LUC_HUONG", name: "Lục Hường", score: 100, check: (c) => c[4] === 6 },
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
        // weights array [p1, p2, p3, p4, p5, p6]
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
        return { counts, ...this.resolveRound(counts) };
    }

    resolveRound(counts) {
        let activeRules = [];
        let maxScore = 0;
        let primaryEvent = "NONE";

        for (const rule of this.rules) {
            if (rule.check(counts)) {
                activeRules.push(rule.id);
                if (rule.score > maxScore) {
                    maxScore = rule.score;
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

        // Factorial cache
        const f = [1];
        for (let i = 1; i <= Math.max(this.numDice, 10); i++) f[i] = f[i - 1] * i;

        let ev = 0;
        const eventProbs = {};

        for (const p of partitions) {
            // Count dictionary for rules
            const counts = { 1: p[1], 2: p[2], 3: p[3], 4: p[4], 5: p[5], 6: p[6] };

            // Multinomial prob: (N! / product(ni!)) * product(pi^ni)
            let denom = 1;
            let probTerm = 1;
            for (let i = 1; i <= 6; i++) {
                denom *= f[p[i]] || 1;
                probTerm *= Math.pow(this.faceWeights[i], p[i]);
            }
            const multinomialCoeff = f[this.numDice] / denom;
            const prob = multinomialCoeff * probTerm;

            const res = this.resolveRound(counts);
            ev += prob * res.payout;

            // Stats by tag
            res.events.forEach(id => {
                eventProbs[id] = (eventProbs[id] || 0) + prob;
            });
            // Best event stats
            const bestKey = `BEST_${res.bestEvent}`;
            eventProbs[bestKey] = (eventProbs[bestKey] || 0) + prob;
        }

        return { ev, stats: eventProbs, houseEdge: (100 - ev) / 100 };
    }

    /**
     * DP approach for a specific face (e.g. Hường count distribution)
     * O(N) instead of O(N^5) partition complexity.
     * Useful for heatmaps of single-variable rules.
     */
    getFaceCountDistribution(faceIndex, nOverride = null) {
        const n = nOverride !== null ? nOverride : this.numDice;
        const p = this.faceWeights[faceIndex];
        const dist = new Array(n + 1).fill(0);

        // Binomial(n, p) = nCr * p^r * (1-p)^(n-r)
        // We can use DP to calculate binomial coeffs or just direct formula for stability
        const combinations = (n, k) => {
            if (k < 0 || k > n) return 0;
            if (k === 0 || k === n) return 1;
            if (k > n / 2) k = n - k;
            let res = 1;
            for (let i = 1; i <= k; i++) res = res * (n - i + 1) / i;
            return res;
        };

        for (let k = 0; k <= n; k++) {
            dist[k] = combinations(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
        }
        return dist;
    }

    /**
     * Conditional Stats: P(Event | subset)
     */
    getConditionalStats(fixedDice) {
        const remaining = this.numDice - fixedDice.length;
        if (remaining < 0) return {};

        const baseCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        fixedDice.forEach(d => baseCounts[d]++);

        const tempEngine = new XamHuongEngine(remaining);
        tempEngine.setWeights(this.faceWeights.slice(1));
        const subStats = tempEngine.calculateStats();

        // This calculateStats gives probs for 'remaining' dice.
        // We need to map these back to 'total' dice outcomes.
        // Actually, calculateStats on remaining dice gives P(subcounts).
        // The events it records are relative to subcounts.
        // We need a custom loop here.

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

    /**
     * Solver: Find p4 for target win rate of an event
     */
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
        this.setP4(1 / 6); // Reset or leave?
        return best;
    }

    solveHouseEdge(targetEdge) {
        let low = 0, high = 1;
        for (let i = 0; i < 20; i++) {
            let mid = (low + high) / 2;
            this.setP4(mid);
            let stats = this.calculateStats();
            if (stats.houseEdge > targetEdge) low = mid;
            else high = mid;
        }
        const best = high;
        this.setP4(1 / 6);
        return best;
    }
}
