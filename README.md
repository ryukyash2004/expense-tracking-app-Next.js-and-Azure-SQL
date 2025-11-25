# 💰 Expense Tracker - Cloud-Based Personal Finance Manager

A full-stack expense tracking application with **AI-powered receipt scanning** built with Next.js, TypeScript, Azure SQL Database, and Azure Computer Vision.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Azure](https://img.shields.io/badge/Azure-Cloud-0078D4?style=flat-square&logo=microsoft-azure)

## ✨ Features

### Core Functionality
- ✅ **Add, view, edit, and delete expenses** with a clean, intuitive interface
- 📊 **Real-time data sync** with cloud database
- 💳 **Track spending** by category, date, and amount
- 📱 **Responsive design** - works on desktop and mobile

### 🤖 AI-Powered Receipt Scanning (NEW!)
- 📸 **Upload receipt photos** and extract data automatically
- 🧠 **Smart OCR** powered by Azure Computer Vision
- ✏️ **Review & edit** extracted data before saving
- 🇮🇳 **Optimized for Indian receipts** (GST invoices, Rupees, DD/MM/YYYY dates)
- 🎯 **Auto-categorization** based on merchant names

## 🚀 Demo

**Live App:** [Your Vercel URL here]

### Screenshots

**Dashboard:**
![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Screenshot)

**AI Receipt Scanning:**
![Receipt Scan](https://via.placeholder.com/800x400?text=Receipt+Scanning+Screenshot)

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with server-side rendering
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Hooks** - Modern state management

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Azure SQL Database** - Cloud-hosted relational database
- **mssql** - Node.js SQL Server driver

### AI & Cloud Services
- **Azure Computer Vision** - OCR text extraction
- **Azure SQL Server** - Production database
- **Vercel** - Serverless deployment platform

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **Azure Account** (free tier available)
- **Git** for version control

## ⚙️ Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR-USERNAME/expense-tracker.git
cd expense-tracker
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:
```env
# Azure SQL Database
MSSQL_HOST=your-server.database.windows.net
MSSQL_USER=sqladmin
MSSQL_PASSWORD=your-password
MSSQL_DATABASE=expense_db
MSSQL_PORT=1433

# Azure Computer Vision (for OCR)
AZURE_COMPUTER_VISION_KEY=your-computer-vision-key
AZURE_COMPUTER_VISION_ENDPOINT=https://your-service.cognitiveservices.azure.com/
```

### 4. Set Up Azure Resources

#### Create SQL Database:
```bash
# Create resource group
az group create -n rg-expense-tracker -l eastus

# Create SQL server
az sql server create -l eastus -g rg-expense-tracker -n your-sql-server -u sqladmin -p 'YourPassword123!'

# Create database
az sql db create -g rg-expense-tracker -s your-sql-server -n expense_db --service-objective Basic

# Configure firewall
az sql server firewall-rule create -g rg-expense-tracker -s your-sql-server -n AllowAll --start-ip-address 0.0.0.0 --end-ip-address 255.255.255.255
```

#### Create Database Tables:

Connect to your database using Azure Portal Query Editor and run:
```sql
-- Users table
CREATE TABLE users (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  email NVARCHAR(320) NOT NULL UNIQUE,
  display_name NVARCHAR(200),
  created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- Expenses table
CREATE TABLE expenses (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL,
  category NVARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency NVARCHAR(10) DEFAULT 'USD',
  expense_date DATE NOT NULL,
  notes NVARCHAR(1000),
  receipt_url NVARCHAR(2000),
  created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert test user
INSERT INTO users (email, display_name) 
VALUES ('your-email@example.com', 'Your Name');
```

#### Create Computer Vision Resource:
```bash
# Create Computer Vision for OCR
az cognitiveservices account create \
  -n expense-ocr-service \
  -g rg-expense-tracker \
  -l eastus \
  --kind ComputerVision \
  --sku F0 \
  --yes
```

Get your keys:
```bash
az cognitiveservices account keys list \
  -n expense-ocr-service \
  -g rg-expense-tracker
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📡 API Endpoints

### Expenses

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/expenses` | Get all expenses |
| `POST` | `/api/expenses` | Create new expense |
| `GET` | `/api/expenses/[id]` | Get single expense |
| `PUT` | `/api/expenses/[id]` | Update expense |
| `DELETE` | `/api/expenses/[id]` | Delete expense |

### OCR

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ocr` | Extract text from receipt image |

### Example Request (Create Expense):
```javascript
POST /api/expenses
Content-Type: application/json

{
  "user_id": "abc-123-def-456",
  "category": "Food",
  "amount": 25.50,
  "expense_date": "2025-11-25",
  "notes": "Lunch at restaurant"
}
```

### Example Response:
```json
{
  "message": "Expense created successfully",
  "expense": {
    "id": "xyz-789-abc-012",
    "user_id": "abc-123-def-456",
    "category": "Food",
    "amount": 25.50,
    "currency": "USD",
    "expense_date": "2025-11-25T00:00:00.000Z",
    "notes": "Lunch at restaurant",
    "created_at": "2025-11-25T10:30:00.000Z"
  }
}
```

## 🗄️ Database Schema

### `users` Table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UNIQUEIDENTIFIER | PRIMARY KEY, DEFAULT NEWID() |
| `email` | NVARCHAR(320) | NOT NULL, UNIQUE |
| `display_name` | NVARCHAR(200) | NULL |
| `created_at` | DATETIME2 | DEFAULT SYSUTCDATETIME() |

### `expenses` Table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UNIQUEIDENTIFIER | PRIMARY KEY, DEFAULT NEWID() |
| `user_id` | UNIQUEIDENTIFIER | NOT NULL, FOREIGN KEY → users(id) |
| `category` | NVARCHAR(100) | NOT NULL |
| `amount` | DECIMAL(10,2) | NOT NULL |
| `currency` | NVARCHAR(10) | DEFAULT 'USD' |
| `expense_date` | DATE | NOT NULL |
| `notes` | NVARCHAR(1000) | NULL |
| `receipt_url` | NVARCHAR(2000) | NULL |
| `created_at` | DATETIME2 | DEFAULT SYSUTCDATETIME() |

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub:**
```bash
git add .
git commit -m "Ready for deployment"
git push
```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure environment variables (same as `.env.local`)
   - Deploy!

3. **Configure Azure Firewall:**
   - In Azure Portal, go to SQL Server → Networking
   - Enable "Allow Azure services and resources to access this server"
   - Or add firewall rule: `0.0.0.0` to `255.255.255.255`

### Environment Variables for Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:
```
MSSQL_HOST
MSSQL_USER
MSSQL_PASSWORD
MSSQL_DATABASE
MSSQL_PORT
AZURE_COMPUTER_VISION_KEY
AZURE_COMPUTER_VISION_ENDPOINT
```

## 🎯 Roadmap

- [ ] User authentication (login/signup)
- [ ] Multiple currency support
- [ ] Budget tracking and alerts
- [ ] Expense analytics and charts
- [ ] Export to CSV/Excel
- [ ] Recurring expenses
- [ ] Receipt image storage in Azure Blob
- [ ] Mobile app (React Native)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Abhishek**

- GitHub: [@YOUR-USERNAME](https://github.com/YOUR-USERNAME)
- Email: abhishekswarnakar1472@gmail.com

## 🙏 Acknowledgments

- Built as a learning project for full-stack development
- Inspired by personal finance management needs
- Special thanks to the Next.js and Azure communities

## 📚 Learn More

### Technologies Used:
- [Next.js Documentation](https://nextjs.org/docs)
- [Azure SQL Database](https://azure.microsoft.com/en-us/services/sql-database/)
- [Azure Computer Vision](https://azure.microsoft.com/en-us/services/cognitive-services/computer-vision/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)

### Tutorials:
- [Building REST APIs with Next.js](https://nextjs.org/docs/api-routes/introduction)
- [Azure Computer Vision OCR](https://docs.microsoft.com/en-us/azure/cognitive-services/computer-vision/overview-ocr)
- [SQL Database Best Practices](https://docs.microsoft.com/en-us/azure/azure-sql/database/design-first-database-tutorial)

---

⭐ **Star this repo if you found it helpful!**

📧 **Questions?** Open an issue or contact me!