/**
 * Xăm Hường Engine - Core Logic
 * Implements advanced probability model and event predicates.
 */

const FACES = [1, 2, 3, 4, 5, 6];
const HUONG_FACE = 4;

// Default Paytable (Configurable)
const DEFAULT_PAYTABLE = {
    "LUC_HUONG": 100.0,
    "NGU_HUONG": 60.0,
    "TU_HUONG": 30.0,
    "PHAN_SONG_TAM": 20.0, // 3 Hường + 3 Same
    "TAM_HUONG": 8.0,
    "K=3": 3.0, // Generic 3 Hường (nếu ko phải Phân Song Tam)
    "K=2": 1.0, // Nhị Hường
    "K=1": 0.0, // Nhất Hường (thường là hòa hoặc tính điểm nhỏ)
    "SUUT": 10.0,
    "THUONG_HA_MA": 5.0, // 3 Pairs
    "NGU_TU": 10.0,      // 5 same (non-huong)
    "LUC_PHU": 50.0,     // 6 same (non-huong)
    "NO_EVENT": 0.0
};

// Priority for display/payout (Highest matches first)
const PRIORITY_ORDER = [
    "LUC_HUONG",
    "LUC_PHU",
    "NGU_HUONG",
    "NGU_TU",
    "PHAN_SONG_TAM",
    "TU_HUONG",
    "SUUT",
    "THUONG_HA_MA", // 3 Pairs
    "TAM_HUONG",
    "K=3",
    "K=2",
    "K=1"
];

class XamHuongEngine {
    constructor() {
        this.p4 = 0.1666667; // Default 1/6
        this.paytable = { ...DEFAULT_PAYTABLE };
    }

    setParams(p4, paytable) {
        this.p4 = p4;
        if (paytable) this.paytable = paytable;
    }

    /**
     * Classifier F: Maps count vector to Outcome Classes.
     * @param {number[]} counts - Array size 7 (index 1-6).
     * @returns {string[]} List of applicable tags.
     */
    classify(counts) {
        const K = counts[HUONG_FACE]; // Count of face 4
        let events = [];

        // --- 1. Hường-based Logic (K) ---
        if (K === 6) events.push("LUC_HUONG");
        if (K === 5) events.push("NGU_HUONG");

        if (K === 4) {
            events.push("TU_HUONG");
            // Check Tứ Tự Cáp logic here if needed (e.g., sum of other 2)
            // For now, base Tứ Hường is the primary event.
        }

        if (K === 3) {
            // Check Phân Song Tam: 3 Hường + 3 others same
            let other3Same = false;
            for (let f = 1; f <= 6; f++) {
                if (f !== HUONG_FACE && counts[f] === 3) {
                    other3Same = true; break;
                }
            }
            if (other3Same) events.push("PHAN_SONG_TAM");
            events.push("TAM_HUONG"); // Specific name
            events.push("K=3");       // Generic Class
        }

        if (K === 2) events.push("K=2");
        if (K === 1) events.push("K=1");

        // --- 2. Structural Logic (Non-Hường patterns) ---

        // SUUT: 1,1,1,1,1,1
        let isSuut = true;
        for (let f = 1; f <= 6; f++) if (counts[f] !== 1) { isSuut = false; break; }
        if (isSuut) events.push("SUUT");

        // LUC PHU: 6 same (non-huong)
        // NGU TU: 5 same (non-huong)
        // TU TU: 4 same (non-huong) -> potentially Tứ Tự Cáp
        let maxSame = 0;
        let pairs = 0;
        for (let f = 1; f <= 6; f++) {
            if (f === HUONG_FACE) continue; // Hường processed above
            if (counts[f] >= maxSame) maxSame = counts[f];
            if (counts[f] === 2) pairs++;
            if (counts[f] === 4) pairs += 2; // 4 counts as 2 pairs? usually no, strictly 2
            // Correct counting for "3 Pairs" logic
        }

        // Re-count pairs strictly for THUONG_HA_MA
        // 3 pairs means counts are like [2,2,2,0,0,0] (permutation)
        let pairCount = 0;
        for (let f = 1; f <= 6; f++) if (counts[f] === 2) pairCount++;
        if (pairCount === 3) events.push("THUONG_HA_MA");

        if (maxSame === 6) events.push("LUC_PHU");
        if (maxSame === 5) events.push("NGU_TU");

        // Fallback
        if (events.length === 0) events.push("NO_EVENT");
        return events;
    }

