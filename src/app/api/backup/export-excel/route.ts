import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function GET() {
  const session = await getSession();
  
  if (!session || session.role !== "ADMIN") {
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

    // Columns
    sheet.columns = [
      { header: 'Photo', key: 'photo', width: 15 },
      { header: 'Chest No', key: 'chestNumber', width: 12 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Age', key: 'age', width: 10 },
      { header: 'Gender', key: 'sex', width: 10 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'WhatsApp', key: 'whatsappNumber', width: 15 },
      { header: 'Unit', key: 'unit', width: 20 },
      { header: 'Batch', key: 'batch', width: 15 },
      { header: 'Squad No', key: 'squadNumber', width: 12 },
      { header: 'District', key: 'homeDistrict', width: 20 },
      { header: 'Taluka', key: 'taluka', width: 15 },
      { header: 'Pincode', key: 'pincode', width: 12 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'Nearest Police Station', key: 'nearestPoliceStation', width: 20 },
      { header: 'Education', key: 'education', width: 15 },
      { header: 'Marital Status', key: 'maritalStatus', width: 15 },
      { header: 'Blood Group', key: 'bloodGroup', width: 12 },
      { header: 'Height (cm)', key: 'height', width: 12 },
      { header: 'Weight (kg)', key: 'weight', width: 12 },
      { header: 'Religion', key: 'religion', width: 15 },
      { header: 'Caste', key: 'caste', width: 15 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Appt. Category', key: 'appointmentCategory', width: 20 },
      { header: 'Appt. Type', key: 'appointmentType', width: 20 },
      { header: 'Date of Entry', key: 'dateOfEntry', width: 15 },
      { header: 'Returned to District?', key: 'isReturnedToDistrict', width: 18 },
      { header: 'Returned Date', key: 'returnedToDistrictDate', width: 15 },
      { header: 'Total Att. Sessions', key: 'attendance', width: 18 },
      { header: 'Total Evals', key: 'evaluations', width: 15 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    for (let i = 0; i < recruits.length; i++) {
      const recruit = recruits[i];
      const rowNumber = i + 2; // Data starts at row 2
      
      const row = sheet.getRow(rowNumber);
      row.height = 75; // Set row height to accommodate photo

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
      
      // Vertical align all cells
      row.alignment = { vertical: 'middle' };

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

            // Add image to the specific cell (0-indexed for col/row internally in some methods, but tl uses 0-based float)
            // Column A is index 0
            sheet.addImage(imageId, {
              tl: { col: 0.1, row: rowNumber - 1 + 0.1 },
              ext: { width: 80, height: 90 }, // size of image in pixels
              editAs: 'oneCell'
            });
          }
        } catch (e) {
          console.error(`Failed to process photo for recruit ${recruit.chestNumber}`, e);
        }
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
