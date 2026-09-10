# 🃏 Xì Dách Online — 4 file, chạy trên GitHub Pages

Game xì dách multiplayer đơn giản, không cần backend riêng.

## Vai trò
- Người **Tạo phòng** mặc định là **Cái / Chủ phòng**.
- Bạn bè nhập **mã phòng** để vào với vai trò **Người chơi**.
- Cái là máy chủ của ván chơi và phát trạng thái cho các người chơi.
- Có nút sao chép link mời; link có dạng `?room=ABC123`.

## 4 file
1. `index.html`
2. `style.css`
3. `app.js`
4. `README.md`

## Đưa lên GitHub
1. Tạo repository mới trên GitHub.
2. Upload đúng 4 file này vào thư mục gốc.
3. Vào **Settings → Pages**.
4. Chọn **Deploy from a branch**, branch `main`, thư mục `/root`.
5. Mở link GitHub Pages.
6. Người tạo phòng bấm **Tạo phòng — Tôi là Cái**.
7. Gửi mã phòng hoặc link mời cho bạn bè.

## Lưu ý quan trọng về multiplayer
Phiên bản này dùng **PeerJS/WebRTC** để kết nối trực tiếp giữa trình duyệt. Không cần server game riêng, nhưng trình duyệt vẫn cần Internet để kết nối dịch vụ signaling của PeerJS.

Nếu chủ phòng đóng tab/trình duyệt hoặc mất mạng, phòng sẽ mất.

## Luật đang có
- Bộ bài 52 lá.
- A = 1 hoặc 11.
- J/Q/K = 10.
- Mục tiêu gần 21 nhất.
- Quá 21 = quắc.
- A + 10/J/Q/K ở 2 lá đầu = Xì dách.
- Cái tự rút đến tối thiểu 17.
- So điểm để xác định thắng/hòa/thua.

## Giới hạn bản đầu
Đây là bản chơi vui, **chưa có tiền cược, tài khoản, database, chat hoặc chống gian lận server-side**. Vì game chạy trên GitHub Pages + WebRTC nên không nên dùng cho tiền thật.
