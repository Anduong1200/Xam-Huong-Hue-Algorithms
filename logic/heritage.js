/**
 * heritage.js - Digital Heritage & Presets
 */

const HERITAGE_PRESETS = [
    {
        id: "HUE_COURT",
        name: "Huế Imperial Court (Standard)",
        description: "The traditional rules used in the royal court of Huế. Focuses on strict Hường (Red) counts and hierarchy.",
        diceCount: 6,
        probabilities: [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6],
        rules: ["LUC_HUONG", "LUC_PHU", "NGU_HUONG", "NGU_TU", "TU_HUONG", "PHAN_SONG_TAM", "TAM_HUONG", "NHI_HUONG", "NHAT_HUONG"]
    },
    {
        id: "FOLK_VILLAGE",
        name: "Folk Village / Tet Style",
        description: "Commonly played during Lunar New Year. Includes 'Suốt' and 'Thượng Hạ Mã' for more dynamic outcomes.",
        diceCount: 6,
        probabilities: [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6],
        rules: ["LUC_HUONG", "SUUT", "THUONG_HA_MA", "TAM_HUONG", "NHI_HUONG"]
    },
    {
        id: "COMPETITIVE",
        name: "Competitive Research (Generalized)",
        description: "Balanced for mathematical study. Equal face weights, standard payouts.",
        diceCount: 6,
        probabilities: [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6],
        rules: ["LUC_HUONG", "NGU_HUONG", "TU_HUONG", "TAM_HUONG", "NHI_HUONG"]
    }
];

const HISTORICAL_CONTEXT = {
    origin: "Xăm Hường (or Sâm Hường) is a traditional game from the Nguyễn Dynasty era in Huế, Vietnam.",
    symbolism: "The red color of face 4 represents 'Hường' (Rose/Red), a symbol of luck and scholar status (Hồng Phước).",
    academic_context: "The game serves as an excellent case study for multinomial distributions and discrete probability analysis."
};

if (typeof module !== 'undefined') {
    module.exports = { HERITAGE_PRESETS, HISTORICAL_CONTEXT };
}
