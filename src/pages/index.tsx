import { useState, useEffect } from "react";

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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const USER_ID = "070F3151-40CF-4CDE-A447-941424ACF998";

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/expenses");
      const data = await response.json();
      setExpenses(data);
      setError("");
    } catch (err) {
      setError("Failed to load expenses");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !amount || !date) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          category,
          amount: parseFloat(amount),
          expense_date: date,
          notes: notes || null,
        }),
      });

      if (response.ok) {
        setCategory("");
        setAmount("");
        setDate("");
        setNotes("");
        fetchExpenses();
      } else {
        alert("Failed to add expense");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding expense");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });
      if (response.ok) fetchExpenses();
    } catch (err) {
      console.error(err);
      alert("Error deleting expense");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10">
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
            💰 Expense Tracker
          </h1>
          <p className="text-gray-500 mt-2 sm:mt-0">
            Track your daily expenses with ease
          </p>
        </header>

        {/* Add Expense Form */}
        <section className="backdrop-blur-md bg-white/70 rounded-2xl shadow-lg border border-white/40 p-8 mb-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Add New Expense
          </h2>

          <form onSubmit={handleAddExpense} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Food, Transport"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:shadow-lg hover:scale-[1.01] transition-all font-semibold"
            >
              ➕ Add Expense
            </button>
          </form>
        </section>

        {/* Expense List */}
        <section className="backdrop-blur-md bg-white/70 rounded-2xl shadow-lg border border-white/40 p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Your Expenses
          </h2>

          {loading && <p className="text-gray-600">Loading...</p>}
          {error && <p className="text-red-600">{error}</p>}

          {!loading && expenses.length === 0 && (
            <p className="text-gray-600">No expenses yet. Add your first one!</p>
          )}

          <div className="space-y-4">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex justify-between items-center p-5 rounded-xl border border-gray-100 bg-white/60 hover:shadow-md transition-all"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {expense.category}
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      ${expense.amount.toFixed(2)}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    📅 {new Date(expense.expense_date).toLocaleDateString()}
                  </p>
                  {expense.notes && (
                    <p className="text-sm text-gray-700 italic mt-1">
                      "{expense.notes}"
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(expense.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
