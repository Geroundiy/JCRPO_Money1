import { GoalForm } from './GoalForm.js';
import { ExpenseForm } from './ExpenseForm.js';
import { IncomeForm } from './IncomeForm.js';

class App {
    constructor() {
        this.goalForm = new GoalForm();
        this.expenseForm = new ExpenseForm();
        this.incomeForm = new IncomeForm();
        this.goalProgress = {
            element: document.getElementById('progress-fill'),
            textElement: document.getElementById('progress-text'),
            daysElement: document.getElementById('days-progress'),
            titleElement: document.getElementById('goal-title'),
        };
        this.expensesList = document.getElementById('expenses-list');
        this.goalBtn = document.getElementById('goal-btn');
        this.expenseBtn = document.getElementById('expense-btn');
        this.incomeBtn = document.getElementById('income-btn');

        this.currentGoal = null;
        this.currentTransactions = [];

        this.init();
        this.loadData();
    }

    init() {
        this.goalBtn.addEventListener('click', () => {
            this.goalForm.toggle();
            this.expenseForm.hide();
            this.incomeForm.hide();
        });

        this.expenseBtn.addEventListener('click', () => {
            this.expenseForm.toggle();
            this.goalForm.hide();
            this.incomeForm.hide();
        });

        this.incomeBtn.addEventListener('click', () => {
            this.incomeForm.toggle();
            this.goalForm.hide();
            this.expenseForm.hide();
        });

        this.goalForm.form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleGoalSubmit();
        });

        this.expenseForm.form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleExpenseSubmit();
        });

        this.incomeForm.form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleIncomeSubmit();
        });
    }

    async loadData() {
        try {
            const data = await getFullData();
            if (data) {
                this.currentGoal = data.goal;
                this.currentTransactions = data.transactions;
                this.updateUI();
            }
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            // Обработка ошибки, например, перенаправление на страницу входа
        }
    }

    updateUI() {
        if (this.currentGoal) {
            this.goalProgress.titleElement.textContent = `Накопления на ${this.currentGoal.name}`;
            const totalCollected = this.calculateTotalCollected();
            const progress = (totalCollected / this.currentGoal.amount) * 100;
            this.goalProgress.element.style.width = `${Math.max(0, Math.min(100, progress))}%`;
            this.goalProgress.textElement.textContent = `${totalCollected} ₽ / ${this.currentGoal.amount} ₽`;

            const deadline = new Date(this.currentGoal.date);
            const today = new Date();
            const timeDiff = deadline.getTime() - today.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
            this.goalProgress.daysElement.textContent = `Осталось дней: ${daysLeft}`;
        }

        this.renderExpenses();
    }

    async handleGoalSubmit() {
        const goalData = {
            name: this.goalForm.form.querySelector('#goal-name-input').value,
            amount: parseFloat(this.goalForm.form.querySelector('#goal-amount-input').value),
            date: this.goalForm.form.querySelector('#goal-date-input').value
        };
        await saveGoal(goalData);
        await this.loadData();
        this.goalForm.hide();
    }

    async handleIncomeSubmit() {
        const incomeData = {
            amount: parseFloat(this.incomeForm.form.querySelector('#income-amount-input').value),
            description: this.incomeForm.form.querySelector('#income-description-input').value,
            type: 'INCOME'
        };
        await saveTransaction(incomeData);
        await this.loadData();
        this.incomeForm.hide();
    }

    async handleExpenseSubmit() {
        const expenseData = {
            amount: parseFloat(this.expenseForm.form.querySelector('#expense-amount-input').value),
            category: this.expenseForm.form.querySelector('#expense-category-input').value,
            description: this.expenseForm.form.querySelector('#expense-description-input').value,
            type: 'EXPENSE'
        };
        await saveTransaction(expenseData);
        await this.loadData();
        this.expenseForm.hide();
    }

    calculateTotalCollected() {
        const totalIncome = this.currentTransactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = this.currentTransactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0);
        return totalIncome - totalExpenses;
    }

    renderExpenses() {
        this.expensesList.innerHTML = '';
        const today = new Date().toISOString().split('T')[0];
        const todayExpenses = this.currentTransactions
            .filter(t => t.type === 'EXPENSE' && t.date === today);

        if (todayExpenses.length === 0) {
            this.expensesList.innerHTML = '<li>Сегодня расходов нет.</li>';
            return;
        }

        todayExpenses.forEach(expense => {
            const li = document.createElement('li');
            li.textContent = `${expense.amount} ₽ - ${this.getCategoryName(expense.category)}`;
            this.expensesList.appendChild(li);
        });
    }

    getCategoryName(category) {
        const categories = {
            'food': 'Еда',
            'transport': 'Транспорт',
            'entertainment': 'Развлечения',
            'shopping': 'Покупки',
            'other': 'Другое'
        };
        return categories[category] || 'Неизвестная';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});