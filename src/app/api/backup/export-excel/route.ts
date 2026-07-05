import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

export async function GET() {
  const session = await getSession();
  
  if (!session || (session.role !== "ADMIN" && session.role !== "OFFICER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const recruits = await prisma.recruit.findMany({
      include: {
        batch: true,
        attendances: true,
        evaluations: true,
      },
      orderBy: { chestNumber: "asc" }
    });

    // Custom sort
    recruits.sort((a, b) => {
      const numA = parseInt(a.chestNumber.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.chestNumber.replace(/\D/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.chestNumber.localeCompare(b.chestNumber);
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PTC Akola';
    workbook.lastModifiedBy = 'Admin';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    const sheet = workbook.addWorksheet('Recruits', {
      properties: { tabColor: { argb: 'FFC0000' } },
      pageSetup: { fitToPage: true, fitToHeight: 1, fitToWidth: 1 }
    });

    // Define columns (without headers yet)
    sheet.columns = [
      { key: 'photo', width: 15 },
      { key: 'chestNumber', width: 12 },
      { key: 'name', width: 25 },
      { key: 'age', width: 10 },
      { key: 'sex', width: 10 },
      { key: 'mobile', width: 15 },
      { key: 'whatsappNumber', width: 15 },
      { key: 'unit', width: 20 },
      { key: 'batch', width: 15 },
      { key: 'squadNumber', width: 12 },
      { key: 'homeDistrict', width: 20 },
      { key: 'taluka', width: 15 },
      { key: 'pincode', width: 12 },
      { key: 'address', width: 30 },
      { key: 'nearestPoliceStation', width: 20 },
      { key: 'education', width: 15 },
      { key: 'maritalStatus', width: 15 },
      { key: 'bloodGroup', width: 12 },
      { key: 'height', width: 12 },
      { key: 'weight', width: 12 },
      { key: 'religion', width: 15 },
      { key: 'caste', width: 15 },
      { key: 'category', width: 15 },
      { key: 'appointmentCategory', width: 20 },
      { key: 'appointmentType', width: 20 },
      { key: 'dateOfEntry', width: 15 },
      { key: 'isReturnedToDistrict', width: 18 },
      { key: 'returnedToDistrictDate', width: 15 },
      { key: 'attendance', width: 18 },
      { key: 'evaluations', width: 15 },
    ];

    // Build the big header
    sheet.mergeCells('A1:A4'); // For Logo
    sheet.mergeCells('B1:AD4'); // For Title

    // Add Logo
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        const logoId = workbook.addImage({
          base64: logoBuffer.toString('base64'),
          extension: 'png',
        });
        sheet.addImage(logoId, {
          tl: { col: 0.1, row: 0.1 },
          ext: { width: 80, height: 80 },
          editAs: 'oneCell'
        });
      }
    } catch (e) {
      console.error("Failed to load logo", e);
    }

    // Setup global styles
    sheet.views = [
      { state: 'frozen', xSplit: 2, ySplit: 5 }
    ];
    sheet.autoFilter = 'A5:AD5';

    // Style Title
    const titleCell = sheet.getCell('B1');
    titleCell.value = 'POLICE TRAINING CENTRE AKOLA\nRecruits Data Report';
    titleCell.font = { name: 'Arial', size: 22, bold: true, color: { argb: 'FF0F172A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    
    // Add subtitle with date
    const dateCell = sheet.getCell('B4');
    dateCell.value = `Generated on: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-US')}`;
    dateCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
    dateCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Setup headers on Row 5
    const headers = [
      'Photo', 'Chest No', 'Name', 'Age', 'Gender', 'Mobile', 'WhatsApp', 'Unit', 'Batch', 'Squad No', 
      'District', 'Taluka', 'Pincode', 'Address', 'Nearest Police Station', 'Education', 'Marital Status', 
      'Blood Group', 'Height (cm)', 'Weight (kg)', 'Religion', 'Caste', 'Category', 'Appt. Category', 
      'Appt. Type', 'Date of Entry', 'Returned to District?', 'Returned Date', 'Total Att. Sessions', 'Total Evals'
    ];
    
    const headerRow = sheet.getRow(5);
    headerRow.values = headers;
    headerRow.height = 40;
    
    for (let i = 1; i <= 30; i++) {
      const cell = headerRow.getCell(i);
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' } // Dark Navy
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF334155' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        bottom: { style: 'thick', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } }
      };
    }

    // Define columns requiring left alignment
    const leftAlignCols = [3, 14, 15, 16]; // Name, Address, Nearest PS, Education

    // Data rows
    for (let i = 0; i < recruits.length; i++) {
      const recruit = recruits[i];
      const rowNumber = i + 6; // Data starts at row 6
      
      const row = sheet.getRow(rowNumber);
      row.height = 80; // Set row height to accommodate photo

      row.getCell('chestNumber').value = recruit.chestNumber;
      row.getCell('name').value = recruit.name;
      row.getCell('age').value = recruit.age;
      row.getCell('sex').value = recruit.sex;
      row.getCell('mobile').value = recruit.mobile;
      row.getCell('whatsappNumber').value = recruit.whatsappNumber || '';
      row.getCell('unit').value = recruit.unit;
      row.getCell('batch').value = recruit.batch?.name || 'Unassigned';
      row.getCell('squadNumber').value = recruit.squadNumber || '';
      row.getCell('homeDistrict').value = recruit.homeDistrict;
      row.getCell('taluka').value = recruit.taluka || '';
      row.getCell('pincode').value = recruit.pincode || '';
      row.getCell('address').value = recruit.address || '';
      row.getCell('nearestPoliceStation').value = recruit.nearestPoliceStation || '';
      row.getCell('education').value = recruit.education;
      row.getCell('maritalStatus').value = recruit.maritalStatus;
      row.getCell('bloodGroup').value = recruit.bloodGroup || '';
      row.getCell('height').value = recruit.height;
      row.getCell('weight').value = recruit.weight;
      row.getCell('religion').value = recruit.religion || '';
      row.getCell('caste').value = recruit.caste || '';
      row.getCell('category').value = recruit.category || '';
      row.getCell('appointmentCategory').value = recruit.appointmentCategory || '';
      row.getCell('appointmentType').value = recruit.appointmentType || '';
      row.getCell('dateOfEntry').value = recruit.dateOfEntry ? new Date(recruit.dateOfEntry).toLocaleDateString('en-GB') : '';
      row.getCell('isReturnedToDistrict').value = recruit.isReturnedToDistrict ? 'Yes' : 'No';
      row.getCell('returnedToDistrictDate').value = recruit.returnedToDistrictDate ? new Date(recruit.returnedToDistrictDate).toLocaleDateString('en-GB') : '';
      row.getCell('attendance').value = recruit.attendances.length * 2; // Morning & Afternoon
      row.getCell('evaluations').value = recruit.evaluations.length;
      
      // Handle photo
      if (recruit.photoUrl && recruit.photoUrl.startsWith('data:image')) {
        try {
          const parts = recruit.photoUrl.split(',');
          if (parts.length === 2) {
            const extMatch = parts[0].match(/data:image\/(.+);base64/);
            const ext = extMatch ? extMatch[1] : 'jpeg';
            const base64 = parts[1];

            const imageId = workbook.addImage({
              base64: base64,
              extension: ext as 'jpeg' | 'png' | 'gif',
            });

            sheet.addImage(imageId, {
              tl: { col: 0.1, row: rowNumber - 1 + 0.1 },
              ext: { width: 80, height: 90 }, 
              editAs: 'oneCell'
            });
          }
        } catch (e) {
          console.error(`Failed to process photo for recruit ${recruit.chestNumber}`, e);
        }
      }

      // Zebra Striping color
      const isEven = i % 2 === 0;
      const rowColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC'; // White or very light slate

      // Vertical align all cells and apply perfect borders
      for (let c = 1; c <= 30; c++) {
        const cell = row.getCell(c);
        cell.font = { name: 'Arial', size: 10, color: { argb: 'FF1E293B' } };
        
        // Left align specific columns, center others
        if (leftAlignCols.includes(c)) {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        }
        
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowColor }
        };
        
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="ptc_akola_recruits_${new Date().toISOString().split('T')[0]}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    });

  } catch (error) {
    console.error("Excel Export Error:", error);
    return NextResponse.json({ error: "Failed to export excel" }, { status: 500 });
  }
}