    /**
     * Resolves priority and payout for a single turn.
     */
    resolveRound(counts) {
        const events = this.classify(counts);
        let bestEvent = "NO_EVENT";
        let payout = 0;

        for (let ev of PRIORITY_ORDER) {
            if (events.includes(ev)) {
                bestEvent = ev;
                payout = this.paytable[ev] || 0;
                break;
            }
        }
        return { events, bestEvent, payout };
    }

    /**
     * Simulates one round using RNG.
     */
    simulate() {
        const counts = [0, 0, 0, 0, 0, 0, 0];
        const p_other = (1 - this.p4) / 5;

        for (let i = 0; i < 6; i++) {
            let r = Math.random();
            if (r < this.p4) {
                counts[HUONG_FACE]++;
            } else {
                let r2 = (r - this.p4) / (1 - this.p4);
                let idx = Math.floor(r2 * 5); // 0..4
                const others = [1, 2, 3, 5, 6];
                let face = others[idx] !== undefined ? others[idx] : 6;
                counts[face]++;
            }
        }
        return { counts, ...this.resolveRound(counts) };
    }

    /**
     * Exact Enumeration (The Solver)
     * Calculates P(Event) for ALL events in the PROBABILITY SPACE.
     * Iterates 462 vectors.
     */
    enumerateExact(target_p4 = null) {
        let p4 = target_p4 !== null ? target_p4 : this.p4;
        let p_other = (1 - p4) / 5;

        let total_prob = 0;
        let ev_sum = 0;

        // Track probabilities for EVERY event tag (not just the best one)
        let event_stats = {};

        // Helper to add
        const addStat = (ev, prob) => {
            if (!event_stats[ev]) event_stats[ev] = 0;
            event_stats[ev] += prob;
        };

        const process_partition = (counts) => {
            // Multinomial Prob
            let denom = 1;
            let prob_term = 1;
            for (let f = 1; f <= 6; f++) {
                denom *= this.factorial(counts[f]);
                let p_face = (f === HUONG_FACE) ? p4 : p_other;
                prob_term *= Math.pow(p_face, counts[f]);
            }
            let multinomial_coeff = 720 / denom; // 6! = 720
            let prob = multinomial_coeff * prob_term; // total coeff is 720/denom

            total_prob += prob;

            // Classify
            const { events, bestEvent, payout } = this.resolveRound(counts);

            // Accumulate Best Event (for Payout Distribution)
            addStat(`BEST_${bestEvent}`, prob);
            ev_sum += prob * payout;

            // Accumulate ALL predicates (for Theoretical Analysis like "P(K>=2)")
            events.forEach(ev => addStat(ev, prob));
        };

        // Generate Partitions
        const generate = (index, remaining, current_counts) => {
            if (index === 6) {
                current_counts[6] = remaining;
                process_partition(current_counts);
                return;
            }
            for (let i = 0; i <= remaining; i++) {
                current_counts[index] = i;
                generate(index + 1, remaining - i, current_counts);
            }
        };

        generate(1, 6, [0, 0, 0, 0, 0, 0, 0]);

        return {
            validity_check: total_prob, // Should be ~1.0
            ev: ev_sum,
            house_edge: 1 - ev_sum, // Assuming 1 unit bet
            stats: event_stats
        };
    }

    /**
     * Solver: Find p4 for Target Win Rate.
     */
    solveP4(target_event_name, target_rate) {
        let low = 0.05, high = 0.5;
        let best = low;
        for (let i = 0; i < 25; i++) {
            let mid = (low + high) / 2;
            let result = this.enumerateExact(mid);
            let prob = result.stats[target_event_name] || 0;
            if (prob < target_rate) low = mid;
            else high = mid;
            best = mid;
        }
        return best;
    }

    factorial(n) {
        if (n <= 1) return 1;
        let f = 1;
        for (let i = 2; i <= n; i++) f *= i;
        return f;
    }
}
