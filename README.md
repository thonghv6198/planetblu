# planetBLU — bộ khung dùng lại

Trang tĩnh thuần HTML/CSS/JS, chạy được bằng cách mở thẳng tệp `.html` (không cần
máy chủ). Bố cục dựng lại từ bản mẫu Readymag bằng cách đo toạ độ thật của từng
phần tử ở nhiều mốc cuộn, nên chuyển động khớp bản mẫu ở mọi vị trí.

## Cấu trúc

```
index.html  hoavarac.html  giants.html  event.html  archive.html  visit.html
config.js          ← mọi thứ phụ thuộc nội dung: menu, hiệu ứng, chỉnh tay
app.js             ← bộ máy chạy, KHÔNG cần sửa khi làm dự án mới
style.css
data-*.js          ← toạ độ và nội dung từng trang (bản máy tính)
data-mobile-*.js   ← bản điện thoại, dùng khi màn hẹp hơn 640px
assets/            ← ảnh, video, manifest.json, favicon-*.png
fonts/             ← Inter (tải sẵn, không gọi ra mạng)
tools/             ← công cụ đo và kiểm tra
```

Mỗi trang nạp đúng ba tệp dùng chung (`config.js`, `app.js`, `style.css`) cộng
hai tệp dữ liệu của riêng nó.

## Cách trang co giãn

Giống bản mẫu:

- **Bố cục điện thoại** chỉ dùng cho thiết bị cảm ứng có cửa sổ hẹp hơn 640px.
  Thu hẹp cửa sổ trên máy tính vẫn giữ bố cục máy tính, chỉ thu nhỏ lại; điện
  thoại xoay ngang cũng quay về bố cục máy tính. Xoay máy vượt ngưỡng thì trang
  tự nạp lại vì hai bố cục dùng hai bộ dữ liệu khác nhau.
- **Dưới 768px** thì thôi thu nhỏ: giữ nguyên cỡ chữ và bố cục, cho cuộn ngang.
- Ở khổ điện thoại, thanh điều hướng **không có dải nền** (bản mẫu cũng vậy) —
  nội dung trôi thẳng qua dưới nó. Logo đặt giữa để không đè lên nút mở menu bên
  trái và cụm EN / Planet BLU bên phải; đổi bằng `header.logo.viTriMobile`.

CSS bám theo lớp `bocuc-dt` / `bocuc-mt` mà `app.js` gắn lên thẻ `<html>`, chứ
không dùng `@media` theo bề rộng — thu hẹp cửa sổ máy tính vẫn là bố cục máy tính.

## Làm dự án mới trên cùng bố cục

**1. Tạo trang.** Nhân bản một trang có sẵn rồi đổi tên hiển thị:

```bash
python3 tools/tao-trang.py songnuoc "Sông nước"
python3 tools/tao-trang.py songnuoc "Sông nước" giants   # chọn trang mẫu khác
```

**2. Nối vào menu.** Thêm một mục vào `menuXo` trong `config.js` (script in sẵn
đoạn cần dán). Mỗi mục cách nhau 16px theo trục dọc.

**3. Thay nội dung.** Sửa `html` của từng phần tử trong `data-<slug>.js`. Muốn
biết mã `kNN` nào ứng với chữ nào:

```bash
python3 tools/liet-ke.py songnuoc          # tất cả
python3 tools/liet-ke.py songnuoc anh      # chỉ ảnh
python3 tools/do-logo.py                   # đo ô vuông ■ trong ảnh logo
```

**4. Thay ảnh.** Bỏ tệp mới vào `assets/` rồi sửa `src` của phần tử tương ứng.

**5. Đổi favicon.** Thay `assets/favicon-32.png`, `favicon-180.png` (biểu tượng khi
lưu vào màn hình chính iOS) và `favicon-512.png`. Đổi cả `<meta name="theme-color">`
trong các tệp `.html` cho khớp màu nền biểu tượng.

## config.js — sửa gì ở đâu

| Mục | Dùng để làm gì |
|---|---|
| `header.cao` | chiều cao thanh điều hướng (pixel màn hình) |
| `header.phongChu` | cỡ chữ trên thanh đó, `1` = giữ như bản mẫu |
| `menuXo` | menu xổ xuống khi rê vào mục điều hướng |
| `xemTruoc` | ảnh hiện lên khi rê vào một dòng sự kiện |
| `nhay` | bấm mục nào thì trượt tới phần nào trong cùng trang |
| `chinh` | dịch tay vị trí một phần tử (`dx`, `dy`) |
| `truot` | kéo dài đường trượt của một phần tử khi cuộn |
| `lienKet` | gắn liên kết cho phần tử bản mẫu bỏ trống |
| `oNhap` | kích thước ô nhập của biểu mẫu và khoảng đẩy nét kẻ xuống |
| `oChon` | trường nào là ô chọn (thay vì ô gõ chữ) và các lựa chọn của nó |
| `chu` | giãn chữ và giãn dòng tối thiểu; bỏ đi thì trả về đúng số đo bản mẫu |
| `rongToiThieu` | dưới bề rộng này thì thôi thu nhỏ, chuyển sang cuộn ngang (mặc định 768) |
| `trangNgoai` | địa chỉ ngoài cần đổi hướng về trang nội bộ |
| `trangGoc` | địa chỉ bản mẫu → trang tương ứng trong bản dựng lại |

