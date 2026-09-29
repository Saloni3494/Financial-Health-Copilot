# FinSight AI: Financial Health Copilot

FinSight AI is an intelligent, AI-powered Financial Health Copilot designed to help individuals understand, track, and optimize their overall financial well-being. Going beyond traditional expense trackers, FinSight AI acts as a proactive advisor that analyzes your income, expenses, debt obligations, and savings behavior to identify emerging risks, discover opportunities, and recommend practical next actions.

## 🚀 Key Features

*   **Bank Accounts & Credit Cards:** Get a unified view of your liquid cash and credit limits across all your bank accounts and credit cards.
*   **Investments Tracking:** Monitor your portfolio performance across Mutual Funds, Direct Stocks, Fixed Deposits, and Digital Gold, including your total returns and investment health.
*   **Loans & Debt Obligations:** Track your outstanding principal, monitor upcoming EMI due dates, and understand the impact of your home, car, and personal loans on your cash flow.
*   **Recurring Payments & Subscriptions:** Manage your active subscriptions (Netflix, Gym, Utilities) and automatically calculate your monthly and projected yearly outflow.
*   **Savings Behavior & Goals:** Set actionable financial goals (like an Emergency Fund or a Vacation) with visual progress tracking. Monitor your overall savings rate against a >20% target.
*   **Affordability Checks ("Can I afford X?"):** Ask the AI Copilot if you can afford a specific purchase (e.g., a new iPhone). The engine instantly evaluates your liquid cash and monthly surplus to give you a definitive Yes/No answer along with the expected financial impact.
*   **AI-Driven Growth Memory & Missions:** The system builds a memory of your financial habits over time and sets personalized "Missions" to help you improve your financial health score.

## 🛠️ Tech Stack

### Frontend
*   **Next.js 14 (App Router)** - React framework for production
*   **Tailwind CSS** - Utility-first CSS framework for styling
*   **Framer Motion** - Fluid animations and transitions
*   **Lucide React** - Beautiful, consistent iconography
*   **Socket.IO Client** - Real-time bi-directional communication

### Backend (AI Engine)
*   **FastAPI (Python)** - High-performance async API framework
*   **Supabase / PostgreSQL** - Scalable database for secure persistence
*   **Socket.IO Server** - For real-time updates to the UI
*   **Agentic AI Copilot** - Custom routing, intent parsing, and natural language simulation 

## 📦 Local Development

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd <repository_folder>
   ```

2. **Start the Frontend:**
   ```bash
   cd apps/web
   npm install
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`.

3. **Start the Backend (AI Engine):**
   ```bash
   cd services/ai-engine
   pip install -r requirements.txt
   python main.py
   ```
   The API will be available at `http://localhost:8000`.

## 📈 Architecture

FinSight AI uses a microservices-inspired monorepo architecture:
*   `apps/web`: Contains the Next.js React frontend, defining the dashboard UI, interactive simulator panels, and routing.
*   `services/ai-engine`: The Python backend powering the core business logic, real-time Socket.IO events, and the AI Simulation loops.
*   `database/schema.sql`: Contains the definitions for the backend database structures.

*Note: For demo purposes, features like Accounts, Investments, Loans, Subscriptions, and Savings utilize local JSON fallback mechanisms ensuring instant out-of-the-box readiness without complex database configurations.*
