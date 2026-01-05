import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { calculateGrade } from './grading';
import { getEthiopianMonthName } from './ethiopianCalendar';
import { addGeezFontSupport, getDisplayText } from './geezFont';

// Export to PDF with Geez font support
export const exportToPDF = (reports, month, year, language = 'en') => {
  try {
    console.log('Exporting to PDF:', { reports, month, year, language });
    const doc = new jsPDF();
    
    // Try to add Geez font support
    const hasGeezFont = addGeezFontSupport(doc);
    const useAmharic = language === 'am' && hasGeezFont;
    
    // Add note about font support
    if (language === 'am' && !hasGeezFont) {
      console.log('Amharic requested but Geez font not available, using English');
    }
    
    // Title
    doc.setFontSize(18);
    const title = getDisplayText('የወርሃዊ እድገት ሪፖርት', 'Monthly Progress Report', !useAmharic);
    doc.text(title, 14, 20);
  
  // Month and Year
  doc.setFontSize(12);
  const monthName = getEthiopianMonthName(month, useAmharic ? 'amharic' : 'english');
  const monthLabel = getDisplayText('ወር', 'Month', !useAmharic);
  const dateLabel = getDisplayText('ቀን', 'Date', !useAmharic);
  
  doc.text(`${monthLabel}: ${monthName} ${year}`, 14, 30);
  doc.text(`${dateLabel}: ${new Date().toLocaleDateString()}`, 14, 37);
  
  // Table
  const tableData = reports.map(report => {
    const gradeInfo = calculateGrade(Number(report.progress_percentage) || 0);
    return [
      report.branch_name || '',
      (Number(report.target_amount) || 0).toLocaleString(),
      (Number(report.achieved_amount) || 0).toLocaleString(),
      `${(Number(report.progress_percentage) || 0).toFixed(1)}%`,
      gradeInfo.grade,
      report.status === 'submitted' ? getDisplayText('ገብቷል', 'Submitted', !useAmharic) :
      report.status === 'late' ? getDisplayText('ዘግይቷል', 'Late', !useAmharic) :
      getDisplayText('በመጠባበቅ ላይ', 'Pending', !useAmharic)
    ];
  });
  
  doc.autoTable({
    startY: 45,
    head: [[
      getDisplayText('ቅርንጫፍ', 'Branch', !useAmharic),
      getDisplayText('እቅድ', 'Target', !useAmharic),
      getDisplayText('የተሳካ', 'Achieved', !useAmharic),
      getDisplayText('እድገት', 'Progress', !useAmharic),
      getDisplayText('ደረጃ', 'Grade', !useAmharic),
      getDisplayText('ሁኔታ', 'Status', !useAmharic)
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [124, 58, 237] },
    styles: { fontSize: 10 }
  });
  
  // Add new page for charts
  doc.addPage();
  
  // Chart Title
  doc.setFontSize(16);
  const chartTitle = getDisplayText('የእድገት ግራፍ', 'Progress Chart', !useAmharic);
  doc.text(chartTitle, 14, 20);
  
  // Sort reports by progress for better visualization
  const sortedReports = [...reports].sort((a, b) => 
    (Number(b.progress_percentage) || 0) - (Number(a.progress_percentage) || 0)
  );
  
  // Bar Chart - Branch Progress
  const chartStartY = 35;
  const chartHeight = 120;
  const chartWidth = 180;
  const barWidth = Math.min(15, chartWidth / sortedReports.length - 2);
  const maxProgress = 100;
  
  // Draw axes
  doc.setDrawColor(100);
  doc.setLineWidth(0.5);
  doc.line(14, chartStartY + chartHeight, 14 + chartWidth, chartStartY + chartHeight); // X-axis
  doc.line(14, chartStartY, 14, chartStartY + chartHeight); // Y-axis
  
  // Y-axis labels
  doc.setFontSize(8);
  doc.setTextColor(100);
  for (let i = 0; i <= 5; i++) {
    const y = chartStartY + chartHeight - (i * chartHeight / 5);
    const label = (i * 20).toString() + '%';
    doc.text(label, 8, y + 2, { align: 'right' });
    doc.setDrawColor(200);
    doc.line(14, y, 14 + chartWidth, y); // Grid lines
  }
  
  // Draw bars
  sortedReports.forEach((report, index) => {
    const progress = Number(report.progress_percentage) || 0;
    const barHeight = Math.max((progress / maxProgress) * chartHeight, 1); // Minimum 1px height
    const x = 14 + (index * (barWidth + 2)) + 5;
    const y = chartStartY + chartHeight - barHeight;
    
    // Color based on grade
    const gradeInfo = calculateGrade(progress);
    let color;
    if (progress >= 90) color = [16, 185, 129]; // Green
    else if (progress >= 75) color = [59, 130, 246]; // Blue
    else if (progress >= 60) color = [251, 146, 60]; // Orange
    else color = [239, 68, 68]; // Red
    
    // Draw bar with border
    doc.setFillColor(...color);
    doc.setDrawColor(100);
    doc.setLineWidth(0.3);
    doc.rect(x, y, barWidth, barHeight, 'FD');
    
    // Branch name (vertical or angled based on space)
    doc.setFontSize(6);
    doc.setTextColor(0);
    const branchName = (report.branch_name || '').substring(0, 10); // Limit length
    doc.text(branchName, x + barWidth/2, chartStartY + chartHeight + 4, {
      angle: 45,
      align: 'left'
    });
    
    // Progress value on top of bar (only if bar is tall enough)
    if (barHeight > 5) {
      doc.setFontSize(6);
      doc.setTextColor(0);
      doc.text(`${progress.toFixed(0)}%`, x + barWidth/2, y - 1, { align: 'center' });
    }
    
    // Grade letter inside bar if tall enough
    if (barHeight > 10) {
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(gradeInfo.grade, x + barWidth/2, y + barHeight/2 + 2, { align: 'center' });
    }
  });
  
  // Grade Distribution Pie Chart
  const pieY = chartStartY + chartHeight + 40;
  doc.setFontSize(14);
  doc.setTextColor(0);
  const pieTitle = getDisplayText('የደረጃ ስርጭት', 'Grade Distribution', !useAmharic);
  doc.text(pieTitle, 14, pieY);
  
  // Calculate grade distribution
  const gradeDistribution = {};
  reports.forEach(report => {
    const gradeInfo = calculateGrade(Number(report.progress_percentage) || 0);
    gradeDistribution[gradeInfo.grade] = (gradeDistribution[gradeInfo.grade] || 0) + 1;
  });
  
  // Draw pie chart with proper wedges
  const pieX = 105;
  const pieYCenter = pieY + 30;
  const pieRadius = 25;
  let startAngle = -Math.PI / 2; // Start from top
  const colors = {
    'A+': [16, 185, 129], 'A': [34, 197, 94], 'B+': [59, 130, 246], 'B': [96, 165, 250],
    'C+': [251, 146, 60], 'C': [251, 191, 36], 'D': [239, 68, 68], 'F': [220, 38, 38]
  };
  
  // Draw legend
  let legendY = pieY + 15;
  Object.entries(gradeDistribution).forEach(([grade, count], index) => {
    const color = colors[grade] || [150, 150, 150];
    const legendX = 20;
    const currentY = legendY + (index * 8);
    
    // Color box
    doc.setFillColor(...color);
    doc.rect(legendX, currentY - 3, 5, 5, 'F');
    
    // Label
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text(`${grade}: ${count} (${((count/reports.length)*100).toFixed(0)}%)`, legendX + 8, currentY + 1);
  });
  
  // Draw pie slices
  Object.entries(gradeDistribution).forEach(([grade, count]) => {
    const angle = (count / reports.length) * 2 * Math.PI;
    const color = colors[grade] || [150, 150, 150];
    const endAngle = startAngle + angle;
    
    // Draw wedge
    doc.setFillColor(...color);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    
    // Create path for wedge
    const steps = 50;
    const angleStep = angle / steps;
    
    // Start at center
    doc.moveTo(pieX, pieYCenter);
    
    // Draw arc
    for (let i = 0; i <= steps; i++) {
      const currentAngle = startAngle + (i * angleStep);
      const x = pieX + pieRadius * Math.cos(currentAngle);
      const y = pieYCenter + pieRadius * Math.sin(currentAngle);
      if (i === 0) {
        doc.line(pieX, pieYCenter, x, y);
      }
    }
    
    // Draw the arc using lines
    const arcX1 = pieX + pieRadius * Math.cos(startAngle);
    const arcY1 = pieYCenter + pieRadius * Math.sin(startAngle);
    const arcX2 = pieX + pieRadius * Math.cos(endAngle);
    const arcY2 = pieYCenter + pieRadius * Math.sin(endAngle);
    
    doc.setFillColor(...color);
    
    // Simple wedge approximation
    const segments = 20;
    for (let i = 0; i < segments; i++) {
      const a1 = startAngle + (angle * i / segments);
      const a2 = startAngle + (angle * (i + 1) / segments);
      const x1 = pieX + pieRadius * Math.cos(a1);
      const y1 = pieYCenter + pieRadius * Math.sin(a1);
      const x2 = pieX + pieRadius * Math.cos(a2);
      const y2 = pieYCenter + pieRadius * Math.sin(a2);
      
      doc.triangle(pieX, pieYCenter, x1, y1, x2, y2, 'FD');
    }
    
    startAngle = endAngle;
  });
  
  // Summary on new page or below
  const summaryY = pieY + 70;
  const totalTarget = reports.reduce((sum, r) => sum + (Number(r.target_amount) || 0), 0);
  const totalAchieved = reports.reduce((sum, r) => sum + (Number(r.achieved_amount) || 0), 0);
  const avgProgress = reports.length > 0 
    ? reports.reduce((sum, r) => sum + (Number(r.progress_percentage) || 0), 0) / reports.length 
    : 0;
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  const summaryTitle = getDisplayText('ማጠቃለያ:', 'Summary:', !useAmharic);
  doc.text(summaryTitle, 14, summaryY);
  doc.setFontSize(10);
  
  const totalTargetLabel = getDisplayText('ጠቅላላ እቅድ', 'Total Target', !useAmharic);
  const totalAchievedLabel = getDisplayText('ጠቅላላ የተሳካ', 'Total Achieved', !useAmharic);
  const avgProgressLabel = getDisplayText('አማካይ እድገት', 'Average Progress', !useAmharic);
  const totalReportsLabel = getDisplayText('ጠቅላላ ሪፖርቶች', 'Total Reports', !useAmharic);
  
  doc.text(`${totalTargetLabel}: ${totalTarget.toLocaleString()}`, 14, summaryY + 7);
  doc.text(`${totalAchievedLabel}: ${totalAchieved.toLocaleString()}`, 14, summaryY + 14);
  doc.text(`${avgProgressLabel}: ${(Number(avgProgress) || 0).toFixed(1)}%`, 14, summaryY + 21);
  doc.text(`${totalReportsLabel}: ${reports.length}`, 14, summaryY + 28);
  
  // Add font notice if using English fallback
  if (language === 'am' && !useAmharic) {
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Note: Amharic font not available, displaying in English', 14, summaryY + 40);
  }
  
  // Save
    doc.save(`monthly-report-${monthName}-${year}.pdf`);
    console.log('PDF exported successfully');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert(`Failed to export PDF: ${error.message}`);
  }
};

// Export to Excel
export const exportToExcel = (reports, month, year, language = 'en') => {
  try {
    console.log('Exporting to Excel:', { reports, month, year, language });
    const excelMonthName = getEthiopianMonthName(month, language === 'am' ? 'amharic' : 'english');
  
  const data = reports.map(report => {
    const gradeInfo = calculateGrade(Number(report.progress_percentage) || 0);
    return {
      [language === 'am' ? 'ቅርንጫፍ' : 'Branch']: report.branch_name || '',
      [language === 'am' ? 'እቅድ' : 'Target']: Number(report.target_amount) || 0,
      [language === 'am' ? 'የተሳካ' : 'Achieved']: Number(report.achieved_amount) || 0,
      [language === 'am' ? 'እድገት %' : 'Progress %']: (Number(report.progress_percentage) || 0).toFixed(1),
      [language === 'am' ? 'ደረጃ' : 'Grade']: gradeInfo.grade,
      [language === 'am' ? 'ሁኔታ' : 'Status']: 
        report.status === 'submitted' ? (language === 'am' ? 'ገብቷል' : 'Submitted') :
        report.status === 'late' ? (language === 'am' ? 'ዘግይቷል' : 'Late') :
        (language === 'am' ? 'በመጠባበቅ ላይ' : 'Pending'),
      [language === 'am' ? 'የገባበት ቀን' : 'Submitted Date']: 
        report.submitted_at ? new Date(report.submitted_at).toLocaleString() : '-'
    };
  });
  
  // Create main reports sheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reports');
    
    // Create chart data sheet (sorted by progress)
    const chartData = reports
      .map(report => ({
        [language === 'am' ? 'ቅርንጫፍ' : 'Branch']: report.branch_name || '',
        [language === 'am' ? 'እድገት %' : 'Progress %']: Number(report.progress_percentage) || 0,
        [language === 'am' ? 'ደረጃ' : 'Grade']: calculateGrade(Number(report.progress_percentage) || 0).grade
      }))
      .sort((a, b) => b[language === 'am' ? 'እድገት %' : 'Progress %'] - a[language === 'am' ? 'እድገት %' : 'Progress %']);
    
    const wsChart = XLSX.utils.json_to_sheet(chartData);
    XLSX.utils.book_append_sheet(wb, wsChart, 'Chart Data');
    
    // Create summary sheet
    const totalTarget = reports.reduce((sum, r) => sum + (Number(r.target_amount) || 0), 0);
    const totalAchieved = reports.reduce((sum, r) => sum + (Number(r.achieved_amount) || 0), 0);
    const avgProgress = reports.length > 0 
      ? reports.reduce((sum, r) => sum + (Number(r.progress_percentage) || 0), 0) / reports.length 
      : 0;
    
    const summaryData = [
      { [language === 'am' ? 'መለኪያ' : 'Metric']: language === 'am' ? 'ጠቅላላ እቅድ' : 'Total Target', [language === 'am' ? 'ዋጋ' : 'Value']: totalTarget },
      { [language === 'am' ? 'መለኪያ' : 'Metric']: language === 'am' ? 'ጠቅላላ የተሳካ' : 'Total Achieved', [language === 'am' ? 'ዋጋ' : 'Value']: totalAchieved },
      { [language === 'am' ? 'መለኪያ' : 'Metric']: language === 'am' ? 'አማካይ እድገት %' : 'Average Progress %', [language === 'am' ? 'ዋጋ' : 'Value']: Number(avgProgress).toFixed(1) },
      { [language === 'am' ? 'መለኪያ' : 'Metric']: language === 'am' ? 'ጠቅላላ ሪፖርቶች' : 'Total Reports', [language === 'am' ? 'ዋጋ' : 'Value']: reports.length }
    ];
    
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    
    XLSX.writeFile(wb, `monthly-report-${excelMonthName}-${year}.xlsx`);
    console.log('Excel exported successfully');
  } catch (error) {
    console.error('Error exporting Excel:', error);
    alert(`Failed to export Excel: ${error.message}`);
  }
};

// Export to Word
export const exportToWord = async (reports, month, year, language = 'en') => {
  try {
    console.log('Exporting to Word:', { reports, month, year, language });
    const wordMonthName = getEthiopianMonthName(month, language === 'am' ? 'amharic' : 'english');
  
  const tableRows = [
    // Header row
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: language === 'am' ? 'ቅርንጫፍ' : 'Branch', bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: language === 'am' ? 'እቅድ' : 'Target', bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: language === 'am' ? 'የተሳካ' : 'Achieved', bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: language === 'am' ? 'እድገት' : 'Progress', bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: language === 'am' ? 'ደረጃ' : 'Grade', bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: language === 'am' ? 'ሁኔታ' : 'Status', bold: true })] })
      ]
    }),
    // Data rows
    ...reports.map(report => {
      const gradeInfo = calculateGrade(Number(report.progress_percentage) || 0);
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(report.branch_name || '')] }),
          new TableCell({ children: [new Paragraph((Number(report.target_amount) || 0).toLocaleString())] }),
          new TableCell({ children: [new Paragraph((Number(report.achieved_amount) || 0).toLocaleString())] }),
          new TableCell({ children: [new Paragraph(`${(Number(report.progress_percentage) || 0).toFixed(1)}%`)] }),
          new TableCell({ children: [new Paragraph(gradeInfo.grade)] }),
          new TableCell({ children: [new Paragraph(
            report.status === 'submitted' ? (language === 'am' ? 'ገብቷል' : 'Submitted') :
            report.status === 'late' ? (language === 'am' ? 'ዘግይቷል' : 'Late') :
            (language === 'am' ? 'በመጠባበቅ ላይ' : 'Pending')
          )] })
        ]
      });
    })
  ];
  
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          text: language === 'am' ? 'የወርሃዊ እድገት ሪፖርት' : 'Monthly Progress Report',
          heading: 'Heading1',
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          text: `${language === 'am' ? 'ወር' : 'Month'}: ${wordMonthName} ${year}`,
          spacing: { before: 200, after: 200 }
        }),
        new Paragraph({
          text: `${language === 'am' ? 'ቀን' : 'Date'}: ${new Date().toLocaleDateString()}`,
          spacing: { after: 400 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows
        }),
        new Paragraph({
          text: language === 'am' ? 'ማጠቃለያ' : 'Summary',
          heading: 'Heading2',
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          text: `${language === 'am' ? 'ጠቅላላ እቅድ' : 'Total Target'}: ${reports.reduce((sum, r) => sum + (Number(r.target_amount) || 0), 0).toLocaleString()}`
        }),
        new Paragraph({
          text: `${language === 'am' ? 'ጠቅላላ የተሳካ' : 'Total Achieved'}: ${reports.reduce((sum, r) => sum + (Number(r.achieved_amount) || 0), 0).toLocaleString()}`
        }),
        new Paragraph({
          text: `${language === 'am' ? 'አማካይ እድገት' : 'Average Progress'}: ${(reports.length > 0 ? reports.reduce((sum, r) => sum + (Number(r.progress_percentage) || 0), 0) / reports.length : 0).toFixed(1)}%`
        })
      ]
    }]
  });
  
  const blob = await Packer.toBlob(doc);
    saveAs(blob, `monthly-report-${wordMonthName}-${year}.docx`);
    console.log('Word exported successfully');
  } catch (error) {
    console.error('Error exporting Word:', error);
    alert(`Failed to export Word: ${error.message}`);
  }
};

