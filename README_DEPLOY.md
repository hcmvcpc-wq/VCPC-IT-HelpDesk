
# Hướng dẫn Deploy IT Helpdesk lên Vercel

Dự án này sử dụng **Vite + React**. Để ứng dụng hoạt động, bạn cần đảm bảo Vercel thực hiện quy trình build:

1.  **Framework Preset**: Chọn **Vite**.
2.  **Build Command**: Để mặc định (`npm run build`).
3.  **Install Command**: Đảm bảo sử dụng `npm install --legacy-peer-deps` (đã cấu hình trong vercel.json).
4.  **Environment Variables**: Thêm `API_KEY` (Gemini API Key) vào phần Settings của dự án trên Vercel.

**Lưu ý quan trọng**: Nếu trước đó bạn đã thực hiện "Override" lệnh build/install thành `echo "skip"` hoặc `true` trên giao diện Vercel, hãy **TẮT** (hoặc xóa) các override đó đi để Vercel sử dụng cấu hình từ file `vercel.json` mới cập nhật.
