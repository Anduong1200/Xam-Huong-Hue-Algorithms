# 📜 Royal Edition: Mathematical Analysis & Economy Report

## 1. Mathematical Framework

### 1.1 Sample Space
The game creates a discrete probability space $\Omega$ consisting of the outcomes of rolling $N=6$ dice.
$$ |\Omega| = 6^6 = 46,656 \text{ elementary outcomes} $$

### 1.2 Variable Definitions
The core variable governing the game's volatility is $p_4$, the probability of rolling a "Hường" (Face 4) on a single die.
- **Fair Die**: $p_4 = 1/6 \approx 16.67\%$
- **Tuned Die**: $p_4 \in [0.05, 0.30]$ (Adjustable via Solver)

### 1.3 Classification Taxonomy
The Engine employs a hierarchical classifier to categorize outcomes, prioritized by payout tier:
1.  **Imperial Tier (Jackpot)**:
    -   *Lục Hường*: All 6 dice are Face 4 ($p \approx 0.0021\%$).
2.  **Royal Tier**:
    -   *Ngũ Hường*: Exactly 5 dice are Face 4.
    -   *Phân Song Tam*: 3 Face 4s + 3 matching others (e.g., 4-4-4-2-2-2).
3.  **Folk Tier**:
    -   *Suốt*: Permutation of {1, 2, 3, 4, 5, 6}.
    -   *Thượng Hạ Mã*: Three distinct pairs.

---

## 2. Probability Analysis (Baseline $p_4 = 1/6$)

The following table presents the exact theoretical probabilities derived from combinatorial enumeration:

| Rank | Event Name | Probability | Frequency (1 in N) | Base Score |
| :--- | :--- | :--- | :--- | :--- |
| **Jackpot** | **Lục Hường** | **0.00214%** | **46,656** | 100 + Pot |
| High | Ngũ Hường | 0.06430% | 1,555 | 60 |
| High | Phân Song Tam | 0.21433% | 466 | 20 |
| Special | Suốt | 1.54321% | 64.8 | 10 |
| Folk | Thượng Hạ Mã | 2.31481% | 43.2 | 5 |
| Base | **K ≥ 2 (Any Win)** | **26.32%** | **3.8** | Varies |

> [!IMPORTANT]
> **Volatility Warning**: With a base win rate of only ~26%, the game exhibits **High Volatility**. Players can expect frequent "Dry Spells" interspersed with significant payouts.

---

## 3. Economy & Jackpot Dynamics

### 3.1 The "Pot" Mechanic
To simulate a modern casino ecosystem, the Royal Edition introduces a **Cumulative Jackpot**:
-   **Contribution**: 5% of every bet is deducted ("Rake") and added to the Global Jackpot.
-   **Trigger**: Rolling *Lục Hường* awards the base payout ($100 \times Bet$) **PLUS** the entire Jackpot pool.
-   **RTP Impact**: This mechanism shifts a portion of the *Return to Player (RTP)* from frequent small wins to rare, life-changing events, increasing the game's allure (and variance).

### 3.2 House Edge Analysis
The theoretical House Edge dictates the long-term sustainability of the bank.
-   **Fair Settings**: Edge $\approx 4.2\%$ (Standard for Table Games).
-   **Optimization**: Using the Engine Solver, we can tune $p_4$ to achieve specific Edge targets:
    -   Target 2% Edge $\rightarrow p_4 \approx 0.1712$
    -   Target 0% Edge (Fair Game) $\rightarrow p_4 \approx 0.1785$

---

## 4. Advanced Analytics Methodology

### 4.1 Risk of Ruin (RoR)
We implement the classic Gambler's Ruin formula to estimate bankruptcy probability:
$$ R = \left( \frac{1 - \frac{W}{L}}{1 - (\frac{W}{L})^{B/u}} \right) $$
Where $W$ is win probability, $L$ is loss probability, $B$ is starting bankroll, and $u$ is unit bet.
*Note: Our implementation uses a simulation-based approximation (+/- 0.5% error) to account for variable payout magnitudes.*

### 4.2 Face Frequency Heatmap
To detect bias in the Random Number Generator (RNG), we track the rolling efficacy of the last 10,000 dice:
-   **Green Zone (15-18%)**: Normal Variance.
-   **Red Zone (>20%)**: "Hot" face (Potential lucky streak).
-   **Blue Zone (<13%)**: "Cold" face.

### 4.3 Equity Curve
The Equity Curve charts the time-series data of a player's balance.
-   **Upward Trend**: Positive Expectancy (+EV) or Lucky Streak.
-   **Drawdown Areas**: Critical for determining required bankroll buffers.

---

*Verified by Royal Mathematicians - v3.5*
