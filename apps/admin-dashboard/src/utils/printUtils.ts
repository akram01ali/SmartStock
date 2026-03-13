/**
 * Print utility functions for generating professional print output
 */

export interface PrintOptions {
  title: string;
  subtitle?: string;
  filename?: string;
}

/**
 * Print low stock components
 */
export const printLowStockAlert = (components: any[], options: PrintOptions) => {
  const { title, subtitle, filename = 'low-stock-alert' } = options;
  
  const printWindow = window.open('', '', 'height=600,width=800');
  if (!printWindow) {
    console.error('Could not open print window');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #2d3748;
            line-height: 1.6;
            background: white;
            padding: 40px;
          }
          
          .header {
            margin-bottom: 30px;
            border-bottom: 3px solid #e53e3e;
            padding-bottom: 20px;
          }
          
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #e53e3e;
            margin-bottom: 8px;
          }
          
          .subtitle {
            font-size: 12px;
            color: #718096;
          }
          
          .print-date {
            font-size: 11px;
            color: #a0aec0;
            margin-top: 10px;
          }
          
          .summary {
            background: #fffaf0;
            border-left: 4px solid #ed8936;
            padding: 15px;
            margin-bottom: 30px;
            border-radius: 4px;
          }
          
          .summary-text {
            font-size: 13px;
            color: #c05621;
            font-weight: 500;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          thead {
            background: #edf2f7;
          }
          
          th {
            text-align: left;
            padding: 12px;
            font-weight: 600;
            font-size: 12px;
            color: #2d3748;
            border-bottom: 2px solid #cbd5e0;
          }
          
          td {
            padding: 10px 12px;
            font-size: 12px;
            color: #4a5568;
            border-bottom: 1px solid #e2e8f0;
          }
          
          tr:last-child td {
            border-bottom: none;
          }
          
          .type-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            text-transform: capitalize;
            color: white;
          }
          
          .type-printer {
            background: #4318ff;
          }
          
          .type-group {
            background: #764ba2;
          }
          
          .type-assembly {
            background: #38a169;
          }
          
          .type-component {
            background: #dd6b20;
          }
          
          .low-stock-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #f56565;
            margin-right: 6px;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #a0aec0;
            text-align: center;
          }
          
          @media print {
            body {
              padding: 0;
            }
            
            .no-print {
              display: none !important;
            }
          }
          
          @page {
            margin: 20mm;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">⚠️ ${title}</div>
          <div class="subtitle">${subtitle || ''}</div>
          <div class="print-date">Printed on ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="summary">
          <div class="summary-text">
            📦 ${components.length} component${components.length !== 1 ? 's' : ''} below minimum stock level
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Component Name</th>
              <th>Current Stock</th>
              <th>Min. Level</th>
              <th>Type</th>
              <th>Supplier</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            ${components.map(component => `
              <tr>
                <td><span class="low-stock-indicator"></span>${component.componentName}</td>
                <td>${component.amount} ${component.measure}</td>
                <td>${component.triggerMinAmount} ${component.measure}</td>
                <td>
                  <span class="type-badge type-${component.type.toLowerCase()}">
                    ${component.type}
                  </span>
                </td>
                <td>${component.supplier || 'N/A'}</td>
                <td>$${parseFloat(component.cost || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>SmartStock Inventory Management System</p>
          <p>This is an auto-generated report</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 250);
};

/**
 * Print purchase requirements
 */
export const printPurchaseRequirements = (requirements: any[], options: PrintOptions) => {
  const { title, subtitle, filename = 'purchase-requirements' } = options;
  
  const printWindow = window.open('', '', 'height=600,width=800');
  if (!printWindow) {
    console.error('Could not open print window');
    return;
  }

  const totalCost = requirements.reduce((sum, req) => sum + (req.estimatedCost || 0), 0);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #2d3748;
            line-height: 1.6;
            background: white;
            padding: 40px;
          }
          
          .header {
            margin-bottom: 30px;
            border-bottom: 3px solid #38a169;
            padding-bottom: 20px;
          }
          
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #38a169;
            margin-bottom: 8px;
          }
          
          .subtitle {
            font-size: 12px;
            color: #718096;
          }
          
          .print-date {
            font-size: 11px;
            color: #a0aec0;
            margin-top: 10px;
          }
          
          .summary {
            background: #f0fff4;
            border-left: 4px solid #38a169;
            padding: 15px;
            margin-bottom: 30px;
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .summary-left {
            flex: 1;
          }
          
          .summary-text {
            font-size: 13px;
            color: #22543d;
            font-weight: 500;
          }
          
          .summary-cost {
            font-size: 18px;
            font-weight: bold;
            color: #38a169;
            text-align: right;
          }
          
          .summary-cost-label {
            font-size: 11px;
            color: #718096;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          thead {
            background: #edf2f7;
          }
          
          th {
            text-align: left;
            padding: 12px;
            font-weight: 600;
            font-size: 12px;
            color: #2d3748;
            border-bottom: 2px solid #cbd5e0;
          }
          
          td {
            padding: 10px 12px;
            font-size: 12px;
            color: #4a5568;
            border-bottom: 1px solid #e2e8f0;
          }
          
          tr:last-child td {
            border-bottom: none;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            text-transform: capitalize;
            color: white;
          }
          
          .status-pending {
            background: #ed8936;
          }
          
          .status-ordered {
            background: #4299e1;
          }
          
          .status-received {
            background: #38a169;
          }
          
          .urgent-indicator {
            color: #e53e3e;
            font-weight: bold;
          }
          
          .notes-section {
            margin-top: 30px;
            padding: 15px;
            background: #f7fafc;
            border-radius: 4px;
          }
          
          .notes-title {
            font-weight: 600;
            font-size: 12px;
            color: #2d3748;
            margin-bottom: 8px;
          }
          
          .notes-text {
            font-size: 11px;
            color: #718096;
            line-height: 1.5;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #a0aec0;
            text-align: center;
          }
          
          @media print {
            body {
              padding: 0;
            }
            
            .no-print {
              display: none !important;
            }
          }
          
          @page {
            margin: 20mm;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">🛒 ${title}</div>
          <div class="subtitle">${subtitle || ''}</div>
          <div class="print-date">Printed on ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="summary">
          <div class="summary-left">
            <div class="summary-text">
              📋 ${requirements.length} purchase requirement${requirements.length !== 1 ? 's' : ''} generated
            </div>
          </div>
          <div>
            <div class="summary-cost-label">Estimated Total Cost</div>
            <div class="summary-cost">$${totalCost.toFixed(2)}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Component Name</th>
              <th>Required Quantity</th>
              <th>Needed By Date</th>
              <th>Status</th>
              <th>Est. Cost</th>
            </tr>
          </thead>
          <tbody>
            ${requirements.map(req => {
              const neededDate = new Date(req.neededByDate);
              const today = new Date();
              const isUrgent = neededDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
              return `
              <tr>
                <td>${req.componentName}</td>
                <td>${req.requiredQuantity}</td>
                <td class="${isUrgent ? 'urgent-indicator' : ''}">${neededDate.toLocaleDateString()}</td>
                <td>
                  <span class="status-badge status-${(req.status || 'pending').toLowerCase()}">
                    ${req.status || 'pending'}
                  </span>
                </td>
                <td>$${(req.estimatedCost || 0).toFixed(2)}</td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="notes-section">
          <div class="notes-title">📝 Notes:</div>
          <div class="notes-text">
            • Items marked in red require attention within the next 7 days
            <br>• Please coordinate with suppliers for timely delivery
            <br>• Update order status in the system once purchases are confirmed
          </div>
        </div>
        
        <div class="footer">
          <p>SmartStock Inventory Management System</p>
          <p>This is an auto-generated report</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 250);
};
