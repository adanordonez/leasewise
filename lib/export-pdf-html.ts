import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LeaseReportHTML from '@/components/LeaseReportHTML';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  comprehensiveLegalInfo?: Array<{
    lawType: string;
    explanation: string;
    example: string;
    sourceUrl?: string;
    sourceTitle?: string;
  }>;
}

/**
 * Export lease report as PDF using HTML-to-canvas approach
 * This creates a beautiful, branded PDF with proper styling
 */
export async function exportLeaseReportHTML(data: AnalysisData): Promise<void> {
  try {

    // Create a temporary container optimized for portrait A4
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '1000px'; // Optimized for A4 portrait (210mm)
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    document.body.appendChild(tempContainer);

    // Render the HTML component with PDF flag
    const htmlElement = createElement(LeaseReportHTML, { data, isPDF: true });
    const htmlContent = renderToStaticMarkup(htmlElement);
    
    // Add CSS to ensure proper table rendering and page breaks
    const cssStyles = `
      <style>
        table { 
          border-collapse: separate !important;
          border-spacing: 0 !important;
          width: 100% !important;
          page-break-inside: auto !important;
        }
        thead { 
          display: table-header-group !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
        }
        tbody { 
          page-break-inside: auto !important;
        }
        tr { 
          page-break-inside: avoid !important;
          page-break-after: auto !important;
        }
        td, th { 
          padding: 8px 12px !important;
          vertical-align: top !important;
          word-wrap: break-word !important;
          white-space: normal !important;
          line-height: 1.5 !important;
          page-break-inside: avoid !important;
        }
        .align-top { 
          vertical-align: top !important; 
        }
        .table-container {
          page-break-inside: auto !important;
        }
        @media print {
          table {
            page-break-inside: auto !important;
          }
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
        }
      </style>
    `;
    
    tempContainer.innerHTML = cssStyles + htmlContent;

    // Wait for fonts and images to load, and ensure proper layout calculation
    await new Promise(resolve => setTimeout(resolve, 3000)); // Increased for proper table height calculation
    
    // Ensure all images are loaded
    const images = tempContainer.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve(true);
        } else {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(true); // Continue even if image fails
          // Timeout after 3 seconds
          setTimeout(() => resolve(true), 3000);
        }
      });
    });
    
    await Promise.all(imagePromises);

    // Convert to canvas with high quality
    const canvas = await html2canvas(tempContainer, {
      scale: 2, // High quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: tempContainer.scrollWidth,
      height: tempContainer.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      imageTimeout: 5000, // Wait up to 5 seconds for images
      logging: false, // Disable console logging
    });

    // Clean up
    document.body.removeChild(tempContainer);

    // Create PDF with portrait orientation for better multi-page layout
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Calculate how to fit the content width-wise
    // We want the content to fit the page width
    const ratio = pdfWidth / (imgWidth / 2); // Divide by 2 because of scale: 2
    const scaledHeight = (imgHeight / 2) * ratio; // Height after scaling
    const scaledWidth = pdfWidth;

    // Calculate how many pages we need
    const pageCount = Math.ceil(scaledHeight / pdfHeight);
    
    console.log(`📄 Generating ${pageCount} page(s) for PDF...`);

    // Add pages and split content across them
    for (let i = 0; i < pageCount; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      // Calculate the portion of the image to show on this page
      const sourceY = (i * pdfHeight) / ratio * 2; // Source Y position in canvas
      const sourceHeight = Math.min((pdfHeight / ratio) * 2, imgHeight - sourceY); // Height of slice
      
      // Create a temporary canvas for this page's content
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = imgWidth;
      pageCanvas.height = sourceHeight;
      
      const pageCtx = pageCanvas.getContext('2d');
      if (pageCtx) {
        // Draw the slice of the original canvas
        pageCtx.drawImage(
          canvas,
          0, sourceY, // Source X, Y
          imgWidth, sourceHeight, // Source width, height
          0, 0, // Destination X, Y
          imgWidth, sourceHeight // Destination width, height
        );
        
        // Convert page canvas to image
        const pageImgData = pageCanvas.toDataURL('image/png');
        
        // Calculate the height for this page (might be less on last page)
        const pageHeight = Math.min(pdfHeight, scaledHeight - (i * pdfHeight));
        
        // Add this slice to the PDF
        pdf.addImage(pageImgData, 'PNG', 0, 0, scaledWidth, pageHeight);
      }
    }

    console.log(`✅ ${pageCount} page(s) added to PDF`);

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const addressSlug = data.address ? 
      data.address.split(',')[0].replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20) : 
      'lease';
    const filename = `LeaseWise_Report_${addressSlug}_${timestamp}.pdf`;

    // Save the PDF
    pdf.save(filename);

    console.log('✅ PDF export completed successfully!');

  } catch (error) {
    console.error('❌ Error exporting PDF:', error);
    
    // Fallback to simple text export
    const fallbackContent = `
LeaseWise - Lease Analysis Report
Generated: ${new Date().toLocaleDateString()}

TENANT INFORMATION
Name: ${data.userName}
Email: ${data.userEmail}
Property: ${data.address}

LEASE SUMMARY
Monthly Rent: ${data.summary.monthlyRent}
Security Deposit: ${data.summary.securityDeposit}
Lease Start: ${data.summary.leaseStart}
Lease End: ${data.summary.leaseEnd}
Notice Period: ${data.summary.noticePeriod}

RED FLAGS
${data.redFlags.map(flag => `- ${flag.issue} (${flag.severity}): ${flag.explanation}`).join('\n')}

Generated by LeaseWise | University of Chicago Law School AI Lab
    `;

    const blob = new Blob([fallbackContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LeaseWise_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * Alternative method using Puppeteer (server-side)
 * This would be more reliable but requires server-side rendering
 */
export async function exportLeaseReportServer(data: AnalysisData): Promise<void> {
  // This would require setting up Puppeteer on the server
  // For now, we'll use the client-side approach above
  console.log('Server-side PDF export not implemented yet');
  await exportLeaseReportHTML(data);
}
