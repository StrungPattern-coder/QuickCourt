import jsPDF from 'jspdf';
import { formatLocalDateInput, parseLocalDate, formatBookingDate, formatBookingTimeRange, extractBookingTimeStr } from './datetime';

export interface InvoiceBookingData {
  id: string;
  receiptId?: string;
  facilityName: string;
  courtName: string;
  location: string;
  sport: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  userName?: string;
  userEmail?: string;
  createdAt?: string;
}

export function generateInvoicePDF(booking: InvoiceBookingData): void {
  const price = Number(booking.price) || 0;
  
  // Parse slot duration safely
  const cleanStartTime = extractBookingTimeStr(booking.startTime);
  const cleanEndTime = extractBookingTimeStr(booking.endTime);

  const durationHours = (() => {
    try {
      const [sh, sm] = cleanStartTime.split(':').map(n => Number(n) || 0);
      const [eh, em] = cleanEndTime.split(':').map(n => Number(n) || 0);
      const diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
      return Math.max(0.5, diffMinutes / 60);
    } catch {
      return 1;
    }
  })();

  const hourlyRate = Math.round(price / durationHours);

  // Date formatting
  const formattedBookingDate = formatBookingDate(booking.date, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTimeSlot = formatBookingTimeRange(booking.startTime, booking.endTime);

  const invoiceNo = booking.receiptId 
    ? booking.receiptId.replace(/[^A-Za-z0-9-]/g, '').slice(0, 24)
    : `INV-QC-${booking.id.slice(-8).toUpperCase()}`;

  const bookingCode = booking.id.slice(-8).toUpperCase();
  const issuedDate = booking.createdAt 
    ? new Date(booking.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const formatMoney = (amount: number) => `₹${new Intl.NumberFormat('en-IN').format(amount)}`;

  // Create jsPDF Document
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  // Page dimensions: 595.28 x 841.89 pt
  // Header Banner - Slate Navy Background (#0F172A)
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 595, 130, 'F');

  // Emerald Top Accent Bar (#10B981)
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 595, 6, 'F');

  // Brand Badge
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(36, 30, 44, 44, 10, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('QC', 48, 57);

  // Brand Name & Subtitle
  doc.setFontSize(22);
  doc.text('QuickCourt', 92, 48);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('Official Booking Invoice & Reservation Receipt', 92, 65);

  // Header Title - Right Side
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE', 559, 44, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Invoice No: ${invoiceNo}`, 559, 62, { align: 'right' });
  doc.text(`Issued: ${issuedDate}`, 559, 76, { align: 'right' });
  doc.text(`Booking Ref: ${bookingCode}`, 559, 90, { align: 'right' });

  // Status Badge - PAID
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(485, 100, 74, 18, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('PAID & CONFIRMED', 522, 112, { align: 'center' });

  // Section 1: Billing Grid Cards
  let y = 152;

  // Billed From Card
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.roundedRect(36, y, 252, 110, 8, 8, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(36, y, 252, 110, 8, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('PLATFORM & SERVICE PROVIDER', 48, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('QuickCourt Technologies Pvt Ltd', 48, y + 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Registered Office: NO OFFICE', 48, y + 54);
  doc.text('<city_name>, <state_name> <pin_code>', 48, y + 68);
  doc.text('Email: <email>', 48, y + 82);
  doc.text('GSTIN: <gstin>', 48, y + 96);

  // Billed To / Venue Details Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(307, y, 252, 110, 8, 8, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(307, y, 252, 110, 8, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('RESERVATION & CUSTOMER DETAILS', 319, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(booking.userName || 'Valued Player', 319, y + 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Email: ${booking.userEmail || 'Customer'}`, 319, y + 54);
  doc.text(`Venue: ${booking.facilityName}`, 319, y + 68);
  doc.text(`Court: ${booking.courtName} (${booking.sport})`, 319, y + 82);
  doc.text(`Location: ${booking.location}`, 319, y + 96, { maxWidth: 230 });

  // Section 2: Reservation Summary Banner
  y += 128;
  doc.setFillColor(236, 253, 245); // Emerald 50
  doc.roundedRect(36, y, 523, 44, 8, 8, 'F');
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(36, y, 523, 44, 8, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(6, 95, 70);
  doc.text('SCHEDULED SLOT:', 48, y + 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${formattedBookingDate}  |  ${formattedTimeSlot} (${durationHours} hrs)`, 160, y + 26);

  // Section 3: Itemized Financial Table
  y += 62;
  // Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(36, y, 523, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('DESCRIPTION', 48, y + 18);
  doc.text('SPORT', 270, y + 18);
  doc.text('RATE / HR', 360, y + 18, { align: 'right' });
  doc.text('QTY (HRS)', 440, y + 18, { align: 'right' });
  doc.text('AMOUNT', 547, y + 18, { align: 'right' });

  // Table Row
  y += 28;
  doc.setFillColor(255, 255, 255);
  doc.rect(36, y, 523, 48, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(36, y + 48, 559, y + 48);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`${booking.facilityName} - ${booking.courtName}`, 48, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Slot: ${formattedTimeSlot} on ${booking.date}`, 48, y + 36);

  doc.setTextColor(30, 41, 59);
  doc.text(booking.sport, 270, y + 26);
  doc.text(formatMoney(hourlyRate), 360, y + 26, { align: 'right' });
  doc.text(`${durationHours}`, 440, y + 26, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(formatMoney(price), 547, y + 26, { align: 'right' });

  // Summary Totals Right Align Block
  y += 60;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);

  doc.text('Subtotal:', 420, y);
  doc.text(formatMoney(price), 547, y, { align: 'right' });

  y += 18;
  doc.text('Taxes & GST (0% Inclusive):', 420, y);
  doc.text('₹0', 547, y, { align: 'right' });

  y += 18;
  doc.text('Platform Convenience Fee:', 420, y);
  doc.text('FREE', 547, y, { align: 'right' });

  y += 12;
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1.5);
  doc.line(380, y, 559, y);

  y += 20;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(380, y - 14, 179, 32, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL PAID:', 392, y + 6);
  doc.setFontSize(13);
  doc.setTextColor(16, 185, 129); // Emerald 500
  doc.text(formatMoney(price), 547, y + 6, { align: 'right' });

  // Section 4: Security QR & Terms Footer Block
  y += 70;

  // QR Code Graphic Mockup
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(36, y, 70, 70, 6, 6, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(36, y, 70, 70, 6, 6, 'S');

  // Draw simulated QR grid pattern
  doc.setFillColor(15, 23, 42);
  doc.rect(44, y + 8, 18, 18, 'F');
  doc.rect(80, y + 8, 18, 18, 'F');
  doc.rect(44, y + 44, 18, 18, 'F');
  doc.rect(68, y + 32, 10, 10, 'F');
  doc.rect(80, y + 48, 12, 12, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('VENUE ENTRY & CHECK-IN RULES', 120, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('• Please present this official Tax Invoice or Booking ID at the venue entrance upon arrival.', 120, y + 32);
  doc.text('• Arrive at least 10 minutes before your booked time slot.', 120, y + 44);
  doc.text('• Proper non-marking sports footwear is mandatory for indoor court entry.', 120, y + 56);
  doc.text('• Cancellations are subject to QuickCourt & venue specific cancellation policies.', 120, y + 68);

  // Bottom Line & Computer Generated Disclaimer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(36, 800, 559, 800);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer-generated tax invoice and requires no physical signature.', 36, 814);
  doc.text('QuickCourt • <website_link> • <support_email>', 559, 814, { align: 'right' });

  // Save the PDF
  const filename = `QuickCourt_Invoice_${bookingCode}_${formatLocalDateInput()}.pdf`;
  doc.save(filename);
}
