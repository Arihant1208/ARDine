
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRGeneratorProps {
  restaurantName: string;
  tableCount: number;
  userId: string;
}

const QRGenerator: React.FC<QRGeneratorProps> = ({ restaurantName, tableCount, userId }) => {
  const downloadQR = (id: string, tableNum: number) => {
    const svg = document.getElementById(id);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `table-${tableNum}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
      {Array.from({ length: tableCount }).map((_, i) => {
        const tableNum = i + 1;
        const qrId = `qr-table-${tableNum}`;
        // Including UserID for scoping on the customer end
        const value = `${window.location.origin}/menu/${userId}?table=${tableNum}`;
        
        return (
          <div key={tableNum} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-4 transition-transform hover:scale-105">
            <h3 className="font-bold text-lg text-gray-700">Table {tableNum}</h3>
            <div className="bg-gray-50 p-4 rounded-xl">
              <QRCodeSVG id={qrId} value={value} size={150} level="H" includeMargin={true} />
            </div>
            <button 
              onClick={() => downloadQR(qrId, tableNum)}
              className="w-full py-2 px-4 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Download PNG
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default QRGenerator;
