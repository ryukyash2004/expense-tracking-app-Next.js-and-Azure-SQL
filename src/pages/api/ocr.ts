// src/pages/api/ocr.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { ApiKeyCredentials } from '@azure/ms-rest-js';

// Debug logging
console.log('🔍 Environment check:');
console.log('KEY exists?', !!process.env.AZURE_COMPUTER_VISION_KEY);
console.log('ENDPOINT exists?', !!process.env.AZURE_COMPUTER_VISION_ENDPOINT);
console.log('ENDPOINT value:', process.env.AZURE_COMPUTER_VISION_ENDPOINT);

// Configure Azure Computer Vision
const key = process.env.AZURE_COMPUTER_VISION_KEY!;
const endpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT!;

const computerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } }),
  endpoint
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL or base64 required' });
    }

    console.log('Processing image...');

    let result;
    
    // Check if it's base64 or URL
    if (imageUrl.startsWith('data:image')) {
      // It's base64 - convert to buffer
      const base64Data = imageUrl.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      result = await computerVisionClient.readInStream(imageBuffer);
    } else {
      // It's a URL
      result = await computerVisionClient.read(imageUrl);
    }
    
    // Get operation ID from the URL
    const operationId = result.operationLocation.split('/').pop()!;
    
    // Wait for the operation to complete
    let readResult = await computerVisionClient.getReadResult(operationId);
    
    // Poll until the operation completes
    while (readResult.status === 'running' || readResult.status === 'notStarted') {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      readResult = await computerVisionClient.getReadResult(operationId);
    }

    if (readResult.status === 'failed') {
      return res.status(500).json({ message: 'OCR processing failed' });
    }

    // Extract all text lines
    const lines: string[] = [];
    if (readResult.analyzeResult?.readResults) {
      for (const page of readResult.analyzeResult.readResults) {
        for (const line of page.lines) {
          lines.push(line.text);
        }
      }
    }

    console.log('Extracted lines:', lines);

    // Smart parsing logic
    const extractedData = parseReceiptData(lines);

    return res.status(200).json({
      success: true,
      data: extractedData,
      rawText: lines, // Send all text for debugging
    });

  } catch (error: any) {
    console.error('OCR error:', error);
    return res.status(500).json({ 
      message: 'Failed to process image',
      error: error.message 
    });
  }
}

