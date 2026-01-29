# ⚜️ Xăm Hường Research Platform - Royal Edition

![Version](https://img.shields.io/badge/Version-3.5-gold) ![Theme](https://img.shields.io/badge/Theme-Cinematic_Royal-8e1b1b) ![Status](https://img.shields.io/badge/Status-Stable-success)

**A high-fidelity simulation of the traditional Hué game "Xăm Hường", integrated with modern mathematical analytics, a persistent economy, and a cinematic "Imperial Court" aesthetic.**

---

## 📖 Overview

The **Xăm Hường Research Platform** is more than just a game; it is a computational study of discrete probability and game theory. This **Royal Edition** elevates the experience by combining a rigorous mathematical engine with a visually stunning interface inspired by the Nguyễn Dynasty.

## Key Features

### Cinematic Visuals
-   **Imperial Aesthetics**: A color palette of Deep Mahogany, Antique Gold, and Royal Indigo.
-   **Glassmorphism UI**: Modern frosted glass panels with golden accents.
-   **3D Physics**: A CSS-based 3D bowl with realistic "shake" animations and dice physics.

### Advanced Logic Engine (`engine.js`)
-   **Exact Enumeration**: Calculates accurate probabilities based on a sample space of $6^6 = 46,656$ outcomes.
-   **Complex Classifiers**: Automatically detects all traditional rules:
    -   **Jackpot**: *Lục Hường* (6 Reds).
    -   **Royal Hands**: *Ngũ Hường*, *Tứ Hường*, *Phân Song Tam*.
    -   **Folk Hands**: *Suốt* (Straight), *Thượng Hạ Mã* (3 Pairs).
-   **Solver**: Built-in algorithm to optimize the "House Edge" or target a specific Win Rate by adjusting dice weights ($p_4$).

### Economy & Multiplayer (`script.js`)
-   **Session Management**: Supports local multiplayer with persistent player states.
-   **Global Jackpot**: A dynamic "Pot" system where 5% of every bet contributes to a communal Jackpot.
-   **Persistence**: All progress (Balance, History, Jackpot) is saved automatically to `localStorage`.

### Professional Analytics
-   **Equity Curve**: Real-time line chart tracking capitalization variance and player "luck" over time.
-   **Face Frequency Heatmap**: Visual grid identifying deviation in random number generation (RNG) distributions.
-   **Risk of Ruin Calculator**: Financial modeling tool to estimate the probability of bankruptcy based on current bankroll and bet sizing.

---

## Installation & Usage

### Prerequisites
-   A modern web browser (Chrome, Edge, Firefox, Safari).
-   No server required (runs entirely client-side).

### How to Run
1.  Clone or download this repository.
2.  Open **`index.html`** directly in your browser.

### User Guide
1.  **Play Tab**:
    -   Enter your **Bet** amount.
    -   Click **"Roll Dice"** to simulate a turn.
    -   Watch the bowl animation and receive your payout based on the active rules.
2.  **Sandbox Tab**:
    -   Click on individual dice to toggle their values.
    -   Verify how the engine classifies specific combinations manually.
3.  **Analytics Tab**:
    -   View the **Probability Distribution** chart.
    -   Monitor the **Equity Curve** to see your session performance.
    -   Use the **Risk Calculator** to plan your betting strategy.
    -   Check the **Heatmap** for RNG bias.
4.  **Heritage Tab**:
    -   Explore historical presets (Huế Court, Folk Village, Competitive).
5.  **Config Tab**:
    -   Adjust **Face Probabilities** (weights).
    -   Run the **Solver** to find optimal parameters for specific mathematical goals.

---

## 📂 Project Structure

```bash
xam_huong/
├── index.html        # Main Entry Point (UI Layout)
├── style.css         # Cinematic Royal Styles & Animations
├── engine.js         # Core Logic, Probability Model, Player Class
├── script.js         # UI Controller, Charts, Game Loop
├── logic/
│   ├── rules.js      # Rule Definitions & Payouts
│   └── heritage.js   # Historical Data & Presets
├── README.md         # Project Documentation
└── simulation_report.md # Mathematical Analysis Report
```

## License
This project is open-source and intended for educational and research purposes.

---
*Created by the Royal Research Team.*
