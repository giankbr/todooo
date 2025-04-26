import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export async function generateExcelReport(data, title) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(title);

  // Add header
  worksheet.addRow(['Date', 'Name', 'Department', 'Project', 'Task', 'Status']);

  // Add data rows
  data.forEach((update) => {
    const tasks = JSON.parse(update.tasks);
    tasks.forEach((task) => {
      worksheet.addRow([
        new Date(update.createdAt).toLocaleDateString(),
        update.user.name,
        update.user.department || 'N/A',
        update.projectName,
        task.description,
        task.completed ? 'Completed' : 'In Progress',
      ]);
    });
  });

  // Format header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.columns.forEach((column) => {
    column.width = 20;
  });

  // Generate buffer
  return await workbook.xlsx.writeBuffer();
}

export async function generatePdfReport(data, title) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Add title
      doc.fontSize(18).text(title, { align: 'center' });
      doc.moveDown();

      // Group by date and user
      const grouped = data.reduce((acc, update) => {
        const date = new Date(update.createdAt).toLocaleDateString();
        if (!acc[date]) acc[date] = {};
        if (!acc[date][update.user.name]) acc[date][update.user.name] = [];
        acc[date][update.user.name].push(update);
        return acc;
      }, {});

      // Add content
      Object.entries(grouped).forEach(([date, users]) => {
        doc.fontSize(14).text(date);
        doc.moveDown(0.5);

        Object.entries(users).forEach(([userName, updates]) => {
          doc.fontSize(12).text(userName);

          updates.forEach((update) => {
            doc.fontSize(10).text(`Project: ${update.projectName}`);

            const tasks = JSON.parse(update.tasks);
            tasks.forEach((task) => {
              doc.text(`${task.completed ? '✓' : '○'} ${task.description}`);
            });
          });

          doc.moveDown();
        });

        doc.moveDown();
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
