# Hệ Thống Quản Lý Chai Máu

Một ứng dụng web đơn giản để theo dõi việc phân phối và trả lại chai máu giữa các khoa bệnh viện. Hệ thống này được thiết kế cho khoảng 20 người dùng nội bộ và cung cấp chức năng theo dõi chai máu với mã duy nhất.

## Tính Năng

- **Xác Thực Người Dùng**: Đăng nhập và đăng ký bảo mật với xác thực dựa trên JWT
- **Kiểm Soát Quyền Truy Cập**: Vai trò quản trị viên và người dùng thông thường với các quyền khác nhau
- **Quản Lý Khoa**: Theo dõi các khoa và số lượng chai chưa trả
- **Phân Phối Chai**: Phân phối nhiều chai cho các khoa với theo dõi theo lô
- **Trả Lại Chai**: Trả lại chai và xem lịch sử phân phối của chúng
- **Bảng Điều Khiển**: Tổng quan về chai, khoa và hoạt động gần đây
- **Chức Năng Tìm Kiếm**: Tìm kiếm khoa và chai
- **Thiết Kế Thích Ứng**: Hoạt động tốt trên máy tính để bàn và thiết bị di động

## Công Nghệ Sử Dụng

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Cơ sở dữ liệu**: MongoDB với Mongoose ODM
- **Xác thực**: JWT (JSON Web Tokens)
- **Phát triển**: Hỗ trợ phát triển cục bộ với dữ liệu giả

## Cấu Trúc Dự Án

```
hoa-chat/
├── public/                 # Tệp tĩnh frontend
│   ├── css/                # Stylesheet
│   │   └── styles.css      # Tệp CSS chính
│   ├── js/                 # Tệp JavaScript
│   │   ├── api.js          # Dịch vụ API cho giao tiếp backend
│   │   ├── app.js          # Tệp ứng dụng chính và dữ liệu giả
│   │   ├── auth.js         # Xử lý xác thực
│   │   └── ui.js           # Quản lý UI và tương tác
│   └── index.html          # Tệp HTML chính
├── src/                    # Mã nguồn backend
│   ├── controllers/        # Bộ điều khiển route
│   │   ├── auth.controller.js       # Bộ điều khiển xác thực
│   │   ├── bottle.controller.js     # Bộ điều khiển quản lý chai
│   │   └── department.controller.js # Bộ điều khiển quản lý khoa
│   ├── middleware/         # Hàm middleware
│   │   └── auth.middleware.js       # Middleware xác thực
│   ├── models/             # Mô hình cơ sở dữ liệu
│   │   ├── batch.model.js           # Mô hình lô
│   │   ├── bottle.model.js          # Mô hình chai
│   │   ├── department.model.js      # Mô hình khoa
│   │   └── user.model.js            # Mô hình người dùng
│   ├── routes/             # Route API
│   │   ├── auth.routes.js           # Route xác thực
│   │   ├── bottle.routes.js         # Route quản lý chai
│   │   └── department.routes.js     # Route quản lý khoa
│   └── index.js            # Điểm khởi đầu cho backend
├── .env                    # Biến môi trường
├── package.json            # Phụ thuộc và script dự án
└── README.md               # Tài liệu dự án
```

## Cài Đặt và Thiết Lập

### Yêu Cầu

- Node.js (v14 trở lên)
- MongoDB (cục bộ hoặc Atlas)

### Hướng Dẫn Thiết Lập

1. Clone kho lưu trữ:
   ```
   git clone <repository-url>
   cd hoa-chat
   ```

2. Cài đặt phụ thuộc:
   ```
   npm install
   ```

3. Tạo tệp `.env` trong thư mục gốc với nội dung sau:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/blood-bottles-db
   JWT_SECRET=your_jwt_secret_key_change_in_production
   ```

4. Khởi động ứng dụng:
   ```
   npm start
   ```
   
   Để phát triển với tự động khởi động lại:
   ```
   npm run dev
   ```

5. Truy cập ứng dụng tại `http://localhost:3000`

## Sử Dụng

### Thiết Lập Ban Đầu

1. Đăng nhập với tài khoản quản trị viên mặc định hoặc đăng ký người dùng mới
2. Thêm khoa từ bảng điều khiển quản trị
3. Thêm chai máu với mã duy nhất

### Phân Phối Chai

1. Điều hướng đến trang "Phân Phối Chai"
2. Chọn khoa nhận
3. Chọn người nhận từ khoa
4. Quét hoặc nhập mã chai
5. Thêm ghi chú nếu cần
6. Gửi phân phối

### Trả Lại Chai

1. Điều hướng đến trang "Trả Chai"
2. Quét hoặc nhập mã chai
3. Xác minh thông tin chai
4. Thêm ghi chú trả lại nếu cần
5. Gửi trả lại

### Quản Lý Khoa và Người Dùng

1. Quản trị viên có thể xem và quản lý tất cả khoa và người dùng
2. Xem các chai chưa trả cho từng khoa
3. Tìm kiếm các khoa hoặc chai cụ thể

## Chế Độ Phát Triển

Ứng dụng có thể chạy ở chế độ phát triển mà không có kết nối MongoDB bằng cách sử dụng dữ liệu giả:

1. Khởi động frontend mà không có backend
2. Ứng dụng sẽ phát hiện backend bị thiếu và sử dụng dữ liệu giả thay thế
3. Kiểm tra chức năng cốt lõi với người dùng, khoa và chai được xác định trước

## Người Dùng Giả Mặc Định (Chế Độ Phát Triển)

- **Người Dùng Quản Trị**: admin@hospital.org (bất kỳ mật khẩu nào cũng hoạt động trong chế độ giả)
- **Người Dùng Thông Thường**: john@hospital.org, jane@hospital.org, v.v.

## Giấy Phép

[Giấy Phép MIT](LICENSE)

## Người Đóng Góp

- [Tên Của Bạn](https://github.com/yourusername)
