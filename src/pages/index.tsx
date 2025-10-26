// src/pages/index.tsx
import { useState, useEffect } from 'react';

// TypeScript type for an expense
type Expense = {
  id: string;
  category: string;
  amount: number;
  currency: string;
  expense_date: string;
  notes: string | null;
  display_name: string;
  email: string;
};

export default function Home() {
  // State to hold all expenses
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // State for the form
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  
  // State for loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Your user ID (we'll hardcode for now)
  const USER_ID = '070F3151-40CF-4CDE-A447-941424ACF998'; // REPLACE WITH YOUR ACTUAL USER ID

  // Fetch expenses when page loads
  useEffect(() => {
    fetchExpenses();
  }, []);

  // Function to fetch all expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/expenses');
      const data = await response.json();
      setExpenses(data);
      setError('');
    } catch (err) {
      setError('Failed to load expenses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Function to add new expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    
    // Validate form
    if (!category || !amount || !date) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: USER_ID,
          category,
          amount: parseFloat(amount),
          expense_date: date,
          notes: notes || null,
        }),
      });

      if (response.ok) {
        // Clear form
        setCategory('');
        setAmount('');
        setDate('');
        setNotes('');
        
        // Refresh the list
        fetchExpenses();
        
        alert('Expense added successfully!');
      } else {
        alert('Failed to add expense');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding expense');
    }
  };

  // Function to delete expense
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchExpenses(); // Refresh the list
        alert('Expense deleted!');
      } else {
        alert('Failed to delete expense');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting expense');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          💰 Expense Tracker
        </h1>

        {/* Add Expense Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Add New Expense</h2>
          
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Food, Transport"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Add Expense
            </button>
          </form>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Your Expenses</h2>

          {loading && <p className="text-gray-600">Loading...</p>}
          
          {error && <p className="text-red-600">{error}</p>}

          {!loading && expenses.length === 0 && (
            <p className="text-gray-600">No expenses yet. Add your first one above!</p>
          )}

          {/* Expense Cards */}
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {expense.category}
                      </h3>
                      <span className="text-2xl font-bold text-green-600">
                        ${expense.amount.toFixed(2)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1">
                      📅 {new Date(expense.expense_date).toLocaleDateString()}
                    </p>
                    
                    {expense.notes && (
                      <p className="text-sm text-gray-700 italic">
                        "{expense.notes}"
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}