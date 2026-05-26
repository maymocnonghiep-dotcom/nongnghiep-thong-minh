import express from "express";
import path from "path";
import cors from "cors";
import nodemailer from "nodemailer";
import fs from "fs";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";


const app = express();
const PORT = 3000;

  // Configure Email Transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Use a reliable path for the dist directory
  // In production, server.cjs is located inside the dist folder
  const isProduction = process.env.NODE_ENV === "production";
  
  // Define __dirname equivalent for ESM/CJS compatibility after bundling
  // @ts-ignore - __dirname is available in CJS (the bundled output)
  const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  const distPath = isProduction ? currentDir : path.join(process.cwd(), "dist");

  // Mock Products Data
  const products = [
    // --- Thiết bị tưới (15 products) ---
    {
      id: "1",
      sku: "TT-01",
      name: "Bét phun mưa xoay 360 độ",
      category: "Danh mục sản phẩm",
      group: "Thiết bị tưới",
      price: 15000,
      originalPrice: 20000,
      discount: 25,
      image: "https://plus.unsplash.com/premium_photo-1678116175513-ea5532d8471b?w=500&q=80",
      description: "Bét phun mưa chất lượng cao, độ phủ rộng, tiết kiệm nước.",
      specs: { "Bán kính": "3m-5m", "Lưu lượng": "150-250 l/h", "Áp suất": "1.5-3.0 bar" },
      reviews: []
    },
    {
      id: "6",
      sku: "TT-02",
      name: "Bét phun mưa bù áp S2000",
      category: "Danh mục sản phẩm",
      group: "Thiết bị tưới",
      price: 25000,
      originalPrice: 30000,
      discount: 16,
      image: "https://images.unsplash.com/photo-1596430349503-4552e185e9ea?w=500&q=80",
      description: "Đầu tưới bù áp giúp lưu lượng nước đồng đều trên mọi địa hình.",
      specs: { "Bán kính": "4m-7m", "Lưu lượng": "95 l/h Constant", "Tự làm sạch": "Có" },
      reviews: []
    },
    {
      id: "7",
      sku: "TT-03",
      name: "Đầu tưới nhỏ giọt 8 tia",
      category: "Danh mục sản phẩm",
      group: "Thiết bị tưới",
      price: 2000,
      image: "https://images.unsplash.com/photo-1594498257602-ebb1109a15f0?w=500&q=80",
      description: "Đầu nhỏ giọt có thể điều chỉnh lưu lượng, phù hợp tưới gốc cây.",
      specs: { "Điều chỉnh": "0-70 l/h", "Chân cắm": "6mm", "Góc phun": "8 tia" },
      reviews: []
    },
    {
      id: "8",
      sku: "TT-04",
      name: "Dây tưới nhỏ giọt dẹt 16mm",
      category: "Danh mục sản phẩm",
      group: "Thiết bị tưới",
      price: 1200,
      unit: "mét",
      image: "https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=500&q=80",
      description: "Dây tưới dẹt khoảng cách lỗ 20cm, tiết kiệm nước tối đa.",
      specs: { "Đường kính": "16mm", "Độ dày": "0.2mm", "Khoảng cách lỗ": "20cm" },
      reviews: []
    },
    {
      id: "9",
      sku: "TT-05",
      name: "Van điện từ 24V phi 34",
      category: "Danh mục sản phẩm",
      group: "Thiết bị tưới",
      price: 450000,
      originalPrice: 550000,
      discount: 18,
      image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500&q=80",
      description: "Van điều khiển tự động dùng cho hệ thống tưới hẹn giờ.",
      specs: { "Điện áp": "24VAC", "Kích thước": "Phi 34", "Thương hiệu": "Hunter" },
      reviews: []
    },
    {
      id: "10",
      sku: "TT-06",
      name: "Bộ lọc đĩa phi 60 AZUD",
      category: "Danh mục sản phẩm",
      group: "Thiết bị tưới",
      price: 650000,
      image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500&q=80",
      description: "Lọc sạch rác và cặn bẩn, bảo vệ hệ thống đầu tưới nhỏ giọt.",
      specs: { "Kích thước": "Phi 60", "Lưu lượng": "25m3/h", "Độ lọc": "120 mesh" },
      reviews: []
    },
    {
      id: "11",
      sku: "TT-07",
      name: "Timer hẹn giờ tưới dùng pin",
      category: "Danh mục sản phẩm",
      group: "Thiết bị tưới",
      price: 550000,
      image: "https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?w=500&q=80",
      description: "Thiết bị hẹn giờ thông minh cho sân vườn mini.",
      specs: { "Nguồn": "2 pin AA", "Số lần tưới": "Tối đa 8 lần/ngày", "Chống nước": "IP54" },
      reviews: []
    },
    {
      id: "12",
      sku: "TT-08",
      name: "Bét súng phun mưa lớn",
      category: "Danh mục sản phẩm",
      group: "Thiết bị tưới",
      price: 1850000,
      image: "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=500&q=80",
      description: "Súng phun bán kính lớn dùng cho cánh đồng lớn hoặc sân vận động.",
      specs: { "Bán kính": "25m-35m", "Lưu lượng": "15-25m3/h", "Chất liệu": "Hợp kim kẽm" },
      reviews: []
    },
    {
      id: "13",
      sku: "TT-09",
      name: "Ống LDPE 16mm cao cấp",
      category: "Danh mục sản phẩm",
      group: "Thiết bị tưới",
      price: 8500,
      unit: "mét",
      image: "https://images.unsplash.com/photo-1590644365607-1c5a919aa435?w=500&q=80",
      description: "Ống dẫn nhánh dẻo dai, dễ bục lỗ gắn đầu tưới.",
      specs: { "Đường kính": "16mm", "Độ dày": "1.2mm", "Áp suất": "4 bar" },
      reviews: []
    },
    {
      id: "14",
      sku: "TT-10",
      name: "Châm phân Venturi phi 34",
      category: "Danh mục sản phẩm",
      group: "Thiết bị tưới",
      price: 180000,
      image: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=500&q=80",
      description: "Tự động châm phân bón vào hệ thống tưới bằng áp lực nước.",
      specs: { "Kích thước": "Phi 34", "Tỉ lệ": "Điều chỉnh được", "Chất liệu": "Nhựa PVC" },
      reviews: []
    },
    {
      id: "15",
      sku: "TT-11",
      name: "Đầu phun sương 4 hướng",
      category: "Danh mục sản phẩm",
      group: "Thiết bị tưới",
      price: 12000,
      image: "https://images.unsplash.com/photo-1596430349503-4552e185e9ea?w=500&q=80",
      description: "Tạo màn sương mịn, làm mát nhà màng hoặc tưới lan.",
      specs: { "Góc phun": "360 độ (4 hướng)", "Hạt sương": "Siêu mịn", "Áp suất": "2-4 bar" },
      reviews: []
    },
    {
      id: "16",
      sku: "TT-12",
      name: "Khớp nối nhanh ống 16mm",
      category: "Danh mục sản phẩm",
      group: "Thiết bị tưới",
      price: 5000,
      image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500&q=80",
      description: "Phụ kiện kết nối ống LDPE nhanh chóng không cần keo.",
      specs: { "Kích thước": "16mm", "Kiểu": "Nối thẳng", "Chống rò rỉ": "Có" },
      reviews: []
    },
    {
      id: "17",
      sku: "TT-13",
      name: "Bét phun sương treo giàn",
      category: "Danh mục sản phẩm",
      group: "Thiết bị tưới",
      price: 18000,
      image: "https://images.unsplash.com/photo-1594498257602-ebb1109a15f0?w=500&q=80",
      description: "Lắp đặt treo trên cao, phun đều cho vườn ươm.",
      specs: { "Lưu lượng": "35 l/h", "Chống nhỏ giọt": "Có rơ-le", "Chất liệu": "Nhựa kỹ thuật" },
      reviews: []
    },
    {
      id: "18",
      sku: "TT-14",
      name: "Cột cắm bét phun mưa 45cm",
      category: "Danh mục sản phẩm",
      group: "Thiết bị tưới",
      price: 8000,
      image: "https://images.unsplash.com/photo-1530124560676-4fbc91abc6f2?w=500&q=80",
      description: "Cố định đầu tưới tại các gốc cây ăn trái.",
      specs: { "Chiều dài": "45cm", "Chất liệu": "Sợi thủy tinh/Nhựa", "Độ bền": "10 năm" },
      reviews: []
    },
    {
      id: "19",
      sku: "TT-15",
      name: "Đầu nhỏ giọt bù áp 4L/h",
      category: "Danh mục sản phẩm",
      group: "Thiết bị tưới",
      price: 3500,
      image: "https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=500&q=80",
      description: "Đảm bảo cung cấp đúng 4 lít nước mỗi giờ cho cây trồng.",
      specs: { "Lưu lượng": "4 l/h", "Bù áp": "Có", "Áp suất hoạt động": "0.5-4.0 bar" },
      reviews: []
    },

    // --- Đồ điện (15 products) ---
    {
      id: "4",
      sku: "DD-01",
      name: "Cầu dao tự động MCB Panasonic",
      category: "Danh mục sản phẩm",
      group: "Đồ điện",
      price: 125000,
      originalPrice: 150000,
      discount: 15,
      image: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=500&q=80",
      description: "Thiết bị bảo vệ an toàn điện cho hệ thống tưới.",
      specs: { "Dòng định mức": "16A", "Số cực": "1P", "Khả năng ngắt": "6kA" },
      reviews: []
    },
    {
      id: "5",
      sku: "DD-02",
      name: "Máy bơm nước đẩy cao 1HP",
      category: "Danh mục sản phẩm",
      group: "Đồ điện",
      price: 1200000,
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80",
      description: "Máy bơm mạnh mẽ cho vườn cây ăn trái quy mô vừa.",
      specs: { "Công suất": "750W", "Đẩy cao": "30m", "Lưu lượng": "5m3/h" },
      reviews: []
    },
    {
      id: "20",
      sku: "DD-03",
      name: "Khởi động từ LS 3P 18A",
      category: "Danh mục sản phẩm",
      group: "Đồ điện",
      price: 380000,
      image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500&q=80",
      description: "Contactor điều khiển động cơ máy bơm công suất lớn.",
      specs: { "Dòng tải": "18A", "Số cực": "3P", "Cuộn coil": "220V" },
      reviews: []
    },
    {
      id: "21",
      sku: "DD-04",
      name: "Timer hẹn giờ 24h Sinotimer",
      category: "Danh mục sản phẩm",
      group: "Đồ điện",
      price: 185000,
      image: "https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?w=500&q=80",
      description: "Hẹn giờ bật tắt máy bơm theo chu kỳ hàng ngày.",
      specs: { "Kiểu": "Digital", "Tổng công suất": "3000W", "Bước nhảy": "1 phút" },
      reviews: []
    },
    {
      id: "22",
      sku: "DD-05",
      name: "Tủ điện nhựa ngoài trời IP65",
      category: "Danh mục sản phẩm",
      group: "Đồ điện",
      price: 220000,
      image: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=500&q=80",
      description: "Vỏ tủ bảo vệ các thiết bị điện khỏi mưa nắng xâm nhập.",
      specs: { "Chất liệu": "Nhựa ABS", "Tiêu chuẩn": "IP65", "Kích thước": "300x200x150mm" },
      reviews: []
    },
    {
      id: "23",
      sku: "DD-06",
      name: "Cáp điện Cadivi 2x2.5mm2",
      category: "Danh mục sản phẩm",
      group: "Đồ điện",
      price: 18500,
      unit: "mét",
      image: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=500&q=80",
      description: "Dây cáp đồng nguyên chất đảm bảo tải điện ổn định.",
      specs: { "Tiết diện": "2.5mm2", "Lõi": "Đồng", "Vỏ": "PVC/PVC" },
      reviews: []
    },
    {
      id: "24",
      sku: "DD-07",
      name: "Đèn LED pha 50W tiết kiệm",
      category: "Danh mục sản phẩm",
      group: "Đồ điện",
      price: 280000,
      image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500&q=80",
      description: "Chiếu sáng an ninh và khu vực sản xuất trang trại.",
      specs: { "Công suất": "50W", "Ánh sáng": "Trắng/Vàng", "Chống nước": "IP66" },
      reviews: []
    },
    {
      id: "25",
      sku: "DD-08",
      name: "Aptomat chống giật Panasonic",
      category: "Danh mục sản phẩm",
      group: "Đồ điện",
      price: 450000,
      image: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=500&q=80",
      description: "Bảo vệ an toàn tính mạng khi có sự cố rò rỉ điện.",
      specs: { "Dòng rò": "30mA", "Dòng tải": "32A", "Thương hiệu": "Panasonic" },
      reviews: []
    },
    {
      id: "26",
      sku: "DD-09",
      name: "Công tắc phao điện RADAR",
      category: "Danh mục sản phẩm",
      group: "Đồ điện",
      price: 95000,
      image: "https://images.unsplash.com/photo-1596430349503-4552e185e9ea?w=500&q=80",
      description: "Điều khiển mực nước bồn chứa, tự động bật tắt bơm.",
      specs: { "Kiểu": "Phao kép", "Điện áp": "250V", "Ứng dụng": "Bể chứa/Bể ngầm" },
      reviews: []
    },
    {
      id: "27",
      sku: "DD-10",
      name: "Nút nhấn khẩn cấp Emergency",
      category: "Danh mục sản phẩm",
      group: "Đồ điện",
      price: 45000,
      image: "https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?w=500&q=80",
      description: "Ngắt điện toàn hệ thống ngay lập tức khi gặp sự cố.",
      specs: { "Màu sắc": "Đỏ", "Kiểu nhấn": "Giữ (Xoay để mở)", "Chân tiếp điểm": "1NO 1NC" },
      reviews: []
    },
    {
      id: "28",
      sku: "DD-11",
      name: "Biến tần INVT 1.5kW cho bơm",
      category: "Danh mục sản phẩm",
      group: "Đồ điện",
      price: 3200000,
      originalPrice: 3800000,
      discount: 15,
      image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500&q=80",
      description: "Tiết kiệm điện và bảo vệ động cơ khởi động mềm.",
      specs: { "Công suất": "1.5kW (2HP)", "Nguồn vào": "1 Phase 220V", "Đầu ra": "3 Phase 220V" },
      reviews: []
    },
    {
      id: "29",
      sku: "DD-12",
      name: "Cảm biến độ ẩm đất RS485",
      category: "Danh mục sản phẩm",
      group: "Đồ điện",
      price: 1250000,
      image: "https://images.unsplash.com/photo-1594498257602-ebb1109a15f0?w=500&q=80",
      description: "Kết nối hệ thống PLC/IOT để điều khiển tưới thông minh.",
      specs: { "Đo đạc": "Độ ẩm + Nhiệt độ", "Giao diện": "Modbus RS485", "Cấp bảo vệ": "IP68" },
      reviews: []
    },
    {
      id: "30",
      sku: "DD-13",
      name: "Quạt thông gió công nghiệp",
      category: "Danh mục sản phẩm",
      group: "Đồ điện",
      price: 1850000,
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80",
      description: "Thông thoáng khí cho nhà màng, trang trại chăn nuôi.",
      specs: { "Kích thước": "400x400mm", "Lưu lượng": "8000m3/h", "Điện áp": "220V" },
      reviews: []
    },
    {
      id: "31",
      sku: "DD-14",
      name: "Ổ cắm công nghiệp 3 chân",
      category: "Danh mục sản phẩm",
      group: "Đồ điện",
      price: 85000,
      image: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=500&q=80",
      description: "Ổ cắm chịu tải lớn, chống va đập và chống nước nhẹ.",
      specs: { "Dòng tối đa": "16A", "Tiêu chuẩn": "IP44", "Màu sắc": "Xanh dương" },
      reviews: []
    },
    {
      id: "32",
      sku: "DD-15",
      name: "Rơ le nhiệt LS bảo vệ bơm",
      category: "Danh mục sản phẩm",
      group: "Đồ điện",
      price: 195000,
      image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500&q=80",
      description: "Tự động ngắt khi động cơ máy bơm quá tải.",
      specs: { "Dải cài đặt": "9A-13A", "Dùng cho": "Contactor MC-18b", "Hãng": "LS" },
      reviews: []
    },

    // --- Vật tư nước (15 products) ---
    {
      id: "2",
      sku: "VT-01",
      name: "Ống nhựa HDPE Tiền Phong Phi 20",
      category: "Danh mục sản phẩm",
      group: "Vật tư nước",
      price: 25000,
      unit: "mét",
      image: "https://images.unsplash.com/photo-1590644365607-1c5a919aa435?w=500&q=80",
      description: "Ống HDPE bển bỉ, chịu áp lực tốt.",
      specs: { "Đường kính": "20mm", "Độ dày": "2.0mm", "Áp suất": "PN10" },
      reviews: []
    },
    {
      id: "33",
      sku: "VT-02",
      name: "Ống PVC Tiền Phong Phi 27",
      category: "Danh mục sản phẩm",
      group: "Vật tư nước",
      price: 18000,
      unit: "mét",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80",
      description: "Ống nhựa PVC chất lượng cao cho hệ thống cấp thoát nước.",
      specs: { "Đường kính": "27mm", "Độ dày": "2.2mm", "Thương hiệu": "Tiền Phong" },
      reviews: []
    },
    {
      id: "34",
      sku: "VT-03",
      name: "Van bi nhựa PVC phi 34",
      category: "Danh mục sản phẩm",
      group: "Vật tư nước",
      price: 35000,
      image: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=500&q=80",
      description: "Van khóa nước chắc chắn, tay gạt nhẹ nhàng.",
      specs: { "Kích thước": "Phi 34", "Kiểu": "Dán keo", "Chống tia UV": "Có" },
      reviews: []
    },
    {
      id: "35",
      sku: "VT-04",
      name: "Tê nhựa PVC phi 21",
      category: "Danh mục sản phẩm",
      group: "Vật tư nước",
      price: 3000,
      image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500&q=80",
      description: "Phụ kiện chia 3 đường ống nước PVC.",
      specs: { "Kích thước": "Phi 21", "Góc": "90 độ", "Thương hiệu": "Bình Minh" },
      reviews: []
    },
    {
      id: "36",
      sku: "VT-05",
      name: "Co nhựa PVC phi 21",
      category: "Danh mục sản phẩm",
      group: "Vật tư nước",
      price: 2500,
      image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500&q=80",
      description: "Phụ kiện bẻ góc 90 độ cho ống PVC.",
      specs: { "Kích thước": "Phi 21", "Màu sắc": "Xám", "Chất liệu": "uPVC" },
      reviews: []
    },
    {
      id: "37",
      sku: "VT-06",
      name: "Nối nhựa PVC phi 21",
      category: "Danh mục sản phẩm",
      group: "Vật tư nước",
      price: 2000,
      image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500&q=80",
      description: "Phụ kiện kết nối 2 đầu ống cùng kích thước.",
      specs: { "Kích thước": "Phi 21", "Kiểu": "Nối trơn", "Chịu lực": "Có" },
      reviews: []
    },
    {
      id: "38",
      sku: "VT-07",
      name: "Keo dán ống nhựa Bình Minh",
      category: "Danh mục sản phẩm",
      group: "Vật tư nước",
      price: 25000,
      image: "https://images.unsplash.com/photo-1530124560676-4fbc91abc6f2?w=500&q=80",
      description: "Keo dán chuyên dụng liên kết các mối nối PVC cực kỳ chắc chắn.",
      specs: { "Trọng lượng": "100g/hộp", "Thời gian khô": "2-5 phút", "An toàn": "Đạt chuẩn" },
      reviews: []
    },
    {
      id: "39",
      sku: "VT-08",
      name: "Băng cao su non (Keo tan)",
      category: "Danh mục sản phẩm",
      group: "Vật tư nước",
      price: 5000,
      image: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=500&q=80",
      description: "Chống rò rỉ tại các đầu ren của phụ kiện nước.",
      specs: { "Độ dài": "10m", "Chiều rộng": "12mm", "Chất liệu": "PTFE" },
      reviews: []
    },
    {
      id: "40",
      sku: "VT-09",
      name: "Ống gân xoắn Cam phi 32",
      category: "Danh mục sản phẩm",
      group: "Vật tư nước",
      price: 15000,
      unit: "mét",
      image: "https://images.unsplash.com/photo-1590644365607-1c5a919aa435?w=500&q=80",
      description: "Ống luồn dây cáp điện hoặc dẫn nước gầm đất.",
      specs: { "Đường kính": "32/42 mm", "Kiểu": "Ống xoắn", "Chất liệu": "HDPE" },
      reviews: []
    },
    {
      id: "41",
      sku: "VT-10",
      name: "Lược rác (Lupe) phi 60",
      category: "Danh mục sản phẩm",
      group: "Vật tư nước",
      price: 115000,
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80",
      description: "Ngăn rác và giữ nước trong ống hút của máy bơm.",
      specs: { "Kích thước": "Phi 60", "Màu sắc": "Đen", "Kiểu": "Lưới nhựa" },
      reviews: []
    },
    {
      id: "42",
      sku: "VT-11",
      name: "Bồn nước nhựa 1000L đứng",
      category: "Danh mục sản phẩm",
      group: "Vật tư nước",
      price: 1850000,
      image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500&q=80",
      description: "Bồn chứa nước sạch cho gia đình và sản xuất.",
      specs: { "Dung tích": "1000 Lít", "Kiểu dáng": "Đứng", "Bảo hành": "10 năm" },
      reviews: []
    },
    {
      id: "43",
      sku: "VT-12",
      name: "Nối giảm PVC 27-21",
      category: "Danh mục sản phẩm",
      group: "Vật tư nước",
      price: 4500,
      image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500&q=80",
      description: "Phụ kiện chuyển đổi từ ống lớn xuống ống nhỏ.",
      specs: { "Đầu lớn": "Phi 27", "Đầu nhỏ": "Phi 21", "Màu": "Xám" },
      reviews: []
    },
    {
      id: "44",
      sku: "VT-13",
      name: "Rắc co nhựa PVC phi 34",
      category: "Danh mục sản phẩm",
      group: "Vật tư nước",
      price: 28000,
      image: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=500&q=80",
      description: "Giúp tháo lắp bảo trì đường ống dễ dàng không cần cắt ống.",
      specs: { "Kích thước": "Phi 34", "Kiểu": "Dán keo", "Gioăng cao su": "Có" },
      reviews: []
    },
    {
      id: "45",
      sku: "VT-14",
      name: "Van một chiều lá lật phi 49",
      category: "Danh mục sản phẩm",
      group: "Vật tư nước",
      price: 155000,
      image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=500&q=80",
      description: "Chỉ cho nước chảy theo một chiều, bảo vệ thiết bị đo.",
      specs: { "Kích thước": "Phi 49", "Cấu tạo": "Lá lật nhựa", "Áp suất": "PN10" },
      reviews: []
    },
    {
      id: "46",
      sku: "VT-15",
      name: "Ống mềm tưới cây 3 lớp",
      category: "Danh mục sản phẩm",
      group: "Vật tư nước",
      price: 12000,
      unit: "mét",
      image: "https://images.unsplash.com/photo-1590644365607-1c5a919aa435?w=500&q=80",
      description: "Dây dẫn nước dẻo, bền chắc cho sân vườn.",
      specs: { "Đường kính": "Phi 16", "Cấu tạo": "3 lớp nhựa + sợi", "Chống xoắn": "Có" },
      reviews: []
    },

    // --- Dụng cụ làm vườn (15 products) ---
    {
      id: "3",
      sku: "GL-01",
      name: "Kìm bấm COS thủy lực YQK-70",
      category: "Danh mục sản phẩm",
      group: "Dụng cụ làm vườn",
      price: 850000,
      image: "https://images.unsplash.com/photo-1530124560676-4fbc91abc6f2?w=500&q=80",
      description: "Dụng cụ chuyên nghiệp dùng trong bảo trì trang trại.",
      specs: { "Lực bấm": "8 tấn", "Phạm vi": "4-70 mm2", "Trọng lượng": "3kg" },
      reviews: []
    },
    {
      id: "47",
      sku: "GL-02",
      name: "Kéo cắt cành trên cao 3m",
      category: "Danh mục sản phẩm",
      group: "Dụng cụ làm vườn",
      price: 650000,
      image: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&q=80",
      description: "Hỗ trợ cắt tỉa cành ở độ cao an toàn từ mặt đất.",
      specs: { "Chiều dài": "Thu gọn 1.8m - Ép dài 3.0m", "Lưỡi": "Thép SK5 Nhật", "Kiểu": "Bóp tay" },
      reviews: []
    },
    {
      id: "48",
      sku: "GL-03",
      name: "Cưa cầm tay gấp gọn",
      category: "Danh mục sản phẩm",
      group: "Dụng cụ làm vườn",
      price: 135000,
      image: "https://images.unsplash.com/photo-1516211697506-8360bd7704b2?w=500&q=80",
      description: "Dễ dàng mang theo khi đi vườn, lưỡi cưa sắc bén.",
      specs: { "Chiều dài lưỡi": "210mm", "Tay cầm": "Cao su chống trượt", "Gấp gọn": "Có" },
      reviews: []
    },
    {
      id: "49",
      sku: "GL-04",
      name: "Cuốc cán sắt đa năng",
      category: "Danh mục sản phẩm",
      group: "Dụng cụ làm vườn",
      price: 185000,
      image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=500&q=80",
      description: "Dụng cụ đào xới, làm cỏ hiệu quả cho đất cứng.",
      specs: { "Chất liệu": "Thép nhíp xe", "Chiều dài cán": "1.2m", "Trọng lượng": "1.5kg" },
      reviews: []
    },
    {
      id: "50",
      sku: "GL-05",
      name: "Xẻng inox làm vườn cao cấp",
      category: "Danh mục sản phẩm",
      group: "Dụng cụ làm vườn",
      price: 95000,
      image: "https://images.unsplash.com/photo-1530124560676-4fbc91abc6f2?w=500&q=80",
      description: "Xẻng nhỏ gọn, không gỉ, bền đẹp theo thời gian.",
      specs: { "Chất liệu": "Inox 304", "Kiểu": "Xẻng mũi nhọn", "Chiều dài": "30cm" },
      reviews: []
    },
    {
      id: "51",
      sku: "GL-06",
      name: "Bình xịt thuốc 20L chạy điện",
      category: "Danh mục sản phẩm",
      group: "Dụng cụ làm vườn",
      price: 1450000,
      image: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=500&q=80",
      description: "Phun thuốc bảo vệ thực vật nhanh chóng, không mỏi tay.",
      specs: { "Dung tích": "20 Lít", "Ắc quy": "12V-8Ah", "Thời gian": "4-6 giờ/lần sạc" },
      reviews: []
    },
    {
      id: "52",
      sku: "GL-07",
      name: "Kéo cắt cỏ cán dài 60cm",
      category: "Danh mục sản phẩm",
      group: "Dụng cụ làm vườn",
      price: 245000,
      image: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=500&q=80",
      description: "Tạo hình cây cảnh và cắt tỉa thảm cỏ chuyên nghiệp.",
      specs: { "Chiều dài": "60cm", "Lưỡi": "Thép tôi cao tần", "Tay cầm": "Hợp kim nhôm" },
      reviews: []
    },
    {
      id: "53",
      sku: "GL-08",
      name: "Dao ghép cành chuyên dụng",
      category: "Danh mục sản phẩm",
      group: "Dụng cụ làm vườn",
      price: 65000,
      image: "https://images.unsplash.com/photo-1516211697506-8360bd7704b2?w=500&q=80",
      description: "Lưỡi dao cực mỏng và sắc, giúp vết ghép nhanh liền.",
      specs: { "Chất liệu": "Thép carbon", "Cán": "Gỗ tự nhiên", "Độ sắc": "Như dao cạo" },
      reviews: []
    },
    {
      id: "54",
      sku: "GL-09",
      name: "Dây buộc cành tự hủy",
      category: "Danh mục sản phẩm",
      group: "Dụng cụ làm vườn",
      price: 25000,
      unit: "cuộn",
      image: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=500&q=80",
      description: "Cố định cành ghép, tự phân hủy sau khi mối ghép liền.",
      specs: { "Chiều rộng": "2cm", "Chiều dài": "100m", "Chất liệu": "Nhựa sinh học PE" },
      reviews: []
    },
    {
      id: "55",
      sku: "GL-10",
      name: "Máy cắt cỏ Makita 18V",
      category: "Danh mục sản phẩm",
      group: "Dụng cụ làm vườn",
      price: 4850000,
      image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=500&q=80",
      description: "Máy cắt cỏ chạy pin êm ái, cơ động cho khuôn viên rộng.",
      specs: { "Nguồn": "Pin 18V LXT", "Chiều rộng cắt": "230mm", "Trọng lượng": "2.8kg" },
      reviews: []
    },
    {
      id: "56",
      sku: "GL-11",
      name: "Bay làm vườn mini bộ 3 món",
      category: "Danh mục sản phẩm",
      group: "Dụng cụ làm vườn",
      price: 55000,
      image: "https://images.unsplash.com/photo-1530124560676-4fbc91abc6f2?w=500&q=80",
      description: "Công cụ nhỏ gọn cho chậu hoa và vườn ban công.",
      specs: { "Gồm": "Bay, Cào, Xới", "Chất liệu": "Thép sơn tĩnh điện", "Tay cầm": "Gỗ" },
      reviews: []
    },
    {
      id: "57",
      sku: "GL-12",
      name: "Rổ nhựa thu hoạch nông sản",
      category: "Danh mục sản phẩm",
      group: "Dụng cụ làm vườn",
      price: 35000,
      image: "https://images.unsplash.com/photo-1594498257602-ebb1109a15f0?w=500&q=80",
      description: "Rổ thưa giúp thông thoáng trái cây khi vận chuyển.",
      specs: { "Kích thước": "40x30x15cm", "Chất liệu": "Nhựa HDPE tái sinh", "Màu": "Đỏ/Vàng" },
      reviews: []
    },
    {
      id: "58",
      sku: "GL-13",
      name: "Xe rùa (Xe cút kít) bánh hơi",
      category: "Danh mục sản phẩm",
      group: "Dụng cụ làm vườn",
      price: 1250000,
      image: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=500&q=80",
      description: "Vận chuyển phân bón, đất đá trong trang trại dễ dàng.",
      specs: { "Thùng": "Tôn dày 1.2mm", "Bánh": "Hơi 4.00-8", "Tải trọng": "150kg" },
      reviews: []
    },
    {
      id: "59",
      sku: "GL-14",
      name: "Lưới che nắng Thái Lan 70%",
      category: "Danh mục sản phẩm",
      group: "Dụng cụ làm vườn",
      price: 12500,
      unit: "mét vuông",
      image: "https://images.unsplash.com/photo-1590644365607-1c5a919aa435?w=500&q=80",
      description: "Bảo vệ cây trồng khỏi nắng gắt, bền bỉ trên 5 năm.",
      specs: { "Độ che": "70%", "Màu sắc": "Đen/Xanh", "Khổ rộng": "2m/3m" },
      reviews: []
    },
    {
      id: "60",
      sku: "GL-15",
      name: "Khay gieo hạt 104 lỗ",
      category: "Danh mục sản phẩm",
      group: "Dụng cụ làm vườn",
      price: 12000,
      image: "https://images.unsplash.com/photo-1516211697506-8360bd7704b2?w=500&q=80",
      description: "Ươm mầm rau màu, hoa kiểng chuyên nghiệp.",
      specs: { "Số lỗ": "104", "Chất liệu": "Nhựa PVC mỏng", "Tái sử dụng": "2-3 lần" },
      reviews: []
    },

    // --- Camera An Ninh (5 products) ---
    {
      id: "61",
      sku: "CAM-01",
      name: "Camera Ezviz H3 2K Ngoài Trời",
      category: "Danh mục sản phẩm",
      group: "Camera An Ninh",
      price: 1350000,
      originalPrice: 1650000,
      discount: 18,
      image: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=500&q=80",
      description: "Camera wifi thông minh ngoài trời, độ phân giải 2K sắc nét.",
      specs: { "Độ phân giải": "2K", "Chống nước": "IP67", "Tầm nhìn đêm": "30m" },
      reviews: []
    },
    {
      id: "62",
      sku: "CAM-02",
      name: "Camera Hikvision ColorVu 2MP",
      category: "Danh mục sản phẩm",
      group: "Camera An Ninh",
      price: 850000,
      image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&q=80",
      description: "Công nghệ ColorVu cho hình ảnh màu sắc sống động 24/7.",
      specs: { "Độ phân giải": "Full HD", "Công nghệ": "ColorVu", "Vỏ": "Kim loại" },
      reviews: []
    },
    {
      id: "63",
      sku: "CAM-03",
      name: "Camera Imou Ranger 2 360",
      category: "Danh mục sản phẩm",
      group: "Camera An Ninh",
      price: 550000,
      originalPrice: 750000,
      discount: 26,
      image: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=500&q=80",
      description: "Camera theo dõi chuyển động, đàm thoại 2 chiều.",
      specs: { "Góc xoay": "355 độ", "Báo động": "Còi hú", "Lưu trữ": "Thẻ nhớ/Cloud" },
      reviews: []
    },
    {
      id: "63b",
      sku: "CAM-04",
      name: "Camera Yoosee 3 râu Full HD",
      category: "Danh mục sản phẩm",
      group: "Camera An Ninh",
      price: 320000,
      originalPrice: 450000,
      discount: 29,
      image: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=500&q=80",
      description: "Camera Yoosee kết nối 3 râu bắt sóng cực mạnh, hồng ngoại ban đêm rõ nét.",
      specs: { "Kết nối": "Wifi / 3 Râu", "Góc xoay": "360 độ", "Thẻ nhớ": "Hỗ trợ tối đa 128GB" },
      reviews: []
    },
    {
      id: "63c",
      sku: "CAM-05",
      name: "Camera 4G Ngoài Trời Dùng Sim Yoosee",
      category: "Danh mục sản phẩm",
      group: "Camera An Ninh",
      price: 890000,
      originalPrice: 1200000,
      discount: 25,
      image: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=500&q=80",
      description: "Camera ngoài trời sử dụng Sim 4G, không cần wifi, cắm là chạy, phù hợp trang trại rộng.",
      specs: { "Mạng di động": "Sim 4G LTE", "Chống nước": "IP66", "Đuôi": "IP66" },
      reviews: []
    },
    {
      id: "63d",
      sku: "CAM-06",
      name: "Camera Năng Lượng Mặt Trời 4G Solar",
      category: "Danh mục sản phẩm",
      group: "Camera An Ninh",
      price: 2450000,
      originalPrice: 2990000,
      discount: 18,
      image: "https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?w=500&q=80",
      description: "Camera giám sát năng lượng mặt trời tích hợp Sim 4G. Tự sạc bằng pin quang điện tấm lớn, không cần kéo dây nguồn và dây mạng.",
      specs: { "Nguồn điện": "Tấm pin Solar rời", "Kết nối": "Sim 4G LTE", "Dung lượng pin": "12000mAh" },
      reviews: []
    },
    {
      id: "63e",
      sku: "CAM-07",
      name: "Camera Imou Năng Lượng Mặt Trời Cell 2",
      category: "Danh mục sản phẩm",
      group: "Camera An Ninh",
      price: 1950000,
      originalPrice: 2400000,
      discount: 18,
      image: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=500&q=80",
      description: "Camera Imou cao cấp chạy pin sạc kết hợp tấm pin năng lượng mặt trời nhỏ gọn, bắt sóng wifi bển bỉ.",
      specs: { "Hãng": "IMOU", "Nguồn điện": "Pin sạc + Tấm Solar rời", "Kết nối": "Wifi 2.4Ghz & 5Ghz" },
      reviews: []
    },

    // --- Đèn năng lượng mặt trời (5 products) ---
    {
      id: "64",
      sku: "SOL-01",
      name: "Đèn đường Solar Light 300W",
      category: "Danh mục sản phẩm",
      group: "Đèn năng lượng mặt trời",
      price: 1850000,
      originalPrice: 2250000,
      discount: 17,
      image: "https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?w=500&q=80",
      description: "Đèn đường công suất cao, tấm pin tách rời hiệu suất lớn.",
      specs: { "Công suất": "300W", "Pin": "Lithium LiFePO4", "Thời gian sáng": "12-15h" },
      reviews: []
    },
    {
      id: "65",
      sku: "SOL-02",
      name: "Đèn pha năng lượng mặt trời 100W",
      category: "Danh mục sản phẩm",
      group: "Đèn năng lượng mặt trời",
      price: 950000,
      image: "https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?w=500&q=80",
      description: "Đèn pha chiếu sân vườn, tiết kiệm điện năng hoàn toàn.",
      specs: { "Công suất": "100W", "Tiêu chuẩn": "IP67", "Điều khiển": "Remote" },
      reviews: []
    }
  ];

  let orders: any[] = [];
  let consultations: any[] = [];

  const dbPath = path.join(process.cwd(), "products_db.json");
  const ordersDbPath = path.join(process.cwd(), "orders_db.json");
  const consultationsDbPath = path.join(process.cwd(), "consultations_db.json");

  // Load local backups first (instant ready states in memory)
  try {
    if (fs.existsSync(ordersDbPath)) {
      orders = JSON.parse(fs.readFileSync(ordersDbPath, "utf-8"));
    }
  } catch (err) {
    console.error("Failed to load local orders backup:", err);
  }

  try {
    if (fs.existsSync(consultationsDbPath)) {
      consultations = JSON.parse(fs.readFileSync(consultationsDbPath, "utf-8"));
    }
  } catch (err) {
    console.error("Failed to load local consultations backup:", err);
  }

  let activeProducts: any[] = [...products];
  try {
    if (fs.existsSync(dbPath)) {
      const dbContent = fs.readFileSync(dbPath, "utf-8");
      const parsed = JSON.parse(dbContent);
      if (Array.isArray(parsed) && parsed.length > 0) {
        activeProducts = parsed;
      }
    }
  } catch (err) {
    console.error("Failed to load local products backup:", err);
  }

  // --- Firestore Integration Set Up ---
  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
      userId?: string | null;
      email?: string | null;
    }
  }

  function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {},
      operationType,
      path
    };
    console.error('Firestore Error (Suppressed): ', JSON.stringify(errInfo));
  }

  function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 2000, fallbackValue: T): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((resolve) => {
      timer = setTimeout(() => {
        console.warn(`[Firestore Timeout] Operation exceeded ${timeoutMs}ms. Falling back.`);
        resolve(fallbackValue);
      }, timeoutMs);
    });
    
    // Prevent unhandled promise rejection if it fails after timeout
    promise.catch((err) => {
      console.warn(`[Background Promise Rejection] Suppressed:`, err.message || err);
    });

    return Promise.race([
      promise.then((res) => {
        clearTimeout(timer);
        return res;
      }).catch((err) => {
        clearTimeout(timer);
        console.warn(`[Firestore Error] Promise rejected before timeout:`, err.message || err);
        return fallbackValue;
      }),
      timeoutPromise
    ]);
  }

  function cleanUndefinedForFirestore(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => cleanUndefinedForFirestore(item));
    }
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (val !== undefined) {
          cleaned[key] = cleanUndefinedForFirestore(val);
        }
      }
      return cleaned;
    }
    return obj;
  }

  function saveLocalBackupSafely(filePath: string, content: string) {
    if (process.env.VERCEL === "1") {
      // Running inside Vercel serverless function environment where local FS is read-only.
      // We skip local backups cleanly without throwing errors, keeping state in memory/Firestore.
      return;
    }
    try {
      fs.writeFileSync(filePath, content, "utf-8");
    } catch (err) {
      console.warn(`[Read-Only FS Warning] Skipping disk write for ${path.basename(filePath)}:`, err);
    }
  }

  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  let db: any = null;
  let firebaseConfig: any = null;

  if (process.env.FIREBASE_CONFIG) {
    try {
      firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
      console.log("SUCCESS: Firebase configuration detected in FIREBASE_CONFIG environment variable.");
    } catch (err) {
      console.error("CRITICAL: Failed to parse FIREBASE_CONFIG environment variable:", err);
    }
  } else if (fs.existsSync(configPath)) {
    try {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      console.log("SUCCESS: Firebase configuration loaded from local firebase-applet-config.json.");
    } catch (err) {
      console.error("CRITICAL: Failed to load local firebase-applet-config.json:", err);
    }
  }

  if (firebaseConfig) {
    try {
      const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
      console.log("SUCCESS: Firebase initialized. Proactively fetching data from Firestore...");
    } catch (err) {
      console.error("CRITICAL: Failed to initialize Firebase:", err);
    }
  }

  // --- On-Demand Lazy Database Sync Tracking ---
  let productsLoaded = false;
  let ordersLoaded = false;
  let consultationsLoaded = false;
  let visitorStatsLoaded = false;

  async function ensureProductsLoaded() {
    if (!db) {
      productsLoaded = true; // Mark True to avoid infinite retries
      return;
    }
    if (productsLoaded) return;
    try {
      console.log("On-demand: Fetching products from Firestore...");
      const querySnapshot = await withTimeout(getDocs(collection(db, "products")), 4000, null);
      if (querySnapshot) {
        const firestoreProducts: any[] = [];
        querySnapshot.forEach((d) => {
          firestoreProducts.push(d.data());
        });
        if (firestoreProducts.length > 0) {
          activeProducts = firestoreProducts;
          console.log(`On-demand loaded ${activeProducts.length} items from Firestore.`);
        }
      }
      productsLoaded = true;
    } catch (err) {
      console.error("On-demand product fetch failed:", err);
    }
  }

  async function ensureOrdersLoaded() {
    if (!db) {
      ordersLoaded = true;
      return;
    }
    if (ordersLoaded) return;
    try {
      console.log("On-demand: Fetching orders from Firestore...");
      const querySnapshot = await withTimeout(getDocs(collection(db, "orders")), 4000, null);
      if (querySnapshot) {
        const firestoreOrders: any[] = [];
        querySnapshot.forEach((d) => {
          firestoreOrders.push(d.data());
        });
        if (firestoreOrders.length > 0) {
          orders = firestoreOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          console.log(`On-demand loaded ${orders.length} orders from Firestore.`);
        }
      }
      ordersLoaded = true;
    } catch (err) {
      console.error("On-demand orders fetch failed:", err);
    }
  }

  async function ensureConsultationsLoaded() {
    if (!db) {
      consultationsLoaded = true;
      return;
    }
    if (consultationsLoaded) return;
    try {
      console.log("On-demand: Fetching consultations from Firestore...");
      const querySnapshot = await withTimeout(getDocs(collection(db, "consultations")), 4000, null);
      if (querySnapshot) {
        const firestoreConsultations: any[] = [];
        querySnapshot.forEach((d) => {
          firestoreConsultations.push(d.data());
        });
        if (firestoreConsultations.length > 0) {
          consultations = firestoreConsultations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          console.log(`On-demand loaded ${consultations.length} consultations from Firestore.`);
        }
      }
      consultationsLoaded = true;
    } catch (err) {
      console.error("On-demand consultations fetch failed:", err);
    }
  }

  async function ensureVisitorStatsLoaded() {
    if (!db) {
      visitorStatsLoaded = true;
      return;
    }
    if (visitorStatsLoaded) return;
    try {
      console.log("On-demand: Fetching visitor stats from Firestore...");
      const docRef = doc(db, "counters", "visitor_counter");
      const docSnap = await withTimeout(getDoc(docRef), 3000, null);
      if (docSnap && docSnap.exists()) {
        const fsData = docSnap.data();
        if (fsData && typeof fsData.today === "number" && typeof fsData.total === "number" && fsData.total > 0) {
          visitorStats.total = Math.max(visitorStats.total, fsData.total || 0);
          visitorStats.today = Math.max(visitorStats.today, fsData.today || 0);
          if (fsData.lastDate) {
            visitorStats.lastDate = fsData.lastDate;
          }
          console.log("On-demand loaded visitor counter stats:", visitorStats);
        }
      }
      visitorStatsLoaded = true;
    } catch (err) {
      console.error("On-demand visitor stats fetch failed:", err);
    }
  }

  // Main synchronization function
  async function syncFirestoreAndLocalBackups() {
    if (!db) {
      console.warn("WARNING: Firebase DB is not initialized. Running in local fallback mode.");
      return;
    }

    // 1. Validate Connection to Firestore (Skill guidelines mandate)
    try {
      const { doc: testDoc, getDocFromServer } = await import("firebase/firestore");
      await withTimeout(getDocFromServer(testDoc(db, 'test', 'connection')), 1500, null);
      console.log("Firestore connection test passed successfully/bypassed.");
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration. Client appears to be offline.");
      } else {
        console.log("Firestore connection check bypassed or succeeded.");
      }
    }

    // 2. Fetch and Seed Products
    try {
      const querySnapshot = await withTimeout(getDocs(collection(db, "products")), 2000, null);
      if (querySnapshot) {
        const firestoreProducts: any[] = [];
        querySnapshot.forEach((d) => {
          firestoreProducts.push(d.data());
        });

        if (firestoreProducts.length > 0) {
          activeProducts = firestoreProducts;
          console.log(`Synced products from Firestore: Loaded ${activeProducts.length} items.`);
          // Write backup to disk safely
          saveLocalBackupSafely(dbPath, JSON.stringify(activeProducts, null, 2));
        } else {
          console.log("Firestore 'products' collection is empty. Seeding with current list in parallel...");
          const seedPromises = activeProducts.map((item) => {
            const itemDocRef = doc(db, "products", String(item.id || item.sku));
            return setDoc(itemDocRef, cleanUndefinedForFirestore(item));
          });
          await withTimeout(Promise.all(seedPromises), 2500, null);
          console.log(`Successfully seeded ${activeProducts.length} products to Firestore.`);
        }
      } else {
        console.warn("Products sync from Firestore timed out. Falling back to local workspace memory database.");
      }
    } catch (err) {
      console.error("Error syncing products from Firestore. Using local workspace backup...");
      handleFirestoreError(err, OperationType.LIST, "products");
    }

    // 3. Sync Orders
    try {
      const querySnapshot = await withTimeout(getDocs(collection(db, "orders")), 2000, null);
      if (querySnapshot) {
        const firestoreOrders: any[] = [];
        querySnapshot.forEach((d) => {
          firestoreOrders.push(d.data());
        });

        if (firestoreOrders.length > 0) {
          orders = firestoreOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          console.log(`Synced ${orders.length} orders from Firestore.`);
          saveLocalBackupSafely(ordersDbPath, JSON.stringify(orders, null, 2));
        } else if (orders.length > 0) {
          console.log(`Seeding ${orders.length} existing orders to Firestore in parallel...`);
          const seedPromises = orders.map((o) => {
            return setDoc(doc(db, "orders", o.id), cleanUndefinedForFirestore(o));
          });
          await withTimeout(Promise.all(seedPromises), 2500, null);
        }
      } else {
        console.warn("Orders sync from Firestore timed out. Relying on local backup.");
      }
    } catch (err) {
      console.error("Error syncing orders from Firestore:", err);
    }

    // 4. Sync Consultations
    try {
      const querySnapshot = await withTimeout(getDocs(collection(db, "consultations")), 2000, null);
      if (querySnapshot) {
        const firestoreConsultations: any[] = [];
        querySnapshot.forEach((d) => {
          firestoreConsultations.push(d.data());
        });

        if (firestoreConsultations.length > 0) {
          consultations = firestoreConsultations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          console.log(`Synced ${consultations.length} consultations from Firestore.`);
          saveLocalBackupSafely(consultationsDbPath, JSON.stringify(consultations, null, 2));
        } else if (consultations.length > 0) {
          console.log(`Seeding ${consultations.length} existing consultations to Firestore in parallel...`);
          const seedPromises = consultations.map((c) => {
            return setDoc(doc(db, "consultations", c.id), cleanUndefinedForFirestore(c));
          });
          await withTimeout(Promise.all(seedPromises), 2500, null);
        }
      } else {
        console.warn("Consultations sync from Firestore timed out. Relying on local backup.");
      }
    } catch (err) {
      console.error("Error syncing consultations from Firestore:", err);
    }
  }

  // Middleware
  // Enable ultra-permissive CORS manually to handle custom domains like webcuaquan.cloud perfectly
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    
    // Handle OPTIONS preflight request immediately
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Routes
  app.get("/api/products", async (req, res) => {
    try {
      if (!productsLoaded) {
        await ensureProductsLoaded();
      }
      res.json(activeProducts);
    } catch (err: any) {
      console.error("Error in GET /api/products:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/admin/products/import", async (req, res) => {
    try {
      if (!productsLoaded) {
        await ensureProductsLoaded();
      }
      const importedProducts = req.body;
      if (!Array.isArray(importedProducts)) {
        return res.status(400).json({ success: false, message: "Dữ liệu nhập hàng không đúng định dạng danh sách." });
      }

      let added = 0;
      let updated = 0;

      const importPromises: Promise<any>[] = [];

      importedProducts.forEach((newProd: any) => {
        if (!newProd) return;
        
        // Ensure sku exists and is safe to use
        const skuRaw = newProd.sku !== undefined && newProd.sku !== null ? String(newProd.sku).trim() : "";
        if (!skuRaw) {
          // Skip products with empty SKU (e.g., blank rows in Excel)
          return;
        }

        const newSkuLower = skuRaw.toLowerCase();
        const idx = activeProducts.findIndex(p => {
          if (!p || p.sku === undefined || p.sku === null) return false;
          return String(p.sku).trim().toLowerCase() === newSkuLower;
        });

        let targetProduct: any = null;
        if (idx !== -1) {
          // Update product preserving reviews
          targetProduct = {
            ...activeProducts[idx],
            ...newProd,
            sku: skuRaw, // preserve sanitized SKU
            reviews: activeProducts[idx].reviews || []
          };
          activeProducts[idx] = targetProduct;
          updated++;
        } else {
          // Add new item
          targetProduct = {
            ...newProd,
            sku: skuRaw,
            id: newProd.id || `PROD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
          };
          activeProducts.push(targetProduct);
          added++;
        }

        // Save imported product to Firestore with a safe timeout
        if (db && targetProduct) {
          const p = withTimeout(
            setDoc(doc(db, "products", targetProduct.id), cleanUndefinedForFirestore(targetProduct)),
            2500,
            null
          ).catch((err) => {
            console.error(`Failed to save imported product ${targetProduct.id} to Firestore:`, err);
          });
          importPromises.push(p);
        }
      });

      // Await all Firestore writes synchronously to prevent unresolved background sockets in serverless Vercel
      if (importPromises.length > 0) {
        await withTimeout(Promise.all(importPromises), 4000, null);
      }

      // Save imported products to persistent disk file safely
      saveLocalBackupSafely(dbPath, JSON.stringify(activeProducts, null, 2));

      res.json({
        success: true,
        message: `Nhập dữ liệu thành công! Thêm mới ${added} sản phẩm, cập nhật ${updated} sản phẩm. Các sản phẩm đã được phân loại vào đúng nhóm nhóm tương ứng.`,
        count: importedProducts.length
      });
    } catch (error: any) {
      console.error("Error during product import:", error);
      res.status(500).json({
        success: false,
        message: `Đã xảy ra lỗi trên hệ thống khi xử lý file: ${error.message || "Lỗi không xác định"}`
      });
    }
  });

  app.post("/api/admin/products", async (req, res) => {
    try {
      if (!productsLoaded) {
        await ensureProductsLoaded();
      }
      const { sku, manufacturerCode, name, category, group, subcategoryId, subcategoryName, price, originalPrice, discount, image, images, description, unit, specs } = req.body;
      
      if (!sku || !sku.trim()) {
        return res.status(400).json({ success: false, message: "Mã SKU không được trống!" });
      }
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "Tên sản phẩm không được trống!" });
      }
      if (!category || !category.trim()) {
        return res.status(400).json({ success: false, message: "Nhóm hàng (Danh mục) không được trống!" });
      }

      const cleanSku = String(sku).trim();
      const cleanSkuLower = cleanSku.toLowerCase();

      const idx = activeProducts.findIndex(p => {
        if (!p || p.sku === undefined || p.sku === null) return false;
        return String(p.sku).trim().toLowerCase() === cleanSkuLower;
      });

      const parsedPrice = parseFloat(price) || 0;
      const parsedOriginalPrice = originalPrice ? parseFloat(originalPrice) : undefined;
      const parsedDiscount = discount ? parseFloat(discount) : undefined;

      const fallbackImage = "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500&auto=format&fit=crop&q=60";
      const finalImage = image || (images && images.length > 0 ? images[0] : fallbackImage);
      const finalImages = Array.isArray(images) && images.length > 0 ? images : [finalImage];

      const newProduct = {
        id: idx !== -1 ? activeProducts[idx].id : `PROD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sku: cleanSku,
        manufacturerCode: manufacturerCode ? String(manufacturerCode).trim() : undefined,
        name: name.trim(),
        category: category.trim(),
        group: group ? String(group).trim() : "",
        subcategoryId: subcategoryId ? String(subcategoryId).trim() : undefined,
        subcategoryName: subcategoryName ? String(subcategoryName).trim() : undefined,
        price: parsedPrice,
        originalPrice: parsedOriginalPrice,
        discount: parsedDiscount,
        image: finalImage,
        images: finalImages,
        description: description || "",
        unit: unit ? String(unit).trim() : "Bộ",
        specs: specs || {},
        reviews: idx !== -1 ? (activeProducts[idx].reviews || []) : []
      };

      if (idx !== -1) {
        activeProducts[idx] = newProduct;
      } else {
        activeProducts.push(newProduct);
      }

      // Save to Firestore for permanent preservation (awaited with timeout to prevent Vercel container freeze crash)
      if (db) {
        try {
          await withTimeout(
            setDoc(doc(db, "products", newProduct.id), cleanUndefinedForFirestore(newProduct)),
            3000,
            null
          );
          console.log(`Successfully persisted single product SKU ${cleanSku} to Firestore.`);
        } catch (fErr) {
          console.error(`Error saving ${newProduct.id} to Firestore:`, fErr);
        }
      }

      // Save to server DB file safely
      saveLocalBackupSafely(dbPath, JSON.stringify(activeProducts, null, 2));

      res.json({
        success: true,
        message: idx !== -1 ? "Cập nhật sản phẩm thành công!" : "Thêm mới sản phẩm thành công!",
        product: newProduct
      });
    } catch (error: any) {
      console.error("Error creating single product:", error);
      res.status(500).json({ success: false, message: `Lỗi hệ thống: ${error.message || "Không rõ nguyên nhân"}` });
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      if (!productsLoaded) {
        await ensureProductsLoaded();
      }
      const categoriesFromGroups = [...new Set(activeProducts.map(p => p.group).filter(Boolean))];
      const defaultCategoriesList = [
        "Thiết bị tưới",
        "Đồ điện",
        "Camera An Ninh",
        "Vật tư nước",
        "Dụng cụ làm vườn",
        "Đèn năng lượng mặt trời"
      ];
      const mergedList = Array.from(new Set([...categoriesFromGroups, ...defaultCategoriesList]));
      res.json(mergedList);
    } catch (err: any) {
      console.error("Error in GET /api/categories:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/admin/orders", async (req, res) => {
    try {
      // In a real app, check for admin auth header or session
      if (!ordersLoaded) {
        await ensureOrdersLoaded();
      }
      res.json(orders);
    } catch (err: any) {
      console.error("Error in GET /api/admin/orders:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    if (!ordersLoaded) {
      await ensureOrdersLoaded();
    }
    const { customer, items, total } = req.body;
    
    // Persist order in memory
    const newOrder = {
      id: `ORD-${Date.now()}`,
      customer,
      items,
      total,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    orders.push(newOrder);

    // Save order to Firestore (awaited with timeout to prevent unresolved socket failure in Vercel)
    if (db) {
      try {
        await withTimeout(
          setDoc(doc(db, "orders", newOrder.id), cleanUndefinedForFirestore(newOrder)),
          3000,
          null
        );
        console.log(`Successfully saved order ${newOrder.id} to Firestore.`);
      } catch (fErr) {
        console.error(`Error saving order ${newOrder.id} to Firestore:`, fErr);
      }
    }

    // Save orders to db backup safely
    saveLocalBackupSafely(ordersDbPath, JSON.stringify(orders, null, 2));
    
    // In a real application, you would use a service like SendGrid, Mailgun, or AWS SES
    // For this environment, we will use nodemailer if configured, otherwise fallback to logging.
    
    const emailBody = `
      <h3>Xác nhận đơn hàng mới</h3>
      <p><strong>Khách hàng:</strong> ${customer.fullName}</p>
      <p><strong>Số điện thoại:</strong> ${customer.phone}</p>
      <p><strong>Địa chỉ:</strong> ${customer.address}</p>
      <p><strong>Quận/Huyện:</strong> ${customer.district}</p>
      <p><strong>Tỉnh/Thành phố:</strong> ${customer.province}</p>
      
      <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th>Sản phẩm</th>
            <th>Số lượng</th>
            <th>Đơn giá</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item: any) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>${item.price.toLocaleString('vi-VN')}₫</td>
              <td>${(item.price * item.quantity).toLocaleString('vi-VN')}₫</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right;"><strong>Tổng cộng:</strong></td>
            <td><strong>${total.toLocaleString('vi-VN')}₫</strong></td>
          </tr>
        </tfoot>
      </table>
      <p><i>Đơn hàng được gửi từ hệ thống MayMocNongHiep.com</i></p>
    `;

    console.log("------------------------------------------");
    console.log("NEW ORDER RECEIVED - PROCESSING EMAIL...");
    
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await transporter.sendMail({
          from: `"Hệ thống Đơn hàng" <${process.env.EMAIL_USER}>`,
          to: "maymocnonghiep@gmail.com",
          subject: `Đơn hàng mới từ ${customer.fullName}`,
          html: emailBody
        });
        console.log("SUCCESS: Email sent to maymocnonghiep@gmail.com");
      } catch (error) {
        console.error("ERROR: Failed to send email via nodemailer:", error);
        // We still log the order to console even if email fails
      }
    } else {
      console.log("WARNING: EMAIL_USER or EMAIL_PASS not set. Order logged to console only.");
      console.log("Order Detail:", JSON.stringify({ customer, items, total }, null, 2));
    }
    
    console.log("------------------------------------------");

    // Simulate success
    res.json({ success: true, message: "Order processed" });
  });

  // Consultations API Enpoints
  app.post("/api/consultations", async (req, res) => {
    try {
      if (!consultationsLoaded) {
        await ensureConsultationsLoaded();
      }
      const { fullName, phone, province, district, area, farmModel } = req.body;
      
      if (!fullName || !phone) {
        return res.status(400).json({ success: false, message: "Vui lòng nhập Họ tên và Số điện thoại!" });
      }

      const newConsultation = {
        id: `CON-${Date.now()}`,
        fullName,
        phone,
        province: province || "",
        district: district || "",
        area: area || "",
        farmModel: farmModel || "",
        status: "pending", // pending, completed
        createdAt: new Date().toISOString()
      };

      consultations.unshift(newConsultation);

      // Save to Firestore (awaited with a quick timeout to comply with Vercel serverless execution guarantees)
      if (db) {
        try {
          await withTimeout(
            setDoc(doc(db, "consultations", newConsultation.id), cleanUndefinedForFirestore(newConsultation)),
            2500,
            null
          );
          console.log(`Successfully saved consultation ${newConsultation.id} to Firestore.`);
        } catch (fErr) {
          console.error(`Error saving consultation ${newConsultation.id} to Firestore:`, fErr);
        }
      }

      // Persist list backup safely
      saveLocalBackupSafely(consultationsDbPath, JSON.stringify(consultations, null, 2));

      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
          <h2 style="color: #15803d; border-bottom: 2px solid #15803d; padding-bottom: 10px; margin-top: 0;">YÊU CẦU TƯ VẤN KHẢO SÁT SÂN VƯỜN</h2>
          <p style="font-size: 14px; color: #475569;">Bà con vừa đăng ký yêu cầu tư vấn thiết kế và khảo sát trực tiếp từ trang web. Vui lòng liên hệ hỗ trợ sớm nhất!</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px;">
            <tr style="background-color: #f1f5f9;">
              <td style="padding: 10px; font-weight: bold; width: 35%; border-bottom: 1px solid #e2e8f0;">Họ tên Chú/Bác:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Số điện thoại:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><a href="tel:${phone}" style="color: #15803d; font-weight: bold; text-decoration: none;">${phone}</a></td>
            </tr>
            <tr style="background-color: #f1f5f9;">
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Tỉnh / Thành phố:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${province || "Chưa cung cấp"}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Quận / Huyện:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${district || "Chưa cung cấp"}</td>
            </tr>
            <tr style="background-color: #f1f5f9;">
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Diện tích vườn:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${area || "Chưa cung cấp"}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Mô hình trồng trọt:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${farmModel || "Chưa cung cấp"}</td>
            </tr>
          </table>
          
          <div style="background-color: #e2f0d9; padding: 12px; border-radius: 8px; color: #1e4620; font-size: 13px; font-weight: bold; text-align: center;">
            Trạng thái hiện tại: Đang chờ kỹ thuật viên liên hệ tư vấn
          </div>
          
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            Yêu cầu này được gửi tự động bởi hệ thống Máy Móc Nông Nghiệp Thắng Lợi.
          </p>
        </div>
      `;

      console.log("------------------------------------------");
      console.log("NEW CONSULTATION REQUEST RECEIVED - PROCESSING EMAIL...");

      // Send email to store owner
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          await transporter.sendMail({
            from: `"Yêu Cầu Tư Vấn" <${process.env.EMAIL_USER}>`,
            to: "maymocnonghiep@gmail.com",
            subject: `TƯ VẤN KHẢO SÁT: ${fullName} - ${phone}`,
            html: emailBody
          });
          console.log("SUCCESS: Consultation Email sent successfully to maymocnonghiep@gmail.com!");
        } catch (emailErr) {
          console.error("ERROR: Failed to send consultation email:", emailErr);
        }
      } else {
        console.log("WARNING: EMAIL_USER or EMAIL_PASS not set. Consultation logged to console only.");
        console.log("Consultation Detail:", JSON.stringify(newConsultation, null, 2));
      }

      console.log("------------------------------------------");

      res.json({ success: true, message: "Đăng ký tư vấn thành công! Nhân viên kỹ thuật sẽ sớm liên hệ Chú/Bác." });
    } catch (err) {
      console.error("Error creating consultation:", err);
      res.status(500).json({ success: false, message: "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau." });
    }
  });

  app.get("/api/admin/consultations", async (req, res) => {
    try {
      if (!consultationsLoaded) {
        await ensureConsultationsLoaded();
      }
      res.json(consultations);
    } catch (err: any) {
      console.error("Error in GET /api/admin/consultations:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.put("/api/admin/consultations/:id", async (req, res) => {
    try {
      if (!consultationsLoaded) {
        await ensureConsultationsLoaded();
      }
      const { id } = req.params;
      const { status } = req.body;
      const idx = consultations.findIndex(c => c.id === id);
      if (idx !== -1) {
        consultations[idx].status = status || "pending";
        
        // Save to Firestore (awaited with a safe timeout for serverless Vercel compliance)
        if (db) {
          try {
            await withTimeout(
              setDoc(doc(db, "consultations", id), cleanUndefinedForFirestore(consultations[idx])),
              2500,
              null
            );
            console.log(`Successfully updated consultation ${id} status on Firestore.`);
          } catch (fErr) {
            console.error(`Error updating status of consultation ${id}:`, fErr);
          }
        }

        saveLocalBackupSafely(consultationsDbPath, JSON.stringify(consultations, null, 2));
        return res.json({ success: true, consultation: consultations[idx] });
      }
      res.status(404).json({ success: false, message: "Yêu cầu tư vấn không tồn tại." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi cập nhật trạng thái." });
    }
  });

  // --- Visitor Counter Logic (Robust JSON file backing + Firestore backup) ---
  const counterDbPath = path.join(process.cwd(), "counter_db.json");
  let visitorStats = { today: 0, total: 0, lastDate: "" };

  const getVNTodayDateStr = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    // GMT + 7 (Vietnam Offset)
    const vnTime = new Date(utc + (3600000 * 7));
    const yyyy = vnTime.getFullYear();
    const mm = String(vnTime.getMonth() + 1).padStart(2, "0");
    const dd = String(vnTime.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const loadVisitorStats = async () => {
    // Seed with realistic baselines if we have a fresh launch, keeping the site looking active
    visitorStats = { today: 150, total: 12480, lastDate: getVNTodayDateStr() };

    try {
      if (fs.existsSync(counterDbPath)) {
        const fileContent = fs.readFileSync(counterDbPath, "utf-8");
        const parsed = JSON.parse(fileContent);
        if (parsed && typeof parsed.today === "number" && typeof parsed.total === "number") {
          visitorStats = parsed;
        }
      }
    } catch (err) {
      console.error("Failed to load local visitor stats file:", err);
    }

    if (db) {
      try {
        const docRef = doc(db, "counters", "visitor_counter");
        const docSnap = await withTimeout(getDoc(docRef), 2000, null);
        if (docSnap && docSnap.exists()) {
          const fsData = docSnap.data();
          if (fsData && typeof fsData.today === "number" && typeof fsData.total === "number" && fsData.total > 0) {
            visitorStats.total = Math.max(visitorStats.total, fsData.total || 0);
            visitorStats.today = Math.max(visitorStats.today, fsData.today || 0);
            if (fsData.lastDate) {
              visitorStats.lastDate = fsData.lastDate;
            }
          }
        } else if (docSnap === undefined || docSnap === null) {
          console.warn("Visitor stats document fetch timed out. Skipping remote baseline check.");
        } else {
          // Document doesn't exist, let's write our baseline to firestore
          await withTimeout(setDoc(docRef, cleanUndefinedForFirestore(visitorStats)), 2000, null);
        }
      } catch (fErr) {
        console.error("Failed to sync visitor stats from Firestore:", fErr);
      }
    }

    const todayStr = getVNTodayDateStr();
    if (visitorStats.lastDate !== todayStr) {
      visitorStats.today = 0;
      visitorStats.lastDate = todayStr;
      
      saveLocalBackupSafely(counterDbPath, JSON.stringify(visitorStats, null, 2));

      if (db) {
        try {
          await withTimeout(setDoc(doc(db, "counters", "visitor_counter"), cleanUndefinedForFirestore(visitorStats)), 2000, null);
        } catch (fErr) {
          console.error("Failed to write initial resettled stats to Firestore:", fErr);
        }
      }
    }
  };

  // Run the async counter initializer safely in background for non-Vercel environments
  if (process.env.VERCEL !== "1") {
    loadVisitorStats().catch(err => console.error("Failed to setup visitor counter:", err));
  }

  app.get("/api/visitor-stats", async (req, res) => {
    try {
      if (!visitorStatsLoaded) {
        await ensureVisitorStatsLoaded();
      }
      const todayStr = getVNTodayDateStr();
      if (visitorStats.lastDate !== todayStr) {
        visitorStats.today = 0;
        visitorStats.lastDate = todayStr;
        saveLocalBackupSafely(counterDbPath, JSON.stringify(visitorStats, null, 2));
        if (db) {
          await withTimeout(setDoc(doc(db, "counters", "visitor_counter"), cleanUndefinedForFirestore(visitorStats)), 2000, null);
        }
      }
      res.json({ success: true, today: visitorStats.today, total: visitorStats.total });
    } catch (err) {
      console.error("Error in get visitor-stats:", err);
      res.json({ success: false, today: visitorStats.today, total: visitorStats.total });
    }
  });

  app.post("/api/visitor-tick", async (req, res) => {
    try {
      if (!visitorStatsLoaded) {
        await ensureVisitorStatsLoaded();
      }
      const todayStr = getVNTodayDateStr();
      if (visitorStats.lastDate !== todayStr) {
        visitorStats.today = 0;
        visitorStats.lastDate = todayStr;
      }

      visitorStats.today += 1;
      visitorStats.total += 1;

      saveLocalBackupSafely(counterDbPath, JSON.stringify(visitorStats, null, 2));

      if (db) {
        try {
          await withTimeout(
            setDoc(doc(db, "counters", "visitor_counter"), cleanUndefinedForFirestore(visitorStats)),
            2000,
            null
          );
        } catch (fErr) {
          console.error("Failed to write visitor tick in Firestore backend:", fErr);
        }
      }

      res.json({ success: true, today: visitorStats.today, total: visitorStats.total });
    } catch (err) {
      console.error("Error ticking visitor count:", err);
      res.json({ success: false, today: visitorStats.today, total: visitorStats.total });
    }
  });

  // --- Synchronize and setup in background ---
  const isVercel = process.env.VERCEL === "1";

  // Fire background loaders ONLY on standard, persistent servers (e.g., VPS, Cloud Run, local development)
  if (!isVercel) {
    syncFirestoreAndLocalBackups()
      .then(() => console.log("Database synced in background."))
      .catch(err => console.error("Failed to sync database in background:", err));

    loadVisitorStats()
      .then(() => console.log("Visitor stats loaded in background."))
      .catch(err => console.error("Failed to setup visitor stats:", err));
  }

  // Vite development server middleware setup
  let viteDevServer: any = null;
  if (!isProduction && !isVercel) {
    import("vite").then(async (m) => {
      viteDevServer = await m.createServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use((req, res, next) => {
        if (viteDevServer) {
          viteDevServer.middlewares(req, res, next);
        } else {
          next();
        }
      });
    }).catch(err => {
      console.error("Failed to dynamically load Vite server middleware:", err);
    });
  } else if (!isVercel) {
    // In standalone production containers (Cloud Run), serve static assets locally
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to port and start listener only if we are NOT running in a serverless function (Vercel)
  if (!isVercel) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
    });
  }

  // Export app default for Vercel Serverless Function deployment compatibility
  export default app;
