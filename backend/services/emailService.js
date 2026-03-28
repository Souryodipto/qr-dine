const nodemailer = require('nodemailer');

// Create transporter based on environment
const createTransporter = () => {
  // Use Gmail if credentials are provided
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS
      }
    });
  }
  
  // Legacy support for SendGrid if GMAIL is not set
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your_sendgrid_key') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }
  
  // Dev mode fallback
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Dev mode: log emails to console
  return null;
};

// Format currency
const formatCurrency = (amount, currency = 'INR') => {
  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  return `${symbols[currency] || currency} ${Number(amount || 0).toFixed(2)}`;
};

// ─── Template 1: Order Confirmation (sent immediately after order is placed) ──
const generateConfirmationHTML = (order, restaurant) => {
  const brand = restaurant.brandColor || '#111111';
  const currency = restaurant.currency || 'INR';
  const itemRows = (order.items || []).map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333">${item.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;color:#555">${item.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;font-weight:600;color:#333">${formatCurrency(item.unitPrice * item.quantity, currency)}</td>
    </tr>
  `).join('');

  const tableInfo = order.tableNumber
    ? `Table ${order.tableNumber}`
    : (order.orderType || 'Takeaway');

  const orderId = order.orderIdString || order.orderNumber || (order._id ? order._id.toString().slice(-6).toUpperCase() : 'N/A');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:32px auto;padding:0 16px">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

      <div style="background:${brand};padding:32px 28px;text-align:center">
        ${restaurant.logo ? `<img src="${restaurant.logo}" alt="${restaurant.name}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.3);margin-bottom:14px">` : ''}
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px">${restaurant.name}</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;font-weight:500">Order Confirmed ✓</p>
      </div>

      <div style="padding:28px">
        <p style="margin:0 0 20px;font-size:16px;color:#222;line-height:1.5">
          Hi <strong>${order.customerName}</strong> 👋<br>
          Great news — we've received your order and it's being prepared right now!
        </p>

        <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:16px;margin-bottom:20px">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <tr><td style="padding:5px 0;color:#888;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.5px">Restaurant</td><td style="padding:5px 0;text-align:right;color:#222;font-weight:600">${restaurant.name}</td></tr>
            <tr><td style="padding:5px 0;color:#888;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.5px">Order Type</td><td style="padding:5px 0;text-align:right;color:#222;font-weight:600">${tableInfo}</td></tr>
            <tr><td style="padding:5px 0;color:#888;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.5px">Order ID</td><td style="padding:5px 0;text-align:right;color:#222;font-weight:600">#${orderId}</td></tr>
            <tr><td style="padding:5px 0;color:#888;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.5px">Placed At</td><td style="padding:5px 0;text-align:right;color:#222;font-weight:600">${new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td></tr>
          </table>
        </div>

        <h3 style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#888">Your Order</h3>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="font-size:11px;color:#aaa;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">
              <th style="text-align:left;padding:0 0 8px">Item</th>
              <th style="text-align:center;padding:0 0 8px">Qty</th>
              <th style="text-align:right;padding:0 0 8px">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div style="margin-top:16px;padding-top:14px;border-top:2px solid #111;display:flex;justify-content:space-between">
          <span style="font-size:15px;font-weight:800;color:#111">Total to Pay</span>
          <span style="font-size:18px;font-weight:900;color:#111">${formatCurrency(order.totalAmount, currency)}</span>
        </div>

        <div style="margin-top:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;text-align:center">
          <p style="margin:0;font-size:13px;color:#92400e;font-weight:600">💵 Pay at the counter when your order is ready</p>
        </div>

        ${order.specialInstructions ? `
        <div style="margin-top:16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px">
          <p style="margin:0 0 4px;font-size:11px;color:#0369a1;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Special Instructions</p>
          <p style="margin:0;font-size:13px;color:#0c4a6e">${order.specialInstructions}</p>
        </div>` : ''}

        ${restaurant.estimatedPrepTime ? `
        <div style="margin-top:16px;text-align:center">
          <p style="margin:0;font-size:13px;color:#666">⏱ Estimated ready in <strong>${restaurant.estimatedPrepTime}</strong></p>
        </div>` : ''}
      </div>

      ${restaurant.customMessage ? `
      <div style="padding:20px 28px;border-top:1px solid #f0f0f0;text-align:center">
        <p style="margin:0;font-size:13px;color:#888;font-style:italic">"${restaurant.customMessage}"</p>
        <p style="margin:6px 0 0;font-size:12px;color:#bbb">— ${restaurant.name}</p>
      </div>` : ''}

      <div style="background:#fafafa;padding:16px 28px;text-align:center;border-top:1px solid #f0f0f0">
        <p style="margin:0;font-size:11px;color:#ccc">Powered by ${process.env.PLATFORM_NAME || 'QR Dine'}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

// ─── Template 2: E-Bill (sent when order status = 'completed') ───────────────
const generateEBillHTML = (order, restaurant) => {
  const currency = restaurant.currency || 'INR';
  const itemRows = (order.items || []).map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333">${item.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;color:#555">${item.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-size:13px;color:#555">${formatCurrency(item.unitPrice, currency)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;font-weight:700;color:#111">${formatCurrency(item.unitPrice * item.quantity, currency)}</td>
    </tr>
  `).join('');

  const tableInfo = order.tableNumber
    ? `Table ${order.tableNumber}`
    : (order.orderType || 'Takeaway');

  const orderId = order.orderIdString || order.orderNumber || (order._id ? order._id.toString().slice(-6).toUpperCase() : 'N/A');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:32px auto;padding:0 16px">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

      <div style="background:#111;padding:32px 28px;text-align:center">
        ${restaurant.logo ? `<img src="${restaurant.logo}" alt="${restaurant.name}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,0.15);margin-bottom:14px">` : ''}
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px">${restaurant.name}</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.5);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Digital Bill / E-Receipt</p>
      </div>

      <div style="background:#ecfdf5;padding:18px 28px;text-align:center;border-bottom:1px solid #d1fae5">
        <p style="margin:0;font-size:16px;color:#065f46;font-weight:700">✅ Order Completed — Thank You!</p>
        <p style="margin:4px 0 0;font-size:13px;color:#059669">We hope you enjoyed your meal, ${order.customerName}!</p>
      </div>

      <div style="padding:28px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <div>
            <p style="margin:0;font-size:11px;color:#aaa;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Bill No.</p>
            <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#111">#${orderId}</p>
          </div>
          <div style="text-align:right">
            <p style="margin:0;font-size:11px;color:#aaa;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Completed</p>
            <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#333">${completedAt}</p>
          </div>
        </div>

        <div style="background:#fafafa;border:1px solid #eee;border-radius:10px;padding:14px;margin-bottom:20px">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <tr><td style="padding:4px 0;color:#888;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.4px">Restaurant</td><td style="padding:4px 0;text-align:right;color:#333;font-weight:600">${restaurant.name}</td></tr>
            <tr><td style="padding:4px 0;color:#888;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.4px">Order Type</td><td style="padding:4px 0;text-align:right;color:#333;font-weight:600">${tableInfo}</td></tr>
            <tr><td style="padding:4px 0;color:#888;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.4px">Customer</td><td style="padding:4px 0;text-align:right;color:#333;font-weight:600">${order.customerName}</td></tr>
            ${order.customerPhone ? `<tr><td style="padding:4px 0;color:#888;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.4px">Phone</td><td style="padding:4px 0;text-align:right;color:#333;font-weight:600">${order.customerPhone}</td></tr>` : ''}
          </table>
        </div>

        <h3 style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#888">Itemized Bill</h3>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="font-size:11px;color:#aaa;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">
              <th style="text-align:left;padding:0 0 8px">Item</th>
              <th style="text-align:center;padding:0 0 8px">Qty</th>
              <th style="text-align:right;padding:0 0 8px">Rate</th>
              <th style="text-align:right;padding:0 0 8px">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div style="margin-top:12px;padding-top:12px;border-top:1px dashed #ddd">
          <table style="width:100%;font-size:13px;color:#555">
            <tr><td>Subtotal</td><td style="text-align:right">${formatCurrency(order.subtotal || order.totalAmount, currency)}</td></tr>
            ${(order.taxAmount > 0) ? `<tr><td style="padding:4px 0">Taxes &amp; Charges</td><td style="text-align:right;padding:4px 0">${formatCurrency(order.taxAmount, currency)}</td></tr>` : ''}
          </table>
          <div style="margin-top:10px;padding-top:10px;border-top:2px solid #111;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:15px;font-weight:800;color:#111">Grand Total</span>
            <span style="font-size:20px;font-weight:900;color:#111">${formatCurrency(order.totalAmount, currency)}</span>
          </div>
        </div>

        <div style="margin-top:16px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:12px;text-align:center">
          <p style="margin:0;font-size:13px;color:#065f46;font-weight:700">✅ Payment Collected at Counter</p>
        </div>
      </div>

      ${restaurant.customMessage ? `
      <div style="padding:20px 28px;border-top:1px solid #f0f0f0;text-align:center">
        <p style="margin:0;font-size:13px;color:#888;font-style:italic">"${restaurant.customMessage}"</p>
        <p style="margin:6px 0 0;font-size:12px;color:#bbb">— ${restaurant.name} Team</p>
      </div>` : ''}

      <div style="background:#fafafa;padding:16px 28px;text-align:center;border-top:1px solid #f0f0f0">
        <p style="margin:0 0 4px;font-size:12px;color:#888">Thank you for dining with us! We look forward to seeing you again. 🍽️</p>
        <p style="margin:0;font-size:11px;color:#ccc">Powered by ${process.env.PLATFORM_NAME || 'QR Dine'}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

// ─── Shared send helper with retry ───────────────────────────────────────────
const sendMail = async (mailOptions, label, maxRetries = 3) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`📧 [DEV] ${label}`);
    console.log('   To:', mailOptions.to);
    console.log('   Subject:', mailOptions.subject);
    return { success: true, dev: true };
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 ${label} → ${mailOptions.to}`);
      return { success: true };
    } catch (error) {
      console.error(`📧 Email attempt ${attempt}/${maxRetries} failed:`, error.message);
      if (attempt === maxRetries) return { success: false, error: error.message };
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }
  }
};

// ─── 1. Order Confirmation — call right after order is placed ─────────────────
const sendOrderConfirmationEmail = async (order, restaurant) => {
  if (!order.customerEmail) return { success: false, reason: 'no_email' };
  const orderId = order.orderNumber || (order._id ? order._id.toString().slice(-6).toUpperCase() : 'N/A');
  return sendMail({
    from: `"${restaurant.name}" <${process.env.GMAIL_USER || process.env.EMAIL_USER || 'noreply@qrdine.com'}>`,
    replyTo: restaurant.email || undefined,
    to: order.customerEmail,
    subject: `✅ Order Confirmed — ${restaurant.name} (#${orderId})`,
    html: generateConfirmationHTML(order, restaurant),
  }, `Order confirmation #${orderId}`);
};

// ─── 2. E-Bill — call when order status becomes 'completed' ──────────────────
const sendEBillEmail = async (order, restaurant) => {
  if (!order.customerEmail) return { success: false, reason: 'no_email' };
  const orderId = order.orderNumber || (order._id ? order._id.toString().slice(-6).toUpperCase() : 'N/A');
  return sendMail({
    from: `"${restaurant.name}" <${process.env.GMAIL_USER || process.env.EMAIL_USER || 'noreply@qrdine.com'}>`,
    replyTo: restaurant.email || undefined,
    to: order.customerEmail,
    subject: `🧾 Your E-Bill — ${restaurant.name} (#${orderId})`,
    html: generateEBillHTML(order, restaurant),
  }, `E-Bill #${orderId}`);
};

// ─── Legacy alias ─────────────────────────────────────────────────────────────
const sendReceiptEmail = sendOrderConfirmationEmail;

module.exports = { sendReceiptEmail, sendOrderConfirmationEmail, sendEBillEmail, formatCurrency };
