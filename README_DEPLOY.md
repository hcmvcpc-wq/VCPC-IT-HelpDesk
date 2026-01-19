
# Hướng dẫn Fix lỗi "npm install" trên Vercel

Nếu quá trình Deploy vẫn báo lỗi `Command "npm install" exited with 1`, hãy thực hiện các bước sau tại **Vercel Dashboard**:

1.  **Vào Project Settings** -> **Build & Development**.
2.  **Install Command**: Bật **Override** và nhập: `echo "skip"`
3.  **Build Command**: Bật **Override** và nhập: `echo "skip"`
4.  **Output Directory**: Bật **Override** và nhập: `.`
5.  **Framework Preset**: Chọn **Other**.
6.  Nhấn **Save** và **Redeploy**.

Ứng dụng IT Helpdesk này được thiết kế theo kiến trúc **Pure ESM**, sử dụng trình duyệt để xử lý trực tiếp các module từ CDN, nên hoàn toàn không cần môi trường Node.js để cài đặt thư viện. Việc bỏ qua các lệnh này là cách vận hành đúng đắn nhất cho loại ứng dụng này.