// ===== AMHARIC PLAN EXPORTS =====

// Export Amharic Plans to PDF with proper Ethiopian formatting
export const exportAmharicPlanToPDF = (plan, activities, language = 'am') => {
  try {
    console.log('Exporting Amharic Plan to PDF:', { plan, activities, language });
    const doc = new jsPDF();
    
    // Add Geez font support
    const hasGeezFont = addGeezFontSupport(doc);
    const useAmharic = language === 'am' && hasGeezFont;
    
    // Set font for Amharic text
    if (useAmharic) {
      doc.setFont('GeezDigital_V1');
    }
    
    // Title Section - Main Goal
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const mainTitle = `ዓላማ፡- ${plan.plan_title_amharic || plan.title}`;
    const wrappedTitle = doc.splitTextToSize(mainTitle, 180);
    doc.text(wrappedTitle, 14, 20);
    
    let currentY = 20 + (wrappedTitle.length * 6) + 10;
    
    // Plan summary line
    const monthName = getEthiopianMonthName(plan.plan_month, 'amharic');
    const summaryText = `የማህበራዊ ተቋር ወደሊት ተላላፊ አካሎች 148117 ወደ 1,317,376 ማድረግ፡ (4.54)`;
    const wrappedSummary = doc.splitTextToSize(summaryText, 180);
    doc.text(wrappedSummary, 14, currentY);
    currentY += (wrappedSummary.length * 6) + 15;
    
    // Activities Section - Narrative Format
    doc.setFontSize(11);
    activities.forEach((activity, index) => {
      // Check if we need a new page
      if (currentY > 250) {
        doc.addPage();
        if (useAmharic) {
          doc.setFont('GeezDigital_V1');
        }
        currentY = 25;
      }
      
      // Activity header with number and title
      const activityHeader = `${activity.activity_number} ${activity.activity_title_amharic}`;
      const wrappedHeader = doc.splitTextToSize(activityHeader, 170);
      doc.text(wrappedHeader, 14, currentY);
      currentY += (wrappedHeader.length * 6) + 8;
      
      // Create narrative format for target information
      doc.setFontSize(10);
      const targetNarrative = `እቅድ ${activity.target_number} ከእቅድ ${activity.target_number} 100%`;
      
      // Add indentation for the target narrative
      doc.text(targetNarrative, 20, currentY);
      currentY += 10;
      
      // Add spacing between activities
      currentY += 5;
    });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`የተዘጋጀበት ቀን፡ ${new Date().toLocaleDateString()}`, 14, 285);
    
    // Add font notice if using English fallback
    if (language === 'am' && !useAmharic) {
      doc.text('ማስታወሻ፡ የአማርኛ ፊደል አይገኝም፣ በእንግሊዝኛ ይታያል', 14, 275);
    }
    
    // Save
    const monthNameForFile = getEthiopianMonthName(plan.plan_month, 'amharic');
    const fileName = `amharic-plan-${monthNameForFile}-${plan.year}.pdf`;
    doc.save(fileName);
    console.log('Amharic Plan PDF exported successfully');
  } catch (error) {
    console.error('Error exporting Amharic Plan PDF:', error);
    alert(`Failed to export Amharic Plan PDF: ${error.message}`);
  }
};

