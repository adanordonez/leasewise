import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Type definition for autoTable
type AutoTableOptions = {
  startY?: number;
  head?: any[][];
  body?: any[][];
  theme?: string;
  headStyles?: any;
  bodyStyles?: any;
  alternateRowStyles?: any;
  columnStyles?: any;
  margin?: any;
  didDrawPage?: (data: any) => void;
};

interface AnalysisData {
  summary: {
    monthlyRent: string;
    securityDeposit: string;
    leaseStart: string;
    leaseEnd: string;
    noticePeriod: string;
  };
  redFlags: Array<{ issue: string; severity: string; explanation: string }>;
  rights: Array<{ right: string; law: string }>;
  keyDates: Array<{ event: string; date: string; description: string }>;
  scenarios: Array<{ 
    title: string; 
    advice: string; 
    actionableSteps: string[];
  }>;
  address: string;
  userName: string;
  userEmail: string;
}

export async function exportLeaseReport(data: AnalysisData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Colors
  const primaryPurple = [96, 57, 179]; // #6039B3
  const darkGray = [51, 65, 85]; // slate-700
  const mediumGray = [100, 116, 139]; // slate-500
  const lightGray = [241, 245, 249]; // slate-100
  const redColor = [220, 38, 38]; // red-600
  const greenColor = [22, 163, 74]; // green-600
  const blueColor = [37, 99, 235]; // blue-600

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Helper function to add section header
  const addSectionHeader = (title: string, icon: string, color: number[]) => {
    checkPageBreak(15);
    doc.setFillColor(...color);
    doc.roundedRect(14, yPosition, pageWidth - 28, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${icon} ${title}`, 18, yPosition + 8);
    yPosition += 18;
  };

  // === HEADER ===
  doc.setFillColor(...primaryPurple);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('LeaseChat', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Lease Analysis Report', pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), pageWidth / 2, 40, { align: 'center' });

  yPosition = 60;

  // === TENANT INFORMATION ===
  doc.setTextColor(...darkGray);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Tenant Information', 14, yPosition);
  yPosition += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mediumGray);
  doc.text(`Name: ${data.userName}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Email: ${data.userEmail}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Property: ${data.address}`, 14, yPosition);
  yPosition += 12;

  // === LEASE SUMMARY ===
  addSectionHeader('Lease Summary', '📋', primaryPurple);
  
  const summaryData = [
    ['Monthly Rent', data.summary.monthlyRent],
    ['Security Deposit', data.summary.securityDeposit],
    ['Lease Start', data.summary.leaseStart],
    ['Lease End', data.summary.leaseEnd],
    ['Notice Period', data.summary.noticePeriod],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Item', 'Details']],
    body: summaryData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryPurple,
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkGray,
    },
    alternateRowStyles: {
      fillColor: lightGray,
    },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // === RED FLAGS ===
  if (data.redFlags.length > 0) {
    addSectionHeader(`Red Flags (${data.redFlags.length})`, '⚠️', redColor);
    
    data.redFlags.forEach((flag, index) => {
      checkPageBreak(25);
      
      // Flag box
      doc.setFillColor(254, 242, 242); // red-50
      doc.roundedRect(14, yPosition, pageWidth - 28, 20, 1, 1, 'F');
      
      // Severity badge
      const severityColors: Record<string, number[]> = {
        high: [220, 38, 38], // red-600
        medium: [234, 179, 8], // yellow-600
        low: [100, 116, 139], // slate-500
      };
      const badgeColor = severityColors[flag.severity.toLowerCase()] || mediumGray;
      doc.setFillColor(...badgeColor);
      doc.roundedRect(pageWidth - 40, yPosition + 2, 24, 5, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(flag.severity.toUpperCase(), pageWidth - 28, yPosition + 5, { align: 'center' });
      
      // Issue title
      doc.setTextColor(...darkGray);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(flag.issue, 18, yPosition + 6, { maxWidth: pageWidth - 60 });
      
      // Explanation
      doc.setTextColor(...mediumGray);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(flag.explanation, pageWidth - 36);
      doc.text(lines, 18, yPosition + 12);
      
      yPosition += 25;
    });
    
    yPosition += 5;
  }

  // === YOUR RIGHTS ===
  if (data.rights.length > 0) {
    checkPageBreak(20);
    addSectionHeader(`Your Rights (${data.rights.length})`, '✓', greenColor);
    
    data.rights.forEach((right, index) => {
      checkPageBreak(18);
      
      // Right box
      doc.setFillColor(240, 253, 244); // green-50
      doc.roundedRect(14, yPosition, pageWidth - 28, 16, 1, 1, 'F');
      
      // Right title
      doc.setTextColor(...darkGray);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(right.right, 18, yPosition + 5, { maxWidth: pageWidth - 36 });
      
      // Law reference
      if (right.law) {
        doc.setTextColor(...mediumGray);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        const lawLines = doc.splitTextToSize(right.law, pageWidth - 36);
        doc.text(lawLines, 18, yPosition + 11);
      }
      
      yPosition += 18;
    });
    
    yPosition += 5;
  }

  // === KEY DATES ===
  if (data.keyDates.length > 0) {
    checkPageBreak(20);
    addSectionHeader(`Key Dates (${data.keyDates.length})`, '📅', blueColor);
    
    const datesData = data.keyDates.map(date => [
      date.event,
      date.date,
      date.description,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Event', 'Date', 'Description']],
      body: datesData,
      theme: 'striped',
      headStyles: {
        fillColor: blueColor,
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: darkGray,
      },
      alternateRowStyles: {
        fillColor: [239, 246, 255], // blue-50
      },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 30 },
        2: { cellWidth: 'auto' },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // === COMMON SCENARIOS ===
  if (data.scenarios && data.scenarios.length > 0) {
    checkPageBreak(20);
    addSectionHeader(`Common Scenarios (${data.scenarios.length})`, '📋', primaryPurple);
    
    data.scenarios.forEach((scenario, index) => {
      checkPageBreak(40);
      
      // Scenario title
      doc.setTextColor(...darkGray);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${scenario.title}`, 18, yPosition);
      yPosition += 8;
      
      // Scenario advice
      doc.setTextColor(...darkGray);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const adviceLines = doc.splitTextToSize(scenario.advice, pageWidth - 36);
      doc.text(adviceLines, 18, yPosition);
      yPosition += adviceLines.length * 4 + 5;
      
      // Action steps
      if (scenario.actionableSteps && scenario.actionableSteps.length > 0) {
        doc.setTextColor(...mediumGray);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('What to do:', 18, yPosition);
        yPosition += 5;
        
        scenario.actionableSteps.forEach((step, stepIndex) => {
          checkPageBreak(15);
          doc.setTextColor(...darkGray);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(`  ${stepIndex + 1}. ${step}`, 18, yPosition);
          yPosition += 4;
        });
      }
      
      yPosition += 10;
    });
    
    yPosition += 5;
  }

  // === FOOTER ON LAST PAGE ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Page number
    doc.setFontSize(8);
    doc.setTextColor(...mediumGray);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    
    // Disclaimer on last page
    if (i === totalPages) {
      doc.setFontSize(7);
      doc.setTextColor(...mediumGray);
      const disclaimer = 'Disclaimer: This is a beta product. It uses AI and may provide wrong information. LeaseChat provides legal information, not legal advice. Using LeaseChat does not create an attorney-client relationship. LeaseChat is not your attorney.';
      const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 28);
      doc.text(disclaimerLines, 14, pageHeight - 25);
    }
    
    // Branding
    doc.setFontSize(7);
    doc.setTextColor(128, 0, 0); // UChicago maroon
    doc.text('Generated by LeaseChat | UChicago Law School AI Lab', 14, pageHeight - 10);
  }

  // Save the PDF
  const filename = `LeaseChat_Report_${data.userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

