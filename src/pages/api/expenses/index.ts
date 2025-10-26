// src/pages/api/expenses/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getPool } from '@/lib/db';
import sql from 'mssql';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle GET - Get all expenses
  if (req.method === 'GET') {
    try {
      const pool = await getPool();
      
      const result = await pool.request().query(`
        SELECT 
          e.id,
          e.user_id,
          e.category,
          e.amount,
          e.currency,
          e.expense_date,
          e.notes,
          e.receipt_url,
          e.created_at,
          u.display_name,
          u.email
        FROM expenses e
        JOIN users u ON e.user_id = u.id
        ORDER BY e.expense_date DESC
      `);
      
      return res.status(200).json(result.recordset);
      
    } catch (error: any) {
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Failed to fetch expenses' });
    }
  }

  // Handle POST - Create new expense
  if (req.method === 'POST') {
    try {
      // Get data from request body
      const { user_id, category, amount, expense_date, notes } = req.body;
      
      // Validate required fields
      if (!user_id || !category || !amount || !expense_date) {
        return res.status(400).json({ 
          message: 'Missing required fields: user_id, category, amount, expense_date' 
        });
      }

      const pool = await getPool();
      
      // Insert new expense
      const result = await pool.request()
        .input('user_id', sql.UniqueIdentifier, user_id)
        .input('category', sql.NVarChar(100), category)
        .input('amount', sql.Decimal(10, 2), amount)
        .input('expense_date', sql.Date, expense_date)
        .input('notes', sql.NVarChar(1000), notes || null)
        .query(`
          INSERT INTO expenses (user_id, category, amount, expense_date, notes)
          OUTPUT INSERTED.*
          VALUES (@user_id, @category, @amount, @expense_date, @notes)
        `);
      
      return res.status(201).json({
        message: 'Expense created successfully',
        expense: result.recordset[0]
      });
      
    } catch (error: any) {
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Failed to create expense' });
    }
  }

  // If method is not GET or POST
  return res.status(405).json({ message: 'Method not allowed' });
}