// Export Amharic Plan Reports to PDF with structured format matching the image
export const exportAmharicReportsToPDF = (reports, plan, month, year, language = 'am') => {
  try {
    console.log('Exporting Amharic Reports to PDF:', { reports, plan, month, year, language });
    const doc = new jsPDF();
    
    // Add Geez font support
    const hasGeezFont = addGeezFontSupport(doc);
    const useAmharic = language === 'am' && hasGeezFont;
    
    if (useAmharic) {
      doc.setFont('GeezDigital_V1');
    }
    
    // Main Title - Goal Statement
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const mainGoal = `ዓላማ፡- የማህበራዊ የምክር ወደሊት በማስተዋወቅ የማህበራዊ ያለተሳተፈ አባላት ተግባራዊ በማድረግ`;
    const wrappedGoal = doc.splitTextToSize(mainGoal, 180);
    doc.text(wrappedGoal, 14, 20);
    
    let currentY = 20 + (wrappedGoal.length * 6) + 5;
    
    // Summary line with totals
    const totalTarget = reports.reduce((sum, r) => sum + (Number(r.target_number) || 0), 0);
    const totalAchieved = reports.reduce((sum, r) => sum + (Number(r.actual_achievement) || 0), 0);
    const overallPercentage = totalTarget > 0 ? ((totalAchieved / totalTarget) * 100).toFixed(2) : '0.00';
    
    const summaryLine = `የማህበራዊ ተቋር ወደሊት ተላላፊ አካሎች ${totalTarget.toLocaleString()} ወደ ${totalAchieved.toLocaleString()} ማድረግ፡ (${overallPercentage})`;
    const wrappedSummary = doc.splitTextToSize(summaryLine, 180);
    doc.text(wrappedSummary, 14, currentY);
    currentY += (wrappedSummary.length * 6) + 15;
    
    // Group reports by activity number
    const activityGroups = {};
    reports.forEach(report => {
      const activityKey = report.activity_number || '1.0';
      if (!activityGroups[activityKey]) {
        activityGroups[activityKey] = {
          activity_number: activityKey,
          activity_title_amharic: report.activity_title_amharic || 'የወርሃዊ እቅድ ተግባር',
          target_number: report.target_number || 0,
          target_unit_amharic: report.target_unit_amharic || 'ብር',
          reports: []
        };
      }
      activityGroups[activityKey].reports.push(report);
    });
    
    // Process each activity in narrative format
    Object.values(activityGroups).forEach((activityGroup, index) => {
      // Check if we need a new page
      if (currentY > 220) {
        doc.addPage();
        if (useAmharic) {
          doc.setFont('GeezDigital_V1');
        }
        currentY = 25;
      }
      
      // Activity header with numbering
      doc.setFontSize(11);
      const activityHeader = `${activityGroup.activity_number} ${activityGroup.activity_title_amharic}`;
      const wrappedHeader = doc.splitTextToSize(activityHeader, 170);
      doc.text(wrappedHeader, 14, currentY);
      currentY += (wrappedHeader.length * 6) + 8;
      
      // Create narrative format for each branch
      activityGroup.reports.forEach((report, reportIndex) => {
        if (currentY > 250) {
          doc.addPage();
          if (useAmharic) {
            doc.setFont('GeezDigital_V1');
          }
          currentY = 25;
        }
        
        // Branch narrative format
        doc.setFontSize(10);
        const target = (Number(report.target_number) || 0).toLocaleString();
        const achieved = (Number(report.actual_achievement) || 0).toLocaleString();
        const percentage = (Number(report.achievement_percentage) || 0).toFixed(1);
        
        // Create narrative text like: "እቅድ 1 ከእቅድ 1 100%"
        const narrativeText = `እቅድ ${target} ከእቅድ ${achieved} ${percentage}%`;
        
        // Add indentation for sub-items
        doc.text(narrativeText, 20, currentY);
        currentY += 8;
      });
      
      // Activity summary in narrative format
      const activityTotal = activityGroup.reports.reduce((sum, r) => sum + (Number(r.actual_achievement) || 0), 0);
      const activityTarget = activityGroup.reports.reduce((sum, r) => sum + (Number(r.target_number) || 0), 0);
      const activityPercentage = activityTarget > 0 ? ((activityTotal / activityTarget) * 100).toFixed(1) : '0.0';
      
      // Add spacing before summary
      currentY += 5;
      
      // Summary in narrative format
      doc.setFontSize(10);
      doc.setFont(useAmharic ? 'GeezDigital_V1' : 'helvetica', 'normal');
      
      // Create summary narrative like the image format
      const summaryNarrative = `እቅድ ${activityTarget.toLocaleString()} ከእቅድ ${activityTotal.toLocaleString()} ${activityPercentage}%በላይ`;
      const wrappedSummary = doc.splitTextToSize(summaryNarrative, 170);
      doc.text(wrappedSummary, 20, currentY);
      currentY += (wrappedSummary.length * 6) + 10;
    });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`የተዘጋጀበት ቀን፡ ${new Date().toLocaleDateString()}`, 14, 285);
    
    // Add font notice if using English fallback
    if (language === 'am' && !useAmharic) {
      doc.text('ማስታወሻ፡ የአማርኛ ፊደል አይገኝም፣ በእንግሊዝኛ ይታያል', 14, 275);
    }
    
    // Save
    const monthNameForFile = getEthiopianMonthName(month, useAmharic ? 'amharic' : 'english');
    doc.save(`amharic-report-${monthNameForFile}-${year}.pdf`);
    console.log('Amharic Reports PDF exported successfully');
  } catch (error) {
    console.error('Error exporting Amharic Reports PDF:', error);
    alert(`Failed to export Amharic Reports PDF: ${error.message}`);
  }
};

