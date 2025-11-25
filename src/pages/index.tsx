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
// ADD THESE NEW STATES (for OCR feature):
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
// For preview/edit
  const [previewMerchant, setPreviewMerchant] = useState('');
  const [previewAmount, setPreviewAmount] = useState('');
  const [previewDate, setPreviewDate] = useState('');
  const [previewCategory, setPreviewCategory] = useState('');
  const [previewNotes, setPreviewNotes] = useState('');

 

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

// Handle file selection
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    setSelectedFile(e.target.files[0]);
    setShowPreview(false);
    setExtractedData(null);
  }
};

// Handle OCR extraction
const handleExtractData = async () => {
  if (!selectedFile) {
    alert('Please select a receipt image first');
    return;
  }

  try {
    setUploading(true);

    // Convert image to base64 or upload to temp storage
    // For now, we'll use a simple approach with FormData
    const formData = new FormData();
    formData.append('image', selectedFile);

    // First, upload image to get a URL (we'll use a simple base64 approach)
    const reader = new FileReader();
    
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      
      // Call OCR API
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: base64String, // We'll handle base64 in API
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Set extracted data to preview
        setExtractedData(result.data);
        setPreviewMerchant(result.data.merchant || '');
        setPreviewAmount(result.data.amount?.toString() || '');
        setPreviewDate(result.data.date || '');
        setPreviewCategory(result.data.category || '');
        setPreviewNotes(`Receipt from ${result.data.merchant || 'merchant'}`);
        setShowPreview(true);
        
        alert('Data extracted! Please review and confirm below.');
      } else {
        alert('Failed to extract data: ' + result.message);
      }
      
      setUploading(false);
    };

    reader.readAsDataURL(selectedFile);

  } catch (err) {
    console.error('OCR error:', err);
    alert('Error processing receipt');
    setUploading(false);
  }
};

// Handle confirming and adding the expense from preview
const handleConfirmAndAdd = async () => {
  if (!previewAmount || !previewDate || !previewCategory) {
    alert('Please fill in amount, date, and category');
    return;
  }

  try {
    const response = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: USER_ID,
        category: previewCategory,
        amount: parseFloat(previewAmount),
        expense_date: previewDate,
        notes: previewNotes || null,
      }),
    });

    if (response.ok) {
      // Clear everything
      setSelectedFile(null);
      setShowPreview(false);
      setExtractedData(null);
      setPreviewMerchant('');
      setPreviewAmount('');
      setPreviewDate('');
      setPreviewCategory('');
      setPreviewNotes('');
      
      // Refresh expense list
      fetchExpenses();
      
      alert('Expense added successfully from receipt!');
    } else {
      alert('Failed to add expense');
    }
  } catch (err) {
    console.error(err);
    alert('Error adding expense');
  }
};

// Handle canceling preview
const handleCancelPreview = () => {
  setShowPreview(false);
  setExtractedData(null);
  setSelectedFile(null);
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
        {/* Receipt Upload Section - NEW! */}
<div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-md p-6 mb-8 border-2 border-purple-200">
  <h2 className="text-2xl font-semibold mb-4 text-purple-800">
    📸 Upload Receipt (AI Powered)
  </h2>
  
  <div className="space-y-4">
    {/* File Upload */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Receipt Image
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
      />
      {selectedFile && (
        <p className="mt-2 text-sm text-gray-600">
          Selected: {selectedFile.name}
        </p>
      )}
    </div>

    {/* Extract Button */}
    <button
      onClick={handleExtractData}
      disabled={!selectedFile || uploading}
      className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {uploading ? '🔄 Extracting Data...' : '✨ Extract Data with AI'}
    </button>

    {/* Preview/Confirmation Box */}
    {showPreview && extractedData && (
      <div className="mt-6 p-4 bg-white rounded-lg border-2 border-green-300 shadow-sm">
        <h3 className="text-lg font-semibold text-green-800 mb-4">
          ✓ Extracted Data - Review & Edit
        </h3>
        
        <div className="space-y-3">
          {/* Merchant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Merchant
            </label>
            <input
              type="text"
              value={previewMerchant}
              onChange={(e) => setPreviewMerchant(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Store/Merchant name"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <input
              type="text"
              value={previewCategory}
              onChange={(e) => setPreviewCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Food, Transport"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount ($) *
              </label>
              <input
                type="number"
                step="0.01"
                value={previewAmount}
                onChange={(e) => setPreviewAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={previewDate}
                onChange={(e) => setPreviewDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <input
              type="text"
              value={previewNotes}
              onChange={(e) => setPreviewNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Optional notes"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleConfirmAndAdd}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              ✓ Confirm & Add Expense
            </button>
            <button
              onClick={handleCancelPreview}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors font-medium"
            >
              ✗ Cancel
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
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
