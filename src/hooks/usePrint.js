// hooks/usePrint.js - Footer on every page
import { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const usePrint = () => {
    const componentRef = useRef(null);

    const handlePrint = async () => {
        if (!componentRef.current) {
            console.error('❌ Component ref is null');
            alert('Print component not ready. Please try again.');
            return;
        }

        try {
            console.log('📄 Generating PDF...');

            const element = componentRef.current;

            // PDF settings
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 10;
            const contentWidth = pageWidth - (2 * margin);

            // Capture sections
            const headerElement = element.querySelector('[data-pdf-section="header"]');
            const footerElement = element.querySelector('[data-pdf-section="footer"]');
            const contentElement = element.querySelector('[data-pdf-section="content"]');

            let headerCanvas = null;
            let footerCanvas = null;
            let headerHeight = 0;
            let footerHeight = 0;

            // Capture header (only once)
            if (headerElement) {
                headerCanvas = await html2canvas(headerElement, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });
                headerHeight = (headerCanvas.height * contentWidth) / headerCanvas.width;
            }

            // Capture footer (for every page)
            if (footerElement) {
                footerCanvas = await html2canvas(footerElement, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });
                footerHeight = (footerCanvas.height * contentWidth) / footerCanvas.width;
            }

            // Helper function to add footer at bottom of page
            const addFooterToPage = (pageNum) => {
                if (footerCanvas) {
                    const footerImgData = footerCanvas.toDataURL('image/png');
                    const footerY = pageHeight - margin - footerHeight - 10; // 10mm for page number
                    pdf.addImage(footerImgData, 'PNG', margin, footerY, contentWidth, footerHeight);
                }

                // Add page number below footer
                pdf.setFontSize(9);
                pdf.setTextColor(100, 116, 139);
                pdf.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
            };

            // Calculate available content height (excluding header, footer, and margins)
            const availableContentHeight = pageHeight - (2 * margin) - footerHeight - 15; // 15mm buffer for footer + page number

            // Get all content sections
            const breakableSections = contentElement.querySelectorAll('[data-pdf-break]');

            let currentPage = 1;
            let currentY = margin;
            let isFirstPage = true;

            // Add header to first page only
            if (headerCanvas && isFirstPage) {
                const headerImgData = headerCanvas.toDataURL('image/png');
                pdf.addImage(headerImgData, 'PNG', margin, currentY, contentWidth, headerHeight);
                currentY += headerHeight + 5;
            }

            // Capture table header separately for repeating
            const tableElement = contentElement.querySelector('[data-pdf-break="table"]');
            let tableHeaderCanvas = null;
            let tableHeaderHeight = 0;

            if (tableElement) {
                const tableHeader = tableElement.querySelector('thead');
                if (tableHeader) {
                    tableHeaderCanvas = await html2canvas(tableHeader, {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#14b8a6'
                    });
                    tableHeaderHeight = (tableHeaderCanvas.height * contentWidth) / tableHeaderCanvas.width;
                }
            }

            // Process each section
            for (let i = 0; i < breakableSections.length; i++) {
                const section = breakableSections[i];
                const sectionType = section.getAttribute('data-pdf-break');

                // Special handling for table section
                if (sectionType === 'table') {
                    const tbody = section.querySelector('tbody');
                    const rows = tbody ? tbody.querySelectorAll('tr') : [];

                    // Add table header first
                    if (tableHeaderCanvas) {
                        // Check if header fits on current page
                        if (currentY + tableHeaderHeight > pageHeight - margin - footerHeight - 15) {
                            // Add footer and page number to current page
                            addFooterToPage(currentPage);

                            pdf.addPage();
                            currentPage++;
                            currentY = margin + 5;
                            isFirstPage = false;
                        }

                        const tableHeaderImgData = tableHeaderCanvas.toDataURL('image/png');
                        pdf.addImage(tableHeaderImgData, 'PNG', margin, currentY, contentWidth, tableHeaderHeight);
                        currentY += tableHeaderHeight;
                    }

                    // Add each row
                    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
                        const row = rows[rowIdx];
                        const rowCanvas = await html2canvas(row, {
                            scale: 2,
                            useCORS: true,
                            logging: false,
                            backgroundColor: '#ffffff'
                        });

                        const rowImgData = rowCanvas.toDataURL('image/png');
                        const rowImgWidth = contentWidth;
                        const rowImgHeight = (rowCanvas.height * rowImgWidth) / rowCanvas.width;

                        // Check if row fits on current page
                        if (currentY + rowImgHeight > pageHeight - margin - footerHeight - 15) {
                            // Add footer and page number to current page
                            addFooterToPage(currentPage);

                            // New page
                            pdf.addPage();
                            currentPage++;
                            currentY = margin + 5;
                            isFirstPage = false;

                            // Repeat table header on new page
                            if (tableHeaderCanvas) {
                                const tableHeaderImgData = tableHeaderCanvas.toDataURL('image/png');
                                pdf.addImage(tableHeaderImgData, 'PNG', margin, currentY, contentWidth, tableHeaderHeight);
                                currentY += tableHeaderHeight;
                            }
                        }

                        // Add row
                        pdf.addImage(rowImgData, 'PNG', margin, currentY, rowImgWidth, rowImgHeight);
                        currentY += rowImgHeight;
                    }

                    currentY += 3;

                } else {
                    // Regular section (non-table)
                    const sectionCanvas = await html2canvas(section, {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        backgroundColor: section.style.backgroundColor || '#ffffff'
                    });

                    const sectionImgData = sectionCanvas.toDataURL('image/png');
                    const sectionImgWidth = contentWidth;
                    const sectionImgHeight = (sectionCanvas.height * sectionImgWidth) / sectionCanvas.width;

                    // Check if section fits
                    if (currentY + sectionImgHeight > pageHeight - margin - footerHeight - 15) {
                        // Add footer and page number to current page
                        addFooterToPage(currentPage);

                        pdf.addPage();
                        currentPage++;
                        currentY = margin + 5;
                        isFirstPage = false;
                    }

                    // Add section
                    pdf.addImage(sectionImgData, 'PNG', margin, currentY, sectionImgWidth, sectionImgHeight);
                    currentY += sectionImgHeight + 3;
                }
            }

            // Add footer and page number to final page
            addFooterToPage(currentPage);

            // Generate filename
            const bookingId = element.getAttribute('data-booking-id') || Date.now();
            const fileName = `invoice-${bookingId}.pdf`;

            // Download PDF
            pdf.save(fileName);

            console.log('✅ PDF downloaded successfully');
        } catch (error) {
            console.error('❌ PDF generation error:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    return {
        componentRef,
        handlePrint
    };
};