// ===== ACTION-BASED REPORTING EXPORTS =====

// Export Action Reports to PDF with structured format
export const exportActionReportsToPDF = (actionReports, month, year, language = 'en') => {
  try {
    console.log('Exporting Action Reports to PDF:', { actionReports, month, year, language });
    const doc = new jsPDF();
    
    // Try to add Geez font support
    const hasGeezFont = addGeezFontSupport(doc);
    const useAmharic = language === 'am' && hasGeezFont;
    
    // Title
    doc.setFontSize(18);
    const title = getDisplayText('የተግባር ሪፖርት', 'Action Report', !useAmharic);
    doc.text(title, 14, 20);
  
    // Month and Year
    doc.setFontSize(12);
    const actionMonthName = getEthiopianMonthName(month, useAmharic ? 'amharic' : 'english');
    const monthLabel = getDisplayText('ወር', 'Month', !useAmharic);
    const dateLabel = getDisplayText('ቀን', 'Date', !useAmharic);
    
    doc.text(`${monthLabel}: ${actionMonthName} ${year}`, 14, 30);
    doc.text(`${dateLabel}: ${new Date().toLocaleDateString()}`, 14, 37);
    
    // Group reports by action
    const actionGroups = {};
    actionReports.forEach(report => {
      const actionKey = `${report.action_number}`;
      if (!actionGroups[actionKey]) {
        actionGroups[actionKey] = {
          action_number: report.action_number,
          action_title: report.action_title,
          plan_activity: report.plan_activity,
          reports: []
        };
      }
      actionGroups[actionKey].reports.push(report);
    });
    
    let currentY = 50;
    const pageHeight = doc.internal.pageSize.height;
    
    // Process each action
    Object.values(actionGroups).forEach((actionGroup, actionIndex) => {
      // Check if we need a new page
      if (currentY > pageHeight - 80) {
        doc.addPage();
        currentY = 20;
      }
      
      // Action Header
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      const actionTitle = `${actionGroup.action_number}. ${actionGroup.action_title}`;
      const splitTitle = doc.splitTextToSize(actionTitle, 180);
      doc.text(splitTitle, 14, currentY);
      currentY += splitTitle.length * 6 + 5;
      
      // Action Details
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const targetLabel = getDisplayText('እቅድ', 'Target', !useAmharic);
      doc.text(`${targetLabel}: ${(actionGroup.plan_activity || 0).toLocaleString()}`, 14, currentY);
      currentY += 10;
      
      // Table for this action
      const tableData = actionGroup.reports.map(report => [
        report.branch_name || '',
        (Number(report.plan_activity) || 0).toLocaleString(),
        (Number(report.actual_activity) || 0).toLocaleString(),
        `${(Number(report.implementation_percentage) || 0).toFixed(1)}%`,
        report.status === 'submitted' ? getDisplayText('ገብቷል', 'Submitted', !useAmharic) :
        report.status === 'late' ? getDisplayText('ዘግይቷል', 'Late', !useAmharic) :
        getDisplayText('በመጠባበቅ ላይ', 'Pending', !useAmharic)
      ]);
      
      doc.autoTable({
        startY: currentY,
        head: [[
          getDisplayText('ቅርንጫፍ', 'Branch', !useAmharic),
          getDisplayText('እቅድ', 'Plan', !useAmharic),
          getDisplayText('ተግባር', 'Achievement', !useAmharic),
          getDisplayText('ትግበራ %', 'Implementation %', !useAmharic),
          getDisplayText('ሁኔታ', 'Status', !useAmharic)
        ]],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [124, 58, 237], fontSize: 9 },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 }
      });
      
      currentY = doc.lastAutoTable.finalY + 15;
      
      // Summary for this action
      const totalPlan = actionGroup.reports.reduce((sum, r) => sum + (Number(r.plan_activity) || 0), 0);
      const totalAchieved = actionGroup.reports.reduce((sum, r) => sum + (Number(r.actual_activity) || 0), 0);
      const avgImplementation = actionGroup.reports.length > 0 
        ? actionGroup.reports.reduce((sum, r) => sum + (Number(r.implementation_percentage) || 0), 0) / actionGroup.reports.length 
        : 0;
      
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      const summaryLabel = getDisplayText('ማጠቃለያ', 'Summary', !useAmharic);
      const totalPlanLabel = getDisplayText('ጠቅላላ እቅድ', 'Total Plan', !useAmharic);
      const totalAchievedLabel = getDisplayText('ጠቅላላ ተግባር', 'Total Achievement', !useAmharic);
      const avgLabel = getDisplayText('አማካይ ትግበራ', 'Average Implementation', !useAmharic);
      
      doc.text(`${summaryLabel}: ${totalPlanLabel}: ${totalPlan.toLocaleString()}, ${totalAchievedLabel}: ${totalAchieved.toLocaleString()}, ${avgLabel}: ${avgImplementation.toFixed(1)}%`, 14, currentY);
      currentY += 15;
    });
    
    // Add font notice if using English fallback
    if (language === 'am' && !useAmharic) {
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text('Note: Amharic font not available, displaying in English', 14, currentY + 10);
    }
    
    // Save
    const monthNameForFile = getEthiopianMonthName(month, useAmharic ? 'amharic' : 'english');
    doc.save(`action-report-${monthNameForFile}-${year}.pdf`);
    console.log('Action Reports PDF exported successfully');
  } catch (error) {
    console.error('Error exporting Action Reports PDF:', error);
    alert(`Failed to export Action Reports PDF: ${error.message}`);
  }
};

