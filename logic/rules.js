/**
 * rules.js - Xăm Hường Rule Definitions
 */

const RULE_CATEGORIES = {
    IMPERIAL: "Huế Court Style",
    FOLK: "Folk/Common Style",
    MODERN: "Modern/Commercial"
};

const XAM_HUONG_RULES = [
    // --- TOP TIER ---
    {
        id: "LUC_HUONG",
        name: "Lục Hường",
        description: "6 Red Dice (Face 4) - Pure Royalty",
        score: 100,
        isJackpot: true,
        category: RULE_CATEGORIES.IMPERIAL,
        check: (c) => c[4] === 6
    },
    {
        id: "LUC_PHU",
        name: "Lục Phú",
        description: "6 Dice of any other face",
        score: 50,
        category: RULE_CATEGORIES.IMPERIAL,
        check: (c) => {
            for (let i = 1; i <= 6; i++) if (i !== 4 && c[i] === 6) return true;
            return false;
        }
    },
    // --- HIGH TIER ---
    {
        id: "NGU_HUONG",
        name: "Ngũ Hường",
        description: "5 Red Dice",
        score: 60,
        category: RULE_CATEGORIES.IMPERIAL,
        check: (c) => c[4] === 5
    },
    {
        id: "TU_TU_CAP",
        name: "Tứ Tự Cáp",
        description: "4 Red Dice + Bonus from remaining dice",
        score: 30, // Base score
        category: RULE_CATEGORIES.IMPERIAL,
        check: (c) => c[4] === 4,
        getPayout: (c) => {
            let bonus = 0;
            for (let i = 1; i <= 6; i++) {
                if (i !== 4) bonus += (i * (c[i] || 0));
            }
            return 30 + bonus;
        }
    },
    {
        id: "NGU_TU",
        name: "Ngũ Tử",
        description: "5 Dice of any other face",
        score: 10,
        category: RULE_CATEGORIES.IMPERIAL,
        check: (c) => {
            for (let i = 1; i <= 6; i++) if (i !== 4 && c[i] === 5) return true;
            return false;
        }
    },
    // --- MID TIER ---
    {
        id: "TU_HUONG",
        name: "Tứ Hường",
        description: "4 Red Dice",
        score: 30,
        category: RULE_CATEGORIES.IMPERIAL,
        check: (c) => c[4] === 4
    },
    {
        id: "PHAN_SONG_TAM",
        name: "Phân Song Tam",
        description: "3 Red Dice + 3 of another face",
        score: 20,
        category: RULE_CATEGORIES.IMPERIAL,
        check: (c) => {
            if (c[4] !== 3) return false;
            for (let i = 1; i <= 6; i++) if (i !== 4 && c[i] === 3) return true;
            return false;
        }
    },
    // --- SPECIALS ---
    {
        id: "SUUT",
        name: "Suốt",
        description: "A sequence 1-2-3-4-5-6",
        score: 10,
        category: RULE_CATEGORIES.FOLK,
        check: (c) => {
            for (let i = 1; i <= 6; i++) if (c[i] !== 1) return false;
            return true;
        }
    },
    {
        id: "THUONG_HA_MA",
        name: "Thượng Hạ Mã",
        description: "3 Pairs",
        score: 5,
        category: RULE_CATEGORIES.FOLK,
        check: (c) => {
            let pairs = 0;
            for (let i = 1; i <= 6; i++) if (c[i] === 2) pairs++;
            return pairs === 3;
        }
    },
    // --- LOW TIER ---
    {
        id: "TAM_HUONG",
        name: "Tam Hường",
        description: "3 Red Dice",
        score: 8,
        category: RULE_CATEGORIES.IMPERIAL,
        check: (c) => c[4] === 3
    },
    {
        id: "NHI_HUONG",
        name: "Nhị Hường",
        description: "2 Red Dice",
        score: 1,
        category: RULE_CATEGORIES.IMPERIAL,
        check: (c) => c[4] === 2
    },
    {
        id: "NHAT_HUONG",
        name: "Nhất Hường",
        description: "1 Red Die",
        score: 0,
        category: RULE_CATEGORIES.IMPERIAL,
        check: (c) => c[4] === 1
    }
];

// Export for engine consumption
if (typeof module !== 'undefined') {
    module.exports = { XAM_HUONG_RULES, RULE_CATEGORIES };
}
