import fs from 'fs';
import path from 'path';
import exceljs from 'exceljs';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    addDoc,
  } from 'firebase/firestore';

const writeFileAsync = promisify(fs.writeFile);

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  
  const app = initializeApp(firebaseConfig);
  const firestore = getFirestore(app);
  

export default async (req, res) => {
  const { customerName, purchaseNo, date, poAmount, supplyData, totalAmount, labourWorksData, labourWorksTotalCost } = req.body;

  // Create a new Excel workbook
  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet('Customer Data');

  // Clear the existing sheet
  worksheet.spliceRows(1, worksheet.rowCount);

  // Add the customer data to the worksheet
  const customerDataSubHeadingRow = worksheet.addRow(['Customer Name', 'Purchase No', 'Date', 'P.O. Amount']);
  customerDataSubHeadingRow.eachCell((cell) => {
    cell.font = { bold: true }; // Apply bold font to "Customer data" sub-heading cells
  });
  worksheet.addRow([customerName, purchaseNo, date, poAmount]);

  // Add the purchase data to the worksheet
  worksheet.addRow([]);
  const purchaseDataSubHeadingRow = worksheet.addRow(['Supply Name', 'Invoice No', 'Date', 'Amount']);
  purchaseDataSubHeadingRow.eachCell((cell) => {
    cell.font = { bold: true }; // Apply bold font to "Purchase data" sub-heading cells
  });

  supplyData.forEach((item) => {
    const { supplyName, otherSupplyName, invoiceNo, date, amount } = item;
    const supplyNameValue = supplyName === 'Others' ? otherSupplyName : supplyName;
    worksheet.addRow([supplyNameValue, invoiceNo, date, amount]);
  });

  // Add the total amount to the worksheet
  worksheet.addRow([]);
  const totalAmountRow = worksheet.addRow(['Total Amount', '', '', totalAmount]);

  // Add the labour works data to the worksheet
  worksheet.addRow([]);
  const labourWorksSubHeadingRow = worksheet.addRow(['Labour Works', 'Supplier Name', 'Our D.C. No', 'Sub D.C. No', 'Amount', 'GST No']);
  labourWorksSubHeadingRow.eachCell((cell) => {
    cell.font = { bold: true }; // Apply bold font to "Labour works" sub-heading cells
  });

  labourWorksData.forEach((item) => {
    const { option, supplierName, ourDC, subDC, amount, gstNo } = item;
    if (option !== 'Not-Used') {
      worksheet.addRow([option, supplierName, ourDC, subDC, amount, gstNo]);
    }
  });

  // Add the total cost to the worksheet
  worksheet.addRow([]);
  const totalCostRow = worksheet.addRow(['Total Cost', '', '', '', '', labourWorksTotalCost]);

  // Add the total amount values row to the worksheet
  worksheet.addRow([]);
  const totalAmountValuesRow = worksheet.addRow([
    'Customer-Name',
    'Purchase No',
    'Date',
    'Raw-Material-Total Amount',
    'Labour-Total Amount',
    'Actual Expenses',
    'Net-Amount',
  ]);
  totalAmountValuesRow.eachCell((cell) => {
    cell.font = { bold: true }; // Apply bold font to sub-heading cells
  });

  const rawMaterialTotalAmountFormula = `D${totalAmountRow.number}`;
  const labourTotalAmountFormula = `F${totalCostRow.number}`;
  const actualExpensesFormula = `SUM(D${totalAmountRow.number}, F${totalCostRow.number})`;

  const totalAmountValuesRowValues = totalAmountValuesRow.values;
  const totalActualExpenses = totalAmountValuesRowValues.findIndex((value) => value === 'Actual Expenses') + 1;

  const netAmountFormula = `D2 - ${actualExpensesFormula}`;

  const summaryRow = worksheet.addRow([
    customerName,
    purchaseNo,
    date,
    { formula: rawMaterialTotalAmountFormula },
    { formula: labourTotalAmountFormula },
    { formula: actualExpensesFormula },
    { formula: netAmountFormula },
  ]);

  // Generate a unique filename for the Excel sheet
  const fileName = `${customerName}_${purchaseNo}.xlsx`;
  const excelFilePath = path.join(process.cwd(), 'public', 'excel', fileName);
  await writeFileAsync(excelFilePath, await workbook.xlsx.writeBuffer());

  try {
    const downloadUrl = `/excel/${fileName}`;
    res.status(200).json({ downloadUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create the Excel sheet.' });
  }
};