// Export Amharic Plan to Excel
export const exportAmharicPlanToExcel = (plan, activities, language = 'am') => {
  try {
    console.log('Exporting Amharic Plan to Excel:', { plan, activities, language });
    const monthName = getEthiopianMonthName(plan.plan_month, language === 'am' ? 'amharic' : 'english');
    
    // Plan Information Sheet
    const planData = [
      { 'መስክ': 'የእቅድ ርዕስ', 'ዋጋ': plan.plan_title_amharic || plan.title },
      { 'መስክ': 'ወር', 'ዋጋ': `${monthName} ${plan.year}` },
      { 'መስክ': 'መግለጫ', 'ዋጋ': plan.plan_description_amharic || '' },
      { 'መስክ': 'የተፈጠረበት ቀን', 'ዋጋ': new Date(plan.created_at).toLocaleDateString() }
    ];
    
    const wsPlan = XLSX.utils.json_to_sheet(planData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsPlan, 'የእቅድ መረጃ');
    
    // Activities Sheet
    const activitiesData = activities.map(activity => ({
      'ቁጥር': activity.activity_number,
      'የእንቅስቃሴ ርዕስ': activity.activity_title_amharic,
      'እቅድ ቁጥር': activity.target_number,
      'መለኪያ': activity.target_unit_amharic
    }));
    
    const wsActivities = XLSX.utils.json_to_sheet(activitiesData);
    XLSX.utils.book_append_sheet(wb, wsActivities, 'እንቅስቃሴዎች');
    
    XLSX.writeFile(wb, `amharic-plan-${monthName}-${plan.year}.xlsx`);
    console.log('Amharic Plan Excel exported successfully');
  } catch (error) {
    console.error('Error exporting Amharic Plan Excel:', error);
    alert(`Failed to export Amharic Plan Excel: ${error.message}`);
  }
};

