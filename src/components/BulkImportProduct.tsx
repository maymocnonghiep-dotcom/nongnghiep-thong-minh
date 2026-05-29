import React, { useState, useRef } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Upload, FileText, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { getFirestore, writeBatch, doc, collection, getDocs, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { initFirebaseClient } from '../firebase-client';

interface ImportResult {
  success: boolean;
  message: string;
  errors: string[];
}

interface BulkImportProductProps {
  onComplete: () => void;
}

export default function BulkImportProduct({ onComplete }: BulkImportProductProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    
    // Tab 1: Hướng Dẫn
    const instructionSheet = workbook.addWorksheet('Hướng Dẫn');
    instructionSheet.columns = [
      { header: 'Tên Cột', key: 'name', width: 25 },
      { header: 'Bắt Buộc', key: 'required', width: 15 },
      { header: 'Mô Tả Định Dạng', key: 'desc', width: 45 },
      { header: 'Ví Dụ', key: 'example', width: 70 }
    ];
    
    instructionSheet.addRows([
      { name: 'Ma_SKU', required: 'BẮT BUỘC', desc: 'Mã định danh duy nhất của sản phẩm', example: 'MB-01, TUOI-01, ...' },
      { name: 'Ten_San_Pham', required: 'BẮT BUỘC', desc: 'Tên đầy đủ của sản phẩm', example: 'Cánh quạt máy bay nông nghiệp T20' },
      { name: 'Danh_Muc_Chinh', required: 'BẮT BUỘC', desc: 'Danh mục phân nhánh chính', example: 'Linh kiện máy bay' },
      { name: 'Thu_Muc_Con', required: 'Không', desc: 'Danh mục phụ', example: 'Cánh quạt' },
      { name: 'Gia_Ban', required: 'BẮT BUỘC', desc: 'Giá bán thực tế (chỉ nhập số)', example: '150000' },
      { name: 'Gia_Goc', required: 'Không', desc: 'Giá gốc trước khi giảm (chỉ nhập số)', example: '180000' },
      { name: 'Don_Vi_Tinh', required: 'BẮT BUỘC', desc: 'Đơn vị đo lường', example: 'Cặp, Cái, Bộ' },
      { name: 'Danh_Sach_Link_Anh', required: 'Không', desc: 'Các link ảnh web cách nhau bởi dấu |', example: 'https://img.com/a.jpg | https://img.com/b.jpg' },
      { name: 'Mo_Ta', required: 'Không', desc: 'Đoạn văn mô tả chi tiết sản phẩm', example: 'Cánh quạt siêu bền bằng sợi carbon tổng hợp...' },
      { name: 'Thong_So_Ky_Thuat', required: 'Không', desc: 'Cặp Key:Value cách nhau bởi |', example: 'Chất liệu:Carbon | Trọng lượng:150g' }
    ]);
    
    // Đổ style cho header của Hướng Dẫn
    instructionSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000080' } }; // Navy Blue
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    
    // Style cho các dòng Hướng Dẫn
    for (let i = 2; i <= 11; i++) {
       instructionSheet.getRow(i).eachCell(cell => {
         cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
         cell.alignment = { vertical: 'middle', wrapText: true };
       });
       const reqCell = instructionSheet.getCell(`B${i}`);
       if (reqCell.value === 'BẮT BUỘC') {
          reqCell.font = { bold: true, color: { argb: 'FFB91C1C' } }; // Đỏ đậm để chú ý
       } else {
          reqCell.font = { bold: true, color: { argb: 'FF475569' } };
       }
    }
    
    // Tab 2: Mẫu nhập liệu
    const dataSheet = workbook.addWorksheet('Mẫu_Nhap_Lieu', { views: [{ state: 'frozen', ySplit: 1 }] });
    const headers = [
      "Ma_SKU", "Ten_San_Pham", "Danh_Muc_Chinh", "Thu_Muc_Con", 
      "Gia_Ban", "Gia_Goc", "Don_Vi_Tinh", "Danh_Sach_Link_Anh", 
      "Mo_Ta", "Thong_So_Ky_Thuat"
    ];
    
    const requiredCols = ['Ma_SKU', 'Ten_San_Pham', 'Danh_Muc_Chinh', 'Gia_Ban', 'Don_Vi_Tinh'];
    dataSheet.columns = headers.map(h => ({ 
      header: h + (requiredCols.includes(h) ? '*' : ''), 
      key: h, 
      width: 25 
    }));
    
    dataSheet.addRows([
      { Ma_SKU: 'LK-MB-001', Ten_San_Pham: 'Cánh quạt dự phòng DJI T20', Danh_Muc_Chinh: 'Linh kiện máy bay', Thu_Muc_Con: 'Cánh quạt', Gia_Ban: 350000, Gia_Goc: 400000, Don_Vi_Tinh: 'Cặp', Danh_Sach_Link_Anh: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500', Mo_Ta: 'Cánh quạt siêu bền chất liệu tổng hợp tĩnh điện chịu lực cao...', Thong_So_Ky_Thuat: 'Chất liệu:Sợi tổng hợp | Kích thước:30cm | Dùng cho:DJI T20' },
      { Ma_SKU: 'TB-BOM-123', Ten_San_Pham: 'Bơm tăng áp thông minh', Danh_Muc_Chinh: 'Thiết bị tưới', Thu_Muc_Con: 'Máy bơm', Gia_Ban: 1250000, Gia_Goc: 1500000, Don_Vi_Tinh: 'Cái', Danh_Sach_Link_Anh: '', Mo_Ta: 'Bơm công suất lớn chuyên dụng cho đồi dốc, tích hợp mạch điều tốc', Thong_So_Ky_Thuat: 'Công suất:1.5HP | Nguồn điện:220V | Lưu lượng:50L/phút' }
    ]);
    
    dataSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000080' } }; // Navy Blue Default
      
      const valStr = (cell.value || '').toString();
      if (valStr.endsWith('*')) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Xanh rêu nổi bật cho cột bắt buộc
      }
      
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    
    for (let i = 2; i <= 3; i++) {
       dataSheet.getRow(i).eachCell(cell => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          cell.alignment = { vertical: 'middle', wrapText: true };
       });
    }
    
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'Mau_Nhap_San_Pham.xlsx');
  };

  const processAndUploadImage = async (url: string, storage: any): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], `img-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
      
      let fileToUpload: File | Blob = file;
      if (file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 0.5, // Dưới 500KB
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: 'image/webp',
          initialQuality: 0.8
        };
        try {
          fileToUpload = await imageCompression(file, options);
        } catch (e) {
          console.warn("Lỗi nén ảnh, dùng file gốc", e);
        }
      }

      const cleanFilename = String(file.name).replace(/[^a-zA-Z0-9.-]/g, "_");
      // Use the exact new bucket requested
      const storageRef = ref(storage, `gs://titanium-leaf-s07pf/products/${Date.now()}-${cleanFilename}`);
      
      await uploadBytesResumable(storageRef, fileToUpload, {
        contentType: fileToUpload.type || file.type || 'image/jpeg',
      });
      return await getDownloadURL(storageRef);
    } catch (err) {
      console.error(`Lỗi xử lý ảnh từ link: ${url}`, err);
      // Giữ nguyên link cũ nếu lỗi
      return url;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setProgress(0);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        
        // Cố gắng tìm sheet "Mẫu_Nhap_Lieu", nếu không có lấy sheet đầu tiên (bỏ qua "Hướng Dẫn" nếu nó ở tab 1)
        let worksheet = workbook.getWorksheet('Mẫu_Nhap_Lieu');
        if (!worksheet) {
          // Bỏ qua sheet "Hướng Dẫn" nếu tồn tại và người dùng đã vô tình xóa Mẫu_Nhap_Lieu
          const candidates = workbook.worksheets.filter(s => s.name !== 'Hướng Dẫn');
          if (candidates.length > 0) {
             worksheet = candidates[0];
          } else {
             worksheet = workbook.worksheets[0];
          }
        }

        const jsonData: any[] = [];
        let headers: string[] = [];
        
        const getCellValue = (cell: ExcelJS.Cell) => {
          if (!cell.value) return '';
          if (typeof cell.value === 'object') {
             if ('richText' in cell.value as any) return (cell.value as any).richText.map((rt: any) => rt.text).join('');
             if ('hyperlink' in cell.value as any) return (cell.value as any).text;
             if ('result' in cell.value as any) return (cell.value as any).result;
          }
          return cell.value.toString().trim();
        };

        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber === 1) {
             row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                let cellVal = getCellValue(cell);
                cellVal = cellVal.replace('*', '').trim();
                headers[colNumber] = cellVal;
             });
          } else {
             const rowData: any = {};
             let hasData = false;
             row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const header = headers[colNumber];
                if (header) {
                   const val = getCellValue(cell);
                   rowData[header] = val;
                   if (val !== '') hasData = true;
                }
             });
             // Chỉ lấy những dòng thực sự có dữ liệu
             if (hasData) {
               jsonData.push(rowData);
             }
          }
        });

        if (!jsonData || jsonData.length === 0) {
          throw new Error('File Excel rỗng hoặc không đúng định dạng.');
        }

        const app = await initFirebaseClient();
        const db = getFirestore(app);
        const storage = getStorage(app);
        const batch = writeBatch(db);
        const errors: string[] = [];
        let validRowsCount = 0;

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const lineNumber = i + 2; // +1 for 0-index, +1 for header row
          
          // Trích xuất dữ liệu dựa trên header
          const sku = String(row["Ma_SKU"] || "").trim();
          const name = String(row["Ten_San_Pham"] || "").trim();
          const mainCategory = String(row["Danh_Muc_Chinh"] || "").trim();
          const subCategory = String(row["Thu_Muc_Con"] || "").trim();
          const priceRaw = row["Gia_Ban"];
          const originalPriceRaw = row["Gia_Goc"];
          const unit = String(row["Don_Vi_Tinh"] || "").trim();
          const imagesStr = String(row["Danh_Sach_Link_Anh"] || "").trim();
          const description = String(row["Mo_Ta"] || "").trim();
          const specsStr = String(row["Thong_So_Ky_Thuat"] || "").trim();

          const price = parseFloat(priceRaw);
          const originalPrice = originalPriceRaw !== undefined && originalPriceRaw !== null && originalPriceRaw !== "" 
            ? parseFloat(originalPriceRaw) 
            : null;

          // Kiểm tra trường bắt buộc
          if (!sku || !name || !mainCategory || isNaN(price) || !unit) {
            errors.push(`Dòng ${lineNumber}: Bỏ qua do thiếu thông tin bắt buộc [Ma_SKU, Ten_San_Pham, Danh_Muc_Chinh, Gia_Ban, Don_Vi_Tinh].`);
            setProgress(Math.round(((i + 1) / jsonData.length) * 100));
            continue;
          }

          // Xử lý ảnh
          const newPictures = [];
          if (imagesStr) {
            const urls = imagesStr.split("|").map(s => s.trim()).filter(s => s.length > 0);
            for (const url of urls) {
               const uploadUrl = await processAndUploadImage(url, storage);
               newPictures.push(uploadUrl);
            }
          }

          // Xử lý thông số kỹ thuật động
          const specs: { [key: string]: string } = {};
          if (specsStr) {
            const parts = specsStr.split("|").map(s => s.trim()).filter(s => s.length > 0);
            for (const part of parts) {
               const kv = part.split(":");
               if (kv.length >= 2) {
                 const k = kv[0].trim();
                 const v = kv.slice(1).join(":").trim();
                 if (k && v) specs[k] = v;
               }
            }
          }

          const productData: any = {
            id: sku, // SKU is often used as ID or kept in property
            sku: sku,
            name: name,
            category: mainCategory, // 'category' in current data structure maps to mainCategory
            group: subCategory || "", // current app uses group for subcategory or vice versa
            price: price,
            unit: unit,
            picture: newPictures.length > 0 ? newPictures[0] : "", // Current structure uses `picture` as primary
            pictures: newPictures,
            description: description,
            specs: specs,
          };
          if (originalPrice !== null && !isNaN(originalPrice)) {
             productData.originalPrice = originalPrice;
          }
          if (subCategory) {
             productData.subcategoryName = subCategory; // Mapping for newer format
          }

          const docRef = doc(db, "products", sku); // Dùng sku làm Document ID để ghi đè (UPDATE)
          batch.set(docRef, productData, { merge: true });
          
          validRowsCount++;
          setProgress(Math.round(((i + 1) / jsonData.length) * 100));
        }

        if (validRowsCount > 0) {
          await batch.commit();
        }

        setImportResult({
          success: true,
          message: `Đã xử lý xong. Cập nhật/Thêm mới thành công ${validRowsCount} sản phẩm.`,
          errors: errors
        });
        
        onComplete(); // Trigger refresh

      } catch (err: any) {
        console.error(err);
        setImportResult({
          success: false,
          message: err.message || 'Có lỗi xảy ra khi xử lý file',
          errors: []
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <>
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 not-italic font-sans">
        <Upload size={24} className="text-brand-primary" /> Nhập hàng loạt từ Excel
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 text-sm">
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <h3 className="font-bold text-blue-800 mb-2">Bước 1: Tải file mẫu</h3>
              <p className="text-blue-600 mb-4 opacity-80">Vui lòng sử dụng file mẫu Excel chuẩn để dữ liệu map chính xác vào hệ thống (Ma_SKU, Ten_San_Pham...).</p>
              <button 
                onClick={downloadTemplate}
                className="flex items-center gap-2 text-brand-secondary font-bold hover:underline"
              >
                <FileText size={18} /> Tải file mẫu (.xlsx)
              </button>
          </div>
          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
              <h3 className="font-bold text-orange-800 mb-2">Bước 2: Tải lên dữ liệu</h3>
              <p className="text-orange-600 mb-4 opacity-80">Hệ thống sẽ cập nhật (ghi đè) nếu SKU trùng, hoặc tạo mới nếu SKU chưa tồn tại.</p>
              <label className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-2 rounded-xl font-bold cursor-pointer hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20">
                <Upload size={18} /> Chọn file Excel
                <input ref={fileInputRef} type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
              </label>
          </div>
      </div>

      {isImporting && (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 mb-8">
          <div className="w-full max-w-md bg-slate-200 rounded-full h-4 mb-4 overflow-hidden">
            <div className="bg-brand-primary h-4 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="font-bold text-slate-500">Đang xử lý dữ liệu... {progress}%</p>
          <p className="text-sm text-slate-400 mt-2">Đang tải và nén ảnh (nếu có), vui lòng không đóng trang.</p>
        </div>
      )}

      {importResult && !isImporting && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl mb-8 flex flex-col gap-4 ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
        >
          <div className="flex items-center gap-4">
            {importResult.success ? <CheckCircle2 size={32} className="text-green-600" /> : <AlertCircle size={32} className="text-red-600" />}
            <div>
               <h4 className={`font-bold text-lg ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                 {importResult.success ? 'Thành công!' : 'Thất bại'}
               </h4>
               <p className={importResult.success ? 'text-green-700' : 'text-red-700'}>{importResult.message}</p>
            </div>
          </div>
          
          {importResult.errors && importResult.errors.length > 0 && (
            <div className="mt-4 p-4 bg-white rounded-xl border border-red-100 max-h-60 overflow-y-auto">
              <h5 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                <XCircle size={16} /> Danh sách lỗi (Bỏ qua các dòng sau)
              </h5>
              <ul className="list-disc pl-5 text-sm text-red-600 space-y-1">
                {importResult.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}
