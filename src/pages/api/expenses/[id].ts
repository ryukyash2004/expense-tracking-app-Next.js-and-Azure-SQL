// src/pages/api/expenses/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getPool } from '@/lib/db';
import sql from 'mssql';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get the ID from the URL
  const { id } = req.query;

  // Validate ID exists
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid expense ID' });
  }

  // Handle GET - Get single expense
  if (req.method === 'GET') {
    try {
      const pool = await getPool();
      
      const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
          SELECT 
            e.id,
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
          WHERE e.id = @id
        `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ message: 'Expense not found' });
      }
      
      return res.status(200).json(result.recordset[0]);
      
    } catch (error: any) {
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Failed to fetch expense' });
    }
  }

  // Handle PUT - Update expense
  if (req.method === 'PUT') {
    try {
      const { category, amount, expense_date, notes } = req.body;
      
      // Validate at least one field to update
      if (!category && !amount && !expense_date && notes === undefined) {
        return res.status(400).json({ 
          message: 'Provide at least one field to update' 
        });
      }

      const pool = await getPool();
      
      // Build dynamic UPDATE query
      const updates: string[] = [];
      const request = pool.request().input('id', sql.UniqueIdentifier, id);
      
      if (category) {
        updates.push('category = @category');
        request.input('category', sql.NVarChar(100), category);
      }
      if (amount) {
        updates.push('amount = @amount');
        request.input('amount', sql.Decimal(10, 2), amount);
      }
      if (expense_date) {
        updates.push('expense_date = @expense_date');
        request.input('expense_date', sql.Date, expense_date);
      }
      if (notes !== undefined) {
        updates.push('notes = @notes');
        request.input('notes', sql.NVarChar(1000), notes || null);
      }
      
      const result = await request.query(`
        UPDATE expenses
        SET ${updates.join(', ')}
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ message: 'Expense not found' });
      }
      
      return res.status(200).json({
        message: 'Expense updated successfully',
        expense: result.recordset[0]
      });
      
    } catch (error: any) {
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Failed to update expense' });
    }
  }

  // Handle DELETE - Delete expense
  if (req.method === 'DELETE') {
    try {
      const pool = await getPool();
      
      const result = await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query(`
          DELETE FROM expenses
          OUTPUT DELETED.*
          WHERE id = @id
        `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ message: 'Expense not found' });
      }
      
      return res.status(200).json({
        message: 'Expense deleted successfully',
        expense: result.recordset[0]
      });
      
    } catch (error: any) {
      console.error('Database error:', error);
      return res.status(500).json({ message: 'Failed to delete expense' });
    }
  }

  // If method is not GET, PUT, or DELETE
  return res.status(405).json({ message: 'Method not allowed' });
}