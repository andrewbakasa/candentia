import * as XLSX from "xlsx";
import { DownloadIcon } from "./Icons";

interface DownloadBtnProps {
  data?: any[]; // Replace with actual data type if known
  fileName?: string;
}

const DownloadBtn: React.FC<DownloadBtnProps> = ({ data = [], fileName }) => {
  return (
    <button
      className="download-btn"
      onClick={() => {
        const worksheets = data?.length ? [XLSX.utils.json_to_sheet(data)] : [];
        const workbook = XLSX.utils.book_new();
        worksheets.forEach((worksheet) => XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1"));
        XLSX.writeFile(workbook, fileName ? `${fileName}.xlsx` : "data.xlsx");
      }}
    >
      <DownloadIcon />
      Download
    </button>
  );
};

export default DownloadBtn;