Logo khai trong `header.logo`. Nếu khai `oVuong` (vị trí ô vuông ■ trong ảnh,
đo bằng `python3 tools/do-logo.py`) thì logo tự phóng và tự canh sao cho ô vuông
của nó trùng cỡ, trùng hàng với ô vuông của các mục điều hướng — đổi chiều cao
header hay cỡ chữ đều không phải chỉnh lại.

Khoá `kNN` trong `xemTruoc`, `nhay`, `chinh`, `truot`, `lienKet` là mã phần tử —
tra bằng `tools/liet-ke.py`.

**Bản điện thoại phải khai riêng.** `measure.js` đánh mã `kNN` độc lập cho từng bố
cục, nên cùng một mã ở hai bản trỏ vào hai phần tử khác hẳn. Vì vậy bản điện thoại
chỉ nhận cấu hình mang hậu tố `@mobile` (`'event.html@mobile'`); không khai thì bỏ
qua chứ không mượn số của bản máy tính. Tra mã bằng
`python3 tools/liet-ke.py mobile-<tên trang>`.

## Đo lại từ một bản mẫu khác

```bash
node tools/measure.js 6473183/ hoavarac          # bản máy tính
node tools/measure.js 6473183/ hoavarac mobile   # bản điện thoại
node tools/hover-scan.js 6473183/ hoavarac       # khối nào có hiệu ứng rê chuột
node tools/box-scan.js  6473183/ hoavarac        # khoảng chừa của ô vuông ■
python3 build.py hoavarac                        # dựng data-hoavarac.js
```

`measure.js` đánh mã `kNN` cho từng phần tử, ghi quỹ đạo ở các mốc cuộn cách nhau
50px cộng thêm đúng mốc đáy trang. `build.py` đổi số liệu đó thành `data-*.js`.

## Kiểm tra

```bash
python3 -m http.server 8811          # cần cho các công cụ dưới đây
node tools/check-links.js            # mọi liên kết dẫn đúng chỗ, ảnh không hỏng
node tools/check-menu.js             # menu xổ mở được ở mọi vị trí cuộn
node tools/compare.js && python3 tools/diff.py           # đối chiếu với bản mẫu
node tools/shot-mobile.js "" hoavarac event archive visit
python3 tools/diff-mobile.py                             # đối chiếu bản điện thoại
```

## Những chỗ cố ý khác bản mẫu

Ghi lại để sau này khỏi tưởng là lỗi:

- ô vuông ■ của "About us" và "Hoa và Rác" nằm cùng dòng với chữ
- menu Project giãn 16px thay vì 13px, ô vuông thẳng cột với ô của "Project"
- nhóm "Coming soon / Past event / Contact us" thẳng cột với "Current"
- hai ô vuông rời ở trang Visit về cùng cột với nhóm bên trên
- nhãn Name/Email chừa 13px với đường kẻ như các trường khác
- thanh điều hướng là dải nền trắng cao 50px, chữ to hơn 15%
- ảnh mở đầu trang chủ kéo lên sát header
- ảnh ở đoạn About us trượt hẳn sang trái để che kín cột chữ
- trang Giants — bản mẫu chưa dựng
- các trường trong biểu mẫu Visit bấm vào nhập được (bản mẫu chỉ vẽ đường kẻ);
  Event Name / Ticket Type / Calendar là ô chọn, mũi tên ▼ hạ xuống ngang trường
- vùng rê chuột của dòng sự kiện phủ cả ô, không riêng phần chữ
- logo đứng đầu thanh điều hướng, ô vuông của nó canh bằng ô vuông các mục, bấm về trang chủ
- "Coming soon" / "Past event" ở trang Event bấm được để xuống đúng phần
- giãn chữ để `normal` thay vì -0,2px, và giãn dòng tối thiểu 1,45 lần cỡ chữ
  cho khối nhiều dòng — bản mẫu bó chữ chặt hơn Inter vốn được thiết kế
- dòng sự kiện đang diễn ra ở trang Event dẫn về trang tác phẩm, thay vì mở
  trang soạn thảo Readymag như bản mẫu