// Export Amharic Reports to Excel in structured format
export const exportAmharicReportsToExcel = (reports, plan, month, year, language = 'am') => {
  try {
    console.log('Exporting Amharic Reports to Excel:', { reports, plan, month, year, language });
    const monthName = getEthiopianMonthName(month, language === 'am' ? 'amharic' : 'english');
    
    // Group reports by activity
    const activityGroups = {};
    reports.forEach(report => {
      const activityKey = report.activity_number || '1.0';
      if (!activityGroups[activityKey]) {
        activityGroups[activityKey] = {
          activity_number: activityKey,
          activity_title_amharic: report.activity_title_amharic || 'የወርሃዊ እቅድ ተግባር',
          target_number: report.target_number || 0,
          target_unit_amharic: report.target_unit_amharic || 'ብር',
          reports: []
        };
      }
      activityGroups[activityKey].reports.push(report);
    });
    
    const wb = XLSX.utils.book_new();
    
    // Main Report Sheet - Structured like the image
    const structuredData = [];
    
    // Add main goal header
    const totalTarget = reports.reduce((sum, r) => sum + (Number(r.target_number) || 0), 0);
    const totalAchieved = reports.reduce((sum, r) => sum + (Number(r.actual_achievement) || 0), 0);
    const overallPercentage = totalTarget > 0 ? ((totalAchieved / totalTarget) * 100).toFixed(2) : '0.00';
    
    structuredData.push({
      'A': `ዓላማ፡- የማህበራዊ የምክር ወደሊት በማስተዋወቅ የማህበራዊ ያለተሳተፈ አባላት ተግባራዊ በማድረግ`,
      'B': '',
      'C': '',
      'D': ''
    });
    
    structuredData.push({
      'A': `የማህበራዊ ተቋር ወደሊት ተላላፊ አካሎች ${totalTarget.toLocaleString()} ወደ ${totalAchieved.toLocaleString()} ማድረግ፡ (${overallPercentage})`,
      'B': '',
      'C': '',
      'D': ''
    });
    
    structuredData.push({}); // Empty row
    
    // Add each activity in narrative format
    Object.values(activityGroups).forEach(activityGroup => {
      // Activity header
      structuredData.push({
        'A': `${activityGroup.activity_number} ${activityGroup.activity_title_amharic}`,
        'B': '',
        'C': '',
        'D': ''
      });
      
      // Branch data in narrative format
      activityGroup.reports.forEach(report => {
        const target = (Number(report.target_number) || 0).toLocaleString();
        const achieved = (Number(report.actual_achievement) || 0).toLocaleString();
        const percentage = (Number(report.achievement_percentage) || 0).toFixed(1);
        
        // Create narrative format: "እቅድ 1 ከእቅድ 1 100%"
        const narrativeText = `እቅድ ${target} ከእቅድ ${achieved} ${percentage}%`;
        
        structuredData.push({
          'A': narrativeText,
          'B': '',
          'C': '',
          'D': ''
        });
      });
      
      // Activity summary in narrative format
      const activityTotal = activityGroup.reports.reduce((sum, r) => sum + (Number(r.actual_achievement) || 0), 0);
      const activityTarget = activityGroup.reports.reduce((sum, r) => sum + (Number(r.target_number) || 0), 0);
      const activityPercentage = activityTarget > 0 ? ((activityTotal / activityTarget) * 100).toFixed(1) : '0.0';
      
      // Summary narrative
      const summaryNarrative = `እቅድ ${activityTarget.toLocaleString()} ከእቅድ ${activityTotal.toLocaleString()} ${activityPercentage}%በላይ`;
      
      structuredData.push({
        'A': summaryNarrative,
        'B': '',
        'C': '',
        'D': ''
      });
      
      structuredData.push({}); // Empty row between activities
    });
    
    const wsStructured = XLSX.utils.json_to_sheet(structuredData);
    
    // Set column widths
    wsStructured['!cols'] = [
      { wch: 50 }, // Column A - wider for activity names
      { wch: 15 }, // Column B - target
      { wch: 15 }, // Column C - achieved
      { wch: 10 }  // Column D - percentage
    ];
    
    XLSX.utils.book_append_sheet(wb, wsStructured, 'የአማርኛ ሪፖርት');
    
    // Summary Sheet
    const summaryData = Object.values(activityGroups).map(activityGroup => {
      const totalAchieved = activityGroup.reports.reduce((sum, r) => sum + (Number(r.actual_achievement) || 0), 0);
      const avgPercentage = activityGroup.reports.length > 0 
        ? activityGroup.reports.reduce((sum, r) => sum + (Number(r.achievement_percentage) || 0), 0) / activityGroup.reports.length 
        : 0;
      
      return {
        'ቁጥር': activityGroup.activity_number,
        'እንቅስቃሴ': activityGroup.activity_title_amharic,
        'እቅድ': activityGroup.target_number,
        'መለኪያ': activityGroup.target_unit_amharic,
        'ጠቅላላ ተሳካ': totalAchieved,
        'አማካይ መቶኛ': `${avgPercentage.toFixed(1)}%`,
        'የሪፖርት ቁጥር': activityGroup.reports.length
      };
    });
    
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'ማጠቃለያ');
    
    XLSX.writeFile(wb, `amharic-report-${monthName}-${year}.xlsx`);
    console.log('Amharic Reports Excel exported successfully');
  } catch (error) {
    console.error('Error exporting Amharic Reports Excel:', error);
    alert(`Failed to export Amharic Reports Excel: ${error.message}`);
  }
};

