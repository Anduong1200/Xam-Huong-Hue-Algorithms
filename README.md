# Xăm Hường Huế Simulation 🎲

Một dự án mô phỏng hiện đại trò chơi **Xăm Hường** truyền thống của xứ Huế, được tích hợp **Engine Toán Học (Math Engine)** để phân tích xác suất và cân bằng trò chơi.

## 🌟 Tính Năng Nổi Bật

### 1. Mô Phỏng Chân Thực
- Giao diện Dark Mode hiện đại, tối giản.
- Hiệu ứng đổ xúc xắc (Dice Rolling) thị giác.
- Bộ xúc xắc được thiết kế đúng chuẩn Xăm Hường (Mặt 1 và 4 màu đỏ).

### 2. Engine Toán Học Mạnh Mẽ (`engine.js`)
- **Phân Loại Sự Kiện (Classifier)**: Tự động phát hiện các tổ hợp phức tạp:
  - **Lục Hường** (Jackpot), **Ngũ Hường**, **Tứ Hường**.
  - **Phân Song Tam** (3 Hường + 3 mặt giống nhau).
  - **Suốt** (1-2-3-4-5-6), **Thượng Hạ Mã** (3 Đôi).
- **Tính Toán Chính Xác (Exact Enumeration)**: Duyệt toàn bộ 46,656 trường hợp để tính xác suất Lý Thuyết.
- **Monte Carlo Simulator**: Chạy thử nghiệm hàng chục ngàn ván đấu ngay trên trình duyệt.

### 3. Công Cụ Cân Bằng Game (Tuning)
- **Slider $p_4$**: Điều chỉnh "độ may mắn" của mặt Hường (mặt 4).
- **Solver**: Tự động tìm tham số $p_4$ để đạt tỷ lệ thắng mong muốn (ví dụ: Set Win-Rate = 50%).

## 🚀 Cách Sử Dụng

1. Tải toàn bộ thư mục về máy.
2. Mở file `index.html` bằng trình duyệt web bất kỳ (Chrome, Edge, Firefox).
3. Bấm **"Đổ Hột"** để chơi.
4. Mở tab **"Config"** hoặc **"Analysis"** để trải nghiệm các tính năng phân tích.

## 📚 Tài Liệu Chi Tiết

Dự án đi kèm với bộ tài liệu phân tích chuyên sâu:

- **[simulation_report.md](./simulation_report.md)**: Báo cáo phân tích toán học, bảng xác suất chi tiết và chiến lược cân bằng game.
- **[walkthrough.md](./walkthrough.md)**: Hướng dẫn chi tiết các tính năng và cách vận hành.
- **[implementation_plan.md](./implementation_plan.md)**: Kế hoạch phát triển kỹ thuật.

## 🛠️ Công Nghệ

- **Frontend**: HTML5, CSS3 (Modern Flexbox/Grid), Vanilla JavaScript (ES6+).
- **Math**: Combinatorics & Probability Algorithms.

---

