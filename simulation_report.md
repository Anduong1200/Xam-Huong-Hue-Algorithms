# Báo Cáo Phân Tích & Tối Ưu Hóa Game Xăm Hường

## 1. Mô Hình Toán Học

### Không Gian Mẫu
Trò chơi sử dụng 6 viên xúc xắc. Tổng số kết quả có thể xảy ra:
$$ |\Omega| = 6^6 = 46,656 $$

### Định Nghĩa Biến
Gọi **p₄** là xác suất xuất hiện mặt Hường (4 chấm) trên một viên xúc xắc.
- Truyền thống: $ p_4 = 1/6 \approx 16.67\% $
- Biến đổi (Tuning): $ p_4 \in [0.05, 0.30] $

Xác suất các mặt còn lại: $ p_{other} = \frac{1 - p_4}{5} $

### Phân Loại Sự Kiện
Hệ thống sử dụng bộ phân loại đa tầng (Multi-layer Classifier):

1. **Dựa trên số lượng Hường (K)**:
   - **Lục Hường**: $ K=6 $ (Jackpot)
   - **Ngũ Hường**: $ K=5 $
   - **Tứ Hường**: $ K=4 $
   - **Tam Hường**: $ K=3 $
   - **Nhị Hường**: $ K=2 $ (Thắng cơ bản)

2. **Dựa trên cấu trúc (Structure)**:
   - **Suốt**: 6 mặt khác nhau {1,2,3,4,5,6}.
   - **Phân Song Tam**: 3 Hường + 3 mặt giống nhau (ví dụ: 4,4,4,2,2,2).
   - **Thượng Hạ Mã (3 Đôi)**: 3 cặp giống nhau (ví dụ: 1,1,3,3,6,6).
   - **Lục Phú**: 6 mặt giống nhau (không phải Hường).

## 2. Phân Tích Xác Suất (Baseline)

Tại mức công bằng ($ p_4 = 1/6 $), phân bố xác suất chính xác như sau:

| Sự kiện (Event) | Xác suất (Prob) | Tần suất (1 trong N) |
| :--- | :--- | :--- |
| **Lục Hường** | 0.0021% | ~1 / 46,656 |
| **Ngũ Hường** | 0.064% | ~1 / 1,555 |
| **Phân Song Tam**| 0.214% | ~1 / 466 |
| **Suốt** | 1.543% | ~1 / 64 |
| **K ≥ 3** (Tam+) | 6.23% | ~1 / 16 |
| **K ≥ 2** (Win) | 26.32% | ~1 / 3.8 |

> **Nhận xét**: Tỷ lệ thắng cơ bản (K ≥ 2) chỉ đạt **26%**, khá thấp so với các game casino hiện đại (thường 45-49%). Điều này làm game có độ biến động (volatility) cao.

## 3. Chiến Lược Tuning (Cân Bằng Game)

Để hiện đại hóa, ta có thể điều chỉnh tham số $ p_4 $ để đạt Win-Rate mục tiêu.

### Bảng Tuning $ p_4 $

Dưới đây là các mốc quan trọng để cấu hình game:

| Mục tiêu (Target) | Win-Rate | **Giá trị p₄ cần thiết** |
| :--- | :--- | :--- |
| Truyền thống | 26.3% | **0.1667** (1/6) |
| Cân bằng nhẹ | 35.0% | **0.1985** |
| Casino (Baccarat-like)| 45.0% | **0.2420** |
| Coin-flip | **50.0%** | **0.2645** |

### Tác Động Của Việc Tăng p₄
Khi tăng $ p_4 $ lên 0.2645 (để đạt 50% win rate):
- **Lục Hường**: Tăng từ 1/46k lên ~1/2.8k (Nổ hũ dễ hơn gấp 16 lần).
- **Phân Song Tam**: Tăng từ 0.21% lên 0.5%.
- **Suốt**: Giảm từ 1.54% xuống ~0.7% (Do mặt 4 chiếm ưu thế, khó ra đủ 6 mặt khác nhau hơn).

## 4. Kiến Nghị Thiết Kế (Game Design)

1. **House Edge**:
   - Nên giữ House Edge ở mức **2-4%**.
   - Với $ p_4 = 0.22 $ (Win rate ~40%), ta có thể thiết kế Paytable:
     - K=2: x1
     - K=3: x3
     - K=4: x10
     - Suốt: x5
   - Điều này tạo cảm giác chơi "dễ thở" hơn truyền thống nhưng vẫn đảm bảo lợi nhuận nhà cái.

2. **Cơ Chế Jackpot**:
   - Sử dụng **Lục Hường** làm Jackpot tích lũy.
   - Nếu để $ p_4 $ cao (game dễ), Jackpot sẽ nổ thường xuyên, nên giảm giá trị Jackpot.
   - Nếu muốn Jackpot giá trị cực lớn, phải giữ $ p_4 $ thấp hoặc yêu cầu thêm điều kiện phụ (ví dụ: Lục Hường + Màu Đỏ).