// Export Action Reports to Excel
export const exportActionReportsToExcel = (actionReports, month, year, language = 'en') => {
  try {
    console.log('Exporting Action Reports to Excel:', { actionReports, month, year, language });
    const actionExcelMonthName = getEthiopianMonthName(month, language === 'am' ? 'amharic' : 'english');
    
    // Group reports by action
    const actionGroups = {};
    actionReports.forEach(report => {
      const actionKey = `${report.action_number}`;
      if (!actionGroups[actionKey]) {
        actionGroups[actionKey] = {
          action_number: report.action_number,
          action_title: report.action_title,
          plan_activity: report.plan_activity,
          reports: []
        };
      }
      actionGroups[actionKey].reports.push(report);
    });
    
    const wb = XLSX.utils.book_new();
    
    // Create detailed reports sheet
    const detailedData = [];
    Object.values(actionGroups).forEach(actionGroup => {
      // Add action header row
      detailedData.push({
        [language === 'am' ? 'ተግባር ቁጥር' : 'Action Number']: actionGroup.action_number,
        [language === 'am' ? 'ተግባር ርዕስ' : 'Action Title']: actionGroup.action_title,
        [language === 'am' ? 'እቅድ' : 'Target']: actionGroup.plan_activity,
        [language === 'am' ? 'ቅርንጫፍ' : 'Branch']: '',
        [language === 'am' ? 'ተግባር' : 'Achievement']: '',
        [language === 'am' ? 'ትግበራ %' : 'Implementation %']: '',
        [language === 'am' ? 'ሁኔታ' : 'Status']: ''
      });
      
      // Add branch reports
      actionGroup.reports.forEach(report => {
        detailedData.push({
          [language === 'am' ? 'ተግባር ቁጥር' : 'Action Number']: '',
          [language === 'am' ? 'ተግባር ርዕስ' : 'Action Title']: '',
          [language === 'am' ? 'እቅድ' : 'Target']: '',
          [language === 'am' ? 'ቅርንጫፍ' : 'Branch']: report.branch_name || '',
          [language === 'am' ? 'ተግባር' : 'Achievement']: Number(report.actual_activity) || 0,
          [language === 'am' ? 'ትግበራ %' : 'Implementation %']: (Number(report.implementation_percentage) || 0).toFixed(1),
          [language === 'am' ? 'ሁኔታ' : 'Status']: 
            report.status === 'submitted' ? (language === 'am' ? 'ገብቷል' : 'Submitted') :
            report.status === 'late' ? (language === 'am' ? 'ዘግይቷል' : 'Late') :
            (language === 'am' ? 'በመጠባበቅ ላይ' : 'Pending')
        });
      });
      
      // Add empty row for separation
      detailedData.push({});
    });
    
    const wsDetailed = XLSX.utils.json_to_sheet(detailedData);
    XLSX.utils.book_append_sheet(wb, wsDetailed, 'Detailed Reports');
    
    // Create summary sheet
    const summaryData = Object.values(actionGroups).map(actionGroup => {
      const totalPlan = actionGroup.reports.reduce((sum, r) => sum + (Number(r.plan_activity) || 0), 0);
      const totalAchieved = actionGroup.reports.reduce((sum, r) => sum + (Number(r.actual_activity) || 0), 0);
      const avgImplementation = actionGroup.reports.length > 0 
        ? actionGroup.reports.reduce((sum, r) => sum + (Number(r.implementation_percentage) || 0), 0) / actionGroup.reports.length 
        : 0;
      
      return {
        [language === 'am' ? 'ተግባር ቁጥር' : 'Action Number']: actionGroup.action_number,
        [language === 'am' ? 'ተግባር ርዕስ' : 'Action Title']: actionGroup.action_title,
        [language === 'am' ? 'ጠቅላላ እቅድ' : 'Total Plan']: totalPlan,
        [language === 'am' ? 'ጠቅላላ ተግባር' : 'Total Achievement']: totalAchieved,
        [language === 'am' ? 'አማካይ ትግበራ %' : 'Average Implementation %']: avgImplementation.toFixed(1),
        [language === 'am' ? 'የሪፖርት ቁጥር' : 'Number of Reports']: actionGroup.reports.length
      };
    });
    
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    
    XLSX.writeFile(wb, `action-report-${actionExcelMonthName}-${year}.xlsx`);
    console.log('Action Reports Excel exported successfully');
  } catch (error) {
    console.error('Error exporting Action Reports Excel:', error);
    alert(`Failed to export Action Reports Excel: ${error.message}`);
  }
};