// Helper function to parse receipt data - INDIA-OPTIMIZED VERSION
function parseReceiptData(lines: string[]) {
  let merchant = '';
  let amount = 0;
  let date = '';
  let category = 'Other';

  // Join all lines for easier searching
  const allText = lines.join(' ').toLowerCase();

  console.log('📄 All extracted lines:', lines);

  // IMPROVED: Extract merchant name (India-specific)
  const skipWords = ['gst', 'invoice', 'bill', 'receipt', 'tax', 'invoice#', 'receipt#', 'user', 'customer', 'mobile', 'address', 'phone'];
  
  // Look in first 7 lines for business name
  for (let i = 0; i < Math.min(lines.length, 7); i++) {
    const line = lines[i].trim();
    const lowerLine = line.toLowerCase();
    
    // Skip if too short
    if (line.length < 3) continue;
    
    // Skip common header words
    if (skipWords.some(word => lowerLine.includes(word))) continue;
    
    // Skip if only numbers, dates, or special chars
    if (/^[0-9\-\/\.\s:,]+$/.test(line)) continue;
    
    // Skip lines that are just "INVOICE" or similar
    if (lowerLine === 'invoice' || lowerLine === 'gst invoice') continue;
    
    // Look for business name patterns (usually CAPITAL or has "GROCERY", "STORE", etc.)
    const businessKeywords = ['grocery', 'store', 'shop', 'mart', 'market', 'restaurant', 'cafe', 'hotel'];
    const hasBusinessKeyword = businessKeywords.some(word => lowerLine.includes(word));
    
    // If line has business keyword OR is in ALL CAPS and reasonable length
    if (hasBusinessKeyword || (line === line.toUpperCase() && line.length > 5 && line.length < 60)) {
      merchant = line;
      break;
    }
  }

  // If still no merchant, use line after "GST INVOICE"
  if (!merchant) {
    const invoiceIndex = lines.findIndex(line => line.toLowerCase().includes('gst invoice'));
    if (invoiceIndex >= 0 && invoiceIndex < lines.length - 1) {
      merchant = lines[invoiceIndex + 1].trim();
    }
  }

  // Clean up merchant name (remove extra spaces, limit length)
  if (merchant) {
    merchant = merchant.replace(/\s+/g, ' ').trim();
    if (merchant.length > 50) {
      merchant = merchant.substring(0, 50) + '...';
    }
  }

  console.log('🏪 Extracted merchant:', merchant);

  // IMPROVED: Extract amount (handle Rupees and "NET AMOUNT")
  let maxAmount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    // Priority keywords for Indian receipts
    const amountKeywords = ['net amount', 'total amount', 'grand total', 'amount payable', 'total'];
    
    // Check if this line has amount keyword
    const hasAmountKeyword = amountKeywords.some(keyword => lowerLine.includes(keyword));
    
    if (hasAmountKeyword) {
      // Look in this line and next line for the amount
      const searchLines = [line];
      if (i < lines.length - 1) {
        searchLines.push(lines[i + 1]);
      }
      
      for (const searchLine of searchLines) {
        // Match numbers with optional Rs, ₹, or decimal
        const amountPattern = /(?:rs\.?|₹)?\s*(\d+(?:\.\d{1,2})?)/gi;
        const matches = searchLine.matchAll(amountPattern);
        
        for (const match of matches) {
          const parsedAmount = parseFloat(match[1]);
          if (parsedAmount > maxAmount && parsedAmount < 100000) {
            maxAmount = parsedAmount;
          }
        }
      }
    }
  }

  // If no amount found with keywords, look for standalone large numbers
  if (maxAmount === 0) {
    for (const line of lines) {
      const numbers = line.match(/\d+\.\d{2}/g); // Match decimal amounts like 20.00
      if (numbers) {
        for (const num of numbers) {
          const parsedAmount = parseFloat(num);
          if (parsedAmount > 5 && parsedAmount < 10000 && parsedAmount > maxAmount) {
            maxAmount = parsedAmount;
          }
        }
      }
    }
  }

  amount = maxAmount;
  console.log('💰 Extracted amount:', amount);

  // IMPROVED: Extract date (handle DD/MM/YYYY Indian format)
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Look for "date" keyword first
    if (lowerLine.includes('date')) {
      // Extract date from this line or next
      const datePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/;
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        date = dateMatch[0];
        break;
      }
    }
  }

  // If not found with keyword, search all lines
  if (!date) {
    for (const line of lines) {
      const datePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/;
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        date = dateMatch[0];
        break;
      }
    }
  }

  // Convert DD/MM/YYYY to YYYY-MM-DD
  if (date) {
    try {
      const parts = date.split(/[\/\-]/);
      if (parts.length === 3) {
        let day, month, year;
        
        // Check if it's DD/MM/YYYY or MM/DD/YYYY
        // In India, it's typically DD/MM/YYYY
        day = parts[0].padStart(2, '0');
        month = parts[1].padStart(2, '0');
        year = parts[2];
        
        // Handle 2-digit year
        if (year.length === 2) {
          year = '20' + year;
        }
        
        // Create date object (months are 0-indexed in JS)
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        if (!isNaN(dateObj.getTime())) {
          date = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
        } else {
          date = new Date().toISOString().split('T')[0];
        }
      }
    } catch (error) {
      console.error('Date parsing error:', error);
      date = new Date().toISOString().split('T')[0];
    }
  } else {
    date = new Date().toISOString().split('T')[0];
  }

  console.log('📅 Extracted date:', date);

  // IMPROVED: Guess category (India-specific)
  const merchantLower = merchant.toLowerCase();
  
  // Food & Grocery keywords
  const foodKeywords = ['grocery', 'restaurant', 'cafe', 'coffee', 'starbucks', 'pizza', 'burger', 'food', 'kitchen', 'dining', 'hotel', 'dhaba', 'snacks', 'sweets', 'bakery'];
  
  // Transport keywords
  const transportKeywords = ['uber', 'ola', 'taxi', 'auto', 'gas', 'fuel', 'petrol', 'diesel', 'parking', 'transport'];
  
  // Shopping keywords
  const shoppingKeywords = ['mall', 'mart', 'store', 'shop', 'bazaar', 'market', 'clothing', 'fashion'];
  
  // Entertainment keywords
  const entertainmentKeywords = ['cinema', 'movie', 'pvr', 'inox', 'theatre', 'theater', 'game'];
  
  // Medical keywords
  const medicalKeywords = ['pharmacy', 'medical', 'hospital', 'clinic', 'doctor', 'chemist'];
  
  if (foodKeywords.some(word => merchantLower.includes(word) || allText.includes(word))) {
    category = 'Food';
  } else if (transportKeywords.some(word => merchantLower.includes(word) || allText.includes(word))) {
    category = 'Transport';
  } else if (shoppingKeywords.some(word => merchantLower.includes(word) || allText.includes(word))) {
    category = 'Shopping';
  } else if (entertainmentKeywords.some(word => merchantLower.includes(word) || allText.includes(word))) {
    category = 'Entertainment';
  } else if (medicalKeywords.some(word => merchantLower.includes(word) || allText.includes(word))) {
    category = 'Medical';
  }

  console.log('📂 Guessed category:', category);

  return {
    merchant,
    amount: amount > 0 ? amount : null,
    date,
    category,
  };
}