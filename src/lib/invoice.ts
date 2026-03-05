import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CommissionData } from './commissions';

export interface InvoiceCommissionData extends CommissionData {
    extras_list?: string[];
}

export const generateInvoice = (commission: InvoiceCommissionData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- Header & Branding ---
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0); // Black
    doc.text('ATHARVA SHERLEKAR ART', 20, 25);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Custom Portrait Commission Invoice', 20, 32);

    // --- Invoice Meta ---
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice ID: ${commission.id}`, pageWidth - 20, 25, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - 20, 30, { align: 'right' });

    // --- Bill To Section ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 20, 50);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const clientLines = [
        commission.client_name,
        commission.client_email,
        commission.phone,
        commission.address
    ].filter(Boolean);

    let currentY = 56;
    clientLines.forEach(line => {
        doc.text(line, 20, currentY);
        currentY += 5;
    });

    // --- ARTWORK SUBTOTAL SECTION ---
    currentY += 10;
    const rightAlignX = pageWidth - 20;

    // Heading
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(150, 150, 150);
    doc.text('ARTWORK SUBTOTAL', 20, currentY);
    currentY += 10;

    // Base Artwork
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const currency = 'Rs. ';

    doc.text(`Base (${commission.size}, ${commission.number_of_people} person${Number(commission.number_of_people) > 1 ? 's' : ''})`, 20, currentY);
    doc.text(`${currency}${commission.base_price || 0}`, rightAlignX, currentY, { align: 'right' });
    currentY += 8;

    // Extras
    if (commission.extras_list && commission.extras_list.length > 0) {
        commission.extras_list.forEach(extra => {
            doc.text(`+ ${extra}`, 20, currentY);
            currentY += 8;
        });
        if (commission.extras_total && commission.extras_total > 0) {
            currentY -= 8;
            doc.text(`${currency}${commission.extras_total}`, rightAlignX, currentY, { align: 'right' });
            currentY += 8;
        }
    } else if (commission.extras_total && commission.extras_total > 0) {
        doc.text(`+ Custom Add-ons`, 20, currentY);
        doc.text(`${currency}${commission.extras_total}`, rightAlignX, currentY, { align: 'right' });
        currentY += 8;
    }

    currentY += 2;
    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.line(20, currentY, rightAlignX, currentY);
    currentY += 8;

    // Subtotal Line
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal', 20, currentY);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    const subtotal = Number(commission.base_price || 0) + Number(commission.extras_total || 0);
    doc.text(`${currency}${subtotal}`, rightAlignX, currentY, { align: 'right' });

    currentY += 8;
    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.line(20, currentY, rightAlignX, currentY);
    currentY += 10;

    let derivedPaymentStatus = commission.payment_status;
    if (['finished', 'on_delivery', 'completed'].includes(commission.status) && (!derivedPaymentStatus || derivedPaymentStatus === 'pending')) {
        derivedPaymentStatus = 'fully_paid';
    }

    if (derivedPaymentStatus === 'fully_paid') {
        const shipping = Number(commission.shipping_cost || 0);
        const total = subtotal + shipping;

        // Shipping
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Shipping', 20, currentY);
        doc.text(`${currency}${shipping}`, rightAlignX, currentY, { align: 'right' });
        currentY += 8;

        // Divider
        doc.setDrawColor(220, 220, 220);
        doc.line(20, currentY, rightAlignX, currentY);
        currentY += 10;

        // Total
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('TOTAL', 20, currentY);
        doc.text(`${currency}${total}`, rightAlignX, currentY, { align: 'right' });
        currentY += 10;

        // Amount Paid
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Amount Paid', 20, currentY);
        doc.text(`-${currency}${total}`, rightAlignX, currentY, { align: 'right' });
        currentY += 8;

        // Balance Due
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Balance Due', 20, currentY);
        doc.text(`${currency}0`, rightAlignX, currentY, { align: 'right' });
        currentY += 10;

    } else {
        const reservationAmount = Math.ceil(subtotal * 0.25);
        const upfrontAmount = Math.ceil(subtotal * 0.25);
        const finalBalanceAmount = subtotal - reservationAmount - upfrontAmount;

        if (derivedPaymentStatus === 'reservation_paid') {
            // 25% Reservation Paid
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Reservation Fee (25%) Paid', 20, currentY);
            doc.text(`-${currency}${reservationAmount}`, rightAlignX, currentY, { align: 'right' });
            currentY += 8;

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Remaining Deposit Due to Start (25%)', 20, currentY);
            doc.text(`${currency}${upfrontAmount}`, rightAlignX, currentY, { align: 'right' });
            currentY += 8;

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Final Balance Due (50%)', 20, currentY);
            let balanceString = `${currency}${finalBalanceAmount}`;
            if (!commission.shipping_cost || commission.shipping_cost === 0) {
                balanceString += ' + Shipping';
            } else {
                balanceString = `${currency}${finalBalanceAmount + Number(commission.shipping_cost)} (incl. shipping)`;
            }
            doc.text(balanceString, rightAlignX, currentY, { align: 'right' });
            currentY += 10;

        } else if (derivedPaymentStatus === 'deposit_paid') {
            // 50% Total Paid
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);

            if (commission.status === 'waitlist' || (commission.payment_status === 'deposit_paid' && commission.razorpay_payment_id)) {
                doc.text('Reservation Fee (25%) Paid', 20, currentY);
                doc.text(`-${currency}${reservationAmount}`, rightAlignX, currentY, { align: 'right' });
                currentY += 8;
                doc.text('Artwork Start Deposit (25%) Paid', 20, currentY);
                doc.text(`-${currency}${upfrontAmount}`, rightAlignX, currentY, { align: 'right' });
                currentY += 8;
            } else {
                doc.text('Booking Deposit (50%) Paid', 20, currentY);
                doc.text(`-${currency}${reservationAmount + upfrontAmount}`, rightAlignX, currentY, { align: 'right' });
                currentY += 8;
            }

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Final Balance Due (50%)', 20, currentY);

            let balanceString = `${currency}${finalBalanceAmount}`;
            if (!commission.shipping_cost || commission.shipping_cost === 0) {
                balanceString += ' + Shipping';
            } else {
                const finalBalanceFull = finalBalanceAmount + Number(commission.shipping_cost);
                balanceString = `${currency}${finalBalanceFull} (incl. shipping)`;
            }
            doc.text(balanceString, rightAlignX, currentY, { align: 'right' });
            currentY += 10;

        } else {
            // Pending Deposit (50%) for immediate slots
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Booking Deposit (50%) Due', 20, currentY);

            const deposit = Math.ceil(subtotal / 2);
            doc.text(`${currency}${deposit}`, rightAlignX, currentY, { align: 'right' });
            currentY += 8;

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Final Balance Due (50%)', 20, currentY);

            let balanceString = `${currency}${subtotal - deposit}`;
            if (!commission.shipping_cost || commission.shipping_cost === 0) {
                balanceString += ' + Shipping';
            } else {
                const finalBalance = (subtotal - deposit) + Number(commission.shipping_cost);
                balanceString = `${currency}${finalBalance} (incl. shipping)`;
            }
            doc.text(balanceString, rightAlignX, currentY, { align: 'right' });
            currentY += 10;
        }

        // Shipping Note
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 150, 150);
        doc.text('Shipping costs will be calculated and added to the final balance once the portrait is ready for delivery.', 20, currentY);
    }

    // --- Payment Status ---
    let lineY = currentY + 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    let paymentStatusText = 'Status: Pending';
    if (derivedPaymentStatus === 'fully_paid') paymentStatusText = 'Status: Fully Paid';
    else if (derivedPaymentStatus === 'deposit_paid') paymentStatusText = 'Status: Deposit Paid (50%)';
    else if (derivedPaymentStatus === 'reservation_paid') paymentStatusText = 'Status: Reservation Fee Paid';

    doc.text(paymentStatusText, 20, lineY + 10);

    if (commission.payment_completed_at) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Last Payment Date: ${new Date(commission.payment_completed_at).toLocaleDateString('en-GB')}`, 20, lineY + 16);
    }

    // --- Footer ---
    let footerY = doc.internal.pageSize.getHeight() - 40;
    if (['finished', 'on_delivery', 'completed'].includes(commission.status)) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('THANK YOU SO MUCH FOR YOUR COMMISSION!', pageWidth / 2, footerY - 20, { align: 'center' });
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    const footerText = 'If you have any questions about this invoice or your artwork, please reach out via Instagram or Email.';
    doc.text(footerText, pageWidth / 2, footerY - 5, { align: 'center' });

    const iconY = footerY + 5;
    const centerX = pageWidth / 2;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);

    const igText = 'IG: @atharva_sherlekar_art';
    doc.textWithLink(igText, centerX - 30, iconY, { url: 'https://www.instagram.com/atharva_sherlekar_art?igsh=cXNkNnpybmQ5dnFm', align: 'center' });

    const emailText = 'Email: atharvasherlekarart@gmail.com';
    doc.textWithLink(emailText, centerX + 30, iconY, { url: 'mailto:atharvasherlekarart@gmail.com', align: 'center' });

    doc.save(`Invoice_${commission.id}.pdf`);
};