// Export Amharic Plan to Word
export const exportAmharicPlanToWord = async (plan, activities, language = 'am') => {
  try {
    console.log('Exporting Amharic Plan to Word:', { plan, activities, language });
    const monthName = getEthiopianMonthName(plan.plan_month, language === 'am' ? 'amharic' : 'english');
    
    const children = [
      new Paragraph({
        text: plan.plan_title_amharic || plan.title,
        heading: 'Heading1',
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({
        text: `ወር: ${monthName} ${plan.year}`,
        spacing: { before: 200, after: 200 }
      }),
      new Paragraph({
        text: `የተዘጋጀበት ቀን: ${new Date().toLocaleDateString()}`,
        spacing: { after: 400 }
      })
    ];
    
    if (plan.plan_description_amharic) {
      children.push(new Paragraph({
        text: 'መግለጫ:',
        heading: 'Heading2',
        spacing: { before: 400, after: 200 }
      }));
      children.push(new Paragraph({
        text: plan.plan_description_amharic,
        spacing: { after: 400 }
      }));
    }
    
    children.push(new Paragraph({
      text: 'ተግባራት:',
      heading: 'Heading2',
      spacing: { before: 400, after: 200 }
    }));
    
    // Add activities
    activities.forEach((activity, index) => {
      children.push(new Paragraph({
        text: `${activity.activity_number} ${activity.activity_title_amharic}`,
        spacing: { before: 200, after: 100 }
      }));
      children.push(new Paragraph({
        text: `እቅድ: ${activity.target_number} ${activity.target_unit_amharic}`,
        spacing: { before: 100, after: 200 }
      }));
    });
    
    const doc = new Document({
      sections: [{
        children: children
      }]
    });
    
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `amharic-plan-${monthName}-${plan.year}.docx`);
    console.log('Amharic Plan Word exported successfully');
  } catch (error) {
    console.error('Error exporting Amharic Plan Word:', error);
    alert(`Failed to export Amharic Plan Word: ${error.message}`);
  }
};

// Export Amharic Reports to Word
export const exportAmharicReportsToWord = async (reports, plan, month, year, language = 'am') => {
  try {
    console.log('Exporting Amharic Reports to Word:', { reports, plan, month, year, language });
    const monthName = getEthiopianMonthName(month, language === 'am' ? 'amharic' : 'english');
    
    // Group reports by activity
    const activityGroups = {};
    reports.forEach(report => {
      const activityKey = `${report.activity_number}`;
      if (!activityGroups[activityKey]) {
        activityGroups[activityKey] = {
          activity_number: report.activity_number,
          activity_title_amharic: report.activity_title_amharic,
          target_number: report.target_number,
          target_unit_amharic: report.target_unit_amharic,
          reports: []
        };
      }
      activityGroups[activityKey].reports.push(report);
    });
    
    const children = [
      new Paragraph({
        text: 'የአማርኛ እቅድ ሪፖርት',
        heading: 'Heading1',
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({
        text: `እቅድ: ${plan?.plan_title_amharic || plan?.title || 'N/A'}`,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: `ወር: ${monthName} ${year}`,
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: `ቀን: ${new Date().toLocaleDateString()}`,
        spacing: { after: 400 }
      })
    ];
    
    // Add each activity as a section
    Object.values(activityGroups).forEach((activityGroup, index) => {
      // Activity title
      children.push(new Paragraph({
        text: `${activityGroup.activity_number} ${activityGroup.activity_title_amharic}`,
        heading: 'Heading2',
        spacing: { before: 400, after: 200 }
      }));
      
      // Target information
      children.push(new Paragraph({
        text: `እቅድ: ${activityGroup.target_number} ${activityGroup.target_unit_amharic}`,
        spacing: { after: 200 }
      }));
      
      // Add narrative format for each branch
      activityGroup.reports.forEach(report => {
        const target = (Number(report.target_number) || 0).toLocaleString();
        const achieved = (Number(report.actual_achievement) || 0).toLocaleString();
        const percentage = (Number(report.achievement_percentage) || 0).toFixed(1);
        
        // Create narrative text
        const narrativeText = `እቅድ ${target} ከእቅድ ${achieved} ${percentage}%`;
        
        children.push(new Paragraph({
          text: narrativeText,
          spacing: { before: 100, after: 100 }
        }));
      });
      
      // Summary for this activity
      const totalAchieved = activityGroup.reports.reduce((sum, r) => sum + (Number(r.actual_achievement) || 0), 0);
      const avgPercentage = activityGroup.reports.length > 0 
        ? activityGroup.reports.reduce((sum, r) => sum + (Number(r.achievement_percentage) || 0), 0) / activityGroup.reports.length 
        : 0;
      
      children.push(new Paragraph({
        text: `ማጠቃለያ: ጠቅላላ ተሳካ: ${totalAchieved.toLocaleString()}, አማካይ መቶኛ: ${avgPercentage.toFixed(1)}%`,
        spacing: { before: 200, after: 400 }
      }));
    });
    
    const doc = new Document({
      sections: [{
        children: children
      }]
    });
    
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `amharic-report-${monthName}-${year}.docx`);
    console.log('Amharic Reports Word exported successfully');
  } catch (error) {
    console.error('Error exporting Amharic Reports Word:', error);
    alert(`Failed to export Amharic Reports Word: ${error.message}`);
  }
};

// Export Action Reports to Word
export const exportActionReportsToWord = async (actionReports, month, year, language = 'en') => {
  try {
    console.log('Exporting Action Reports to Word:', { actionReports, month, year, language });
    const actionWordMonthName = getEthiopianMonthName(month, language === 'am' ? 'amharic' : 'english');
    
    // Group reports by action
    const actionGroups = {};
    actionReports.forEach(report => {
      const actionKey = `${report.action_number}`;
      if (!actionGroups[actionKey]) {
        actionGroups[actionKey] = {
          action_number: report.action_number,
          action_title: report.action_title,
          plan_activity: report.plan_activity,
          reports: []
        };
      }
      actionGroups[actionKey].reports.push(report);
    });
    
    const children = [
      new Paragraph({
        text: language === 'am' ? 'የተግባር ሪፖርት' : 'Action Report',
        heading: 'Heading1',
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({
        text: `${language === 'am' ? 'ወር' : 'Month'}: ${actionWordMonthName} ${year}`,
        spacing: { before: 200, after: 200 }
      }),
      new Paragraph({
        text: `${language === 'am' ? 'ቀን' : 'Date'}: ${new Date().toLocaleDateString()}`,
        spacing: { after: 400 }
      })
    ];
    
    // Add each action as a section
    Object.values(actionGroups).forEach((actionGroup, index) => {
      // Action title
      children.push(new Paragraph({
        text: `${actionGroup.action_number}. ${actionGroup.action_title}`,
        heading: 'Heading2',
        spacing: { before: 400, after: 200 }
      }));
      
      // Action details
      children.push(new Paragraph({
        text: `${language === 'am' ? 'እቅድ' : 'Target'}: ${(actionGroup.plan_activity || 0).toLocaleString()}`,
        spacing: { after: 200 }
      }));
      
      // Table for this action
      const tableRows = [
        // Header row
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: language === 'am' ? 'ቅርንጫፍ' : 'Branch', bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: language === 'am' ? 'እቅድ' : 'Plan', bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: language === 'am' ? 'ተግባር' : 'Achievement', bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: language === 'am' ? 'ትግበራ %' : 'Implementation %', bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: language === 'am' ? 'ሁኔታ' : 'Status', bold: true })] })
          ]
        }),
        // Data rows
        ...actionGroup.reports.map(report => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(report.branch_name || '')] }),
            new TableCell({ children: [new Paragraph((Number(report.plan_activity) || 0).toLocaleString())] }),
            new TableCell({ children: [new Paragraph((Number(report.actual_activity) || 0).toLocaleString())] }),
            new TableCell({ children: [new Paragraph(`${(Number(report.implementation_percentage) || 0).toFixed(1)}%`)] }),
            new TableCell({ children: [new Paragraph(
              report.status === 'submitted' ? (language === 'am' ? 'ገብቷል' : 'Submitted') :
              report.status === 'late' ? (language === 'am' ? 'ዘግይቷል' : 'Late') :
              (language === 'am' ? 'በመጠባበቅ ላይ' : 'Pending')
            )] })
          ]
        }))
      ];
      
      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows
      }));
      
      // Summary for this action
      const totalPlan = actionGroup.reports.reduce((sum, r) => sum + (Number(r.plan_activity) || 0), 0);
      const totalAchieved = actionGroup.reports.reduce((sum, r) => sum + (Number(r.actual_activity) || 0), 0);
      const avgImplementation = actionGroup.reports.length > 0 
        ? actionGroup.reports.reduce((sum, r) => sum + (Number(r.implementation_percentage) || 0), 0) / actionGroup.reports.length 
        : 0;
      
      children.push(new Paragraph({
        text: `${language === 'am' ? 'ማጠቃለያ' : 'Summary'}: ${language === 'am' ? 'ጠቅላላ እቅድ' : 'Total Plan'}: ${totalPlan.toLocaleString()}, ${language === 'am' ? 'ጠቅላላ ተግባር' : 'Total Achievement'}: ${totalAchieved.toLocaleString()}, ${language === 'am' ? 'አማካይ ትግበራ' : 'Average Implementation'}: ${avgImplementation.toFixed(1)}%`,
        spacing: { before: 200, after: 400 }
      }));
    });
    
    const doc = new Document({
      sections: [{
        children: children
      }]
    });
    
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `action-report-${actionWordMonthName}-${year}.docx`);
    console.log('Action Reports Word exported successfully');
  } catch (error) {
    console.error('Error exporting Action Reports Word:', error);
    alert(`Failed to export Action Reports Word: ${error.message}`);
  }
};
