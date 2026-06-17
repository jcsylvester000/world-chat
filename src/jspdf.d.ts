// Minimal ambient types for jsPDF v4 (the published package ships no .d.ts).
// Covers only the API used by lib/invoice-pdf.ts and lib/teaser/teaser-export.ts.
declare module "jspdf" {
  interface JsPdfOptions {
    unit?: string;
    format?: string | number[];
    orientation?: "portrait" | "landscape";
  }
  interface TextOptions {
    align?: "left" | "center" | "right" | "justify";
  }
  export class jsPDF {
    constructor(options?: JsPdfOptions);
    internal: { pageSize: { getWidth(): number; getHeight(): number } };
    setFont(family: string, style?: string): jsPDF;
    setFontSize(size: number): jsPDF;
    setTextColor(r: number, g: number, b: number): jsPDF;
    setDrawColor(r: number, g: number, b: number): jsPDF;
    setFillColor(r: number, g: number, b: number): jsPDF;
    text(text: string, x: number, y: number, options?: TextOptions): jsPDF;
    line(x1: number, y1: number, x2: number, y2: number): jsPDF;
    rect(x: number, y: number, w: number, h: number, style?: string): jsPDF;
    addPage(format?: string | number[], orientation?: "portrait" | "landscape"): jsPDF;
    addImage(data: string, format: string, x: number, y: number, w: number, h: number): jsPDF;
    save(filename: string): void;
  }
  export default jsPDF;
}
