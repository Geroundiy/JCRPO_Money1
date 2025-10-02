import { getFullData, saveGoal, saveTransaction, deleteGoal, logout } from './api.js';

class App {
    constructor() {
        this.currentGoal = null;
        this.currentTransactions = [];
        this.currencySymbols = { BYN: 'Br', USD: '$', EUR: '€', RUB: '₽', CNY: '¥' };
        this.exchangeRates = {};

        this.cacheDOMElements();
        this.bindGlobalEvents();
        this.loadInitialData();
    }

    cacheDOMElements() {
        this.goalTitleEl = document.getElementById('goal-title');
        this.progressFillEl = document.getElementById('progress-fill');
        this.progressTextEl = document.getElementById('progress-text');
        this.progressPercentageEl = document.getElementById('progress-percentage');
        this.piggyBankFillEl = document.getElementById('piggy-bank-fill');
        this.expensesListEl = document.getElementById('expenses-list');
        this.incomesListEl = document.getElementById('incomes-list');
        this.currencyTableBody = document.getElementById('currency-table-body');
        this.confirmationModal = document.getElementById('confirmation-modal');
        this.modalConfirmBtn = document.getElementById('modal-confirm-btn');
        this.modalCancelBtn = document.getElementById('modal-cancel-btn');
        this.mainActionBtn = document.getElementById('main-action-btn');
        this.actionButtonsContainer = document.querySelector('.action-buttons-container');
        this.converterAmount1 = document.getElementById('converter-amount-1');
        this.converterCurrency1 = document.getElementById('converter-currency-1');
        this.converterAmount2 = document.getElementById('converter-amount-2');
        this.converterCurrency2 = document.getElementById('converter-currency-2');
    }

    bindGlobalEvents() {
        document.getElementById('logout-btn').addEventListener('click', logout);
        this.mainActionBtn.addEventListener('click', () => this.actionButtonsContainer.classList.toggle('active'));

        document.getElementById('income-btn').addEventListener('click', () => this.openFormWithGoalCheck('income-form-container'));
        document.getElementById('expense-btn').addEventListener('click', () => this.openFormWithGoalCheck('expense-form-container'));
        document.getElementById('goal-btn').addEventListener('click', () => this.openForm('goal-form-container'));
        document.getElementById('delete-goal-btn').addEventListener('click', () => this.showDeleteConfirmation());
        document.getElementById('converter-btn').addEventListener('click', () => this.openForm('converter-form-container'));

        this.setupForm('goal-form-container', this.handleGoalSubmit);
        this.setupForm('expense-form-container', this.handleExpenseSubmit);
        this.setupForm('income-form-container', this.handleIncomeSubmit);
        this.setupForm('converter-form-container', () => {});

        this.modalCancelBtn.addEventListener('click', () => this.confirmationModal.classList.remove('active'));

        this.converterAmount1.addEventListener('input', () => this.handleConversion());
        this.converterCurrency1.addEventListener('change', () => this.handleConversion());
        this.converterCurrency2.addEventListener('change', () => this.handleConversion());
    }

    setupForm(containerId, submitHandler) {
        const container = document.getElementById(containerId);
        container.querySelector('.close-btn').addEventListener('click', () => container.classList.remove('active'));
        const form = container.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                submitHandler.call(this, form); // ИСПРАВЛЕНО: передаем сам элемент формы
            });
        }
    }

    async loadInitialData() {
        try {
            const storedData = sessionStorage.getItem('userData');
            let data = storedData ? JSON.parse(storedData) : await getFullData();
            if (storedData) sessionStorage.removeItem('userData');

            if (data) {
                this.currentGoal = data.goal;
                this.currentTransactions = data.transactions || [];
                this.updateUI();
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        this.fetchCurrencyRates();
    }

    updateUI() {
        if (!this.currentGoal) {
            this.goalTitleEl.textContent = 'Цель не установлена';
            this.progressTextEl.textContent = 'Пожалуйста, добавьте цель';
            this.progressPercentageEl.textContent = '';
            this.progressFillEl.style.width = '0%';
            if(this.piggyBankFillEl) this.piggyBankFillEl.style.clipPath = 'inset(100% 0 0 0)';
        } else {
            const totalCollected = this.currentTransactions.reduce((acc, t) => (t.type === 'INCOME' ? acc + t.amount : acc - t.amount), 0);
            const goalAmount = this.currentGoal.amount;
            const currencySymbol = this.currencySymbols[this.currentGoal.currency] || '';
            const progressPercent = Math.max(0, Math.min(100, (totalCollected / goalAmount) * 100));

            this.goalTitleEl.textContent = `Накопления на "${this.currentGoal.name}"`;
            this.progressTextEl.textContent = `${totalCollected.toFixed(2)} ${currencySymbol} / ${goalAmount.toFixed(2)} ${currencySymbol}`;
            this.progressPercentageEl.textContent = `${progressPercent.toFixed(1)}% накоплено`;
            this.progressFillEl.style.width = `${progressPercent}%`;
            if(this.piggyBankFillEl) this.piggyBankFillEl.style.clipPath = `inset(${100 - progressPercent}% 0 0 0)`;
        }
        this.renderTodaysExpenses();
        this.renderIncomeHistory();
    }

    renderTodaysExpenses() {
        this.expensesListEl.innerHTML = '';
        const today = new Date().toISOString().split('T')[0];
        const todayExpenses = this.currentTransactions.filter(t => t.type === 'EXPENSE' && t.date === today);

        if (todayExpenses.length === 0) {
            this.expensesListEl.innerHTML = '<li>Сегодня расходов нет.</li>';
            return;
        }
        todayExpenses.forEach(exp => this.renderTransaction(exp, this.expensesListEl));
    }

    renderIncomeHistory() {
        this.incomesListEl.innerHTML = '';
        const allIncomes = this.currentTransactions
            .filter(t => t.type === 'INCOME')
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (allIncomes.length === 0) {
            this.incomesListEl.innerHTML = '<li>История доходов пуста.</li>';
            return;
        }
        allIncomes.forEach(inc => this.renderTransaction(inc, this.incomesListEl, true));
    }

    renderTransaction(transaction, listElement, showTimestamp = false) {
        const li = document.createElement('li');
        const currencySymbol = this.currencySymbols[this.currentGoal?.currency] || '';
        const sign = transaction.type === 'INCOME' ? '+' : '-';
        const description = transaction.description || (transaction.type === 'INCOME' ? 'Доход' : transaction.category);

        let mainInfo = `<div><span>${description}</span><span style="color: ${sign === '+' ? 'green' : 'red'};">${sign}${transaction.amount.toFixed(2)} ${currencySymbol}</span></div>`;

        if (showTimestamp && transaction.timestamp) {
            const date = new Date(transaction.timestamp);
            const formattedDate = date.toLocaleDateString('ru-RU');
            const formattedTime = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            mainInfo += `<div class="date">${formattedDate} ${formattedTime}</div>`;
        }

        li.innerHTML = mainInfo;
        listElement.appendChild(li);
    }

    openForm(containerId) {
        document.querySelectorAll('.form-container').forEach(c => c.classList.remove('active'));
        document.getElementById(containerId).classList.add('active');
    }

    openFormWithGoalCheck(containerId) {
        if (!this.currentGoal) {
            this.showNotification('Пожалуйста, сначала установите цель!', 'error');
            return;
        }
        this.openForm(containerId);
    }

    async handleGoalSubmit(form) {
        const selectedDateStr = form.querySelector('#goal-date-input').value;
        if (!selectedDateStr) {
            this.showNotification('Пожалуйста, выберите дату.', 'error');
            return;
        }
        const selectedDate = new Date(selectedDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            this.showNotification('Дата цели не может быть в прошлом.', 'error');
            return;
        }

        const amount = parseFloat(form.querySelector('#goal-amount-input').value);
        if (amount <= 0) {
            this.showNotification('Сумма цели должна быть положительной.', 'error');
            return;
        }

        const goalData = {
            name: form.querySelector('#goal-name-input').value,
            amount,
            currency: form.querySelector('#goal-currency-input').value,
            date: selectedDateStr
        };

        try {
            const updatedGoal = await saveGoal(goalData);
            this.currentGoal = updatedGoal;
            this.currentTransactions = [];
            this.updateUI();
            form.closest('.form-container').classList.remove('active');
            this.showNotification('Цель успешно сохранена!', 'success');
        } catch(e) {
            console.error('Ошибка сохранения цели:', e);
            this.showNotification('Ошибка сохранения цели.', 'error');
        }
    }

    async handleTransactionSubmit(form, type) {
        const amountInput = form.querySelector(type === 'EXPENSE' ? '#expense-amount-input' : '#income-amount-input');
        const amount = parseFloat(amountInput.value);
        if (amount <= 0) {
            this.showNotification('Сумма должна быть положительной.', 'error');
            return;
        }
        const transactionData = {
            amount,
            type,
            category: type === 'EXPENSE' ? form.querySelector('#expense-category-input').value : 'income',
            description: form.querySelector(type === 'EXPENSE' ? '#expense-description-input' : '#income-description-input').value,
        };

        try {
            const newTransaction = await saveTransaction(transactionData);
            this.currentTransactions.push(newTransaction);
            this.updateUI();
            form.closest('.form-container').classList.remove('active');
            this.showNotification(`Добавлен ${type === 'EXPENSE' ? 'расход' : 'доход'}!`, 'success');
        } catch(e) { console.error(e); this.showNotification('Ошибка сохранения транзакции.', 'error');}
    }

    handleExpenseSubmit(form) { this.handleTransactionSubmit(form, 'EXPENSE'); }
    handleIncomeSubmit(form) { this.handleTransactionSubmit(form, 'INCOME'); }

    showDeleteConfirmation() {
        if (!this.currentGoal) {
            this.showNotification('Нет цели для удаления.', 'error');
            return;
        }
        document.getElementById('modal-text').textContent = 'Вы уверены, что хотите удалить цель? Вся история транзакций также будет очищена.';
        this.confirmationModal.classList.add('active');

        const newConfirmBtn = this.modalConfirmBtn.cloneNode(true);
        this.modalConfirmBtn.parentNode.replaceChild(newConfirmBtn, this.modalConfirmBtn);
        this.modalConfirmBtn = newConfirmBtn;

        this.modalConfirmBtn.addEventListener('click', async () => {
            try {
                await deleteGoal();
                this.currentGoal = null;
                this.currentTransactions = [];
                this.updateUI();
                this.confirmationModal.classList.remove('active');
                this.showNotification('Цель успешно удалена.', 'success');
            } catch (error) {
                console.error("Failed to delete goal:", error);
                this.showNotification('Ошибка удаления цели.', 'error');
            }
        });
    }

    populateConverterSelects() {
        const currencies = Object.keys(this.exchangeRates);
        this.converterCurrency1.innerHTML = '';
        this.converterCurrency2.innerHTML = '';
        currencies.forEach(currency => {
            const option1 = document.createElement('option');
            option1.value = currency;
            option1.textContent = currency;
            this.converterCurrency1.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = currency;
            option2.textContent = currency;
            this.converterCurrency2.appendChild(option2);
        });
        this.converterCurrency1.value = 'USD';
        this.converterCurrency2.value = 'BYN';
        this.converterAmount1.value = 1;
        this.handleConversion();
    }

    handleConversion() {
        const amount = parseFloat(this.converterAmount1.value);
        const fromCurrency = this.converterCurrency1.value;
        const toCurrency = this.converterCurrency2.value;

        if (isNaN(amount) || !this.exchangeRates[fromCurrency] || !this.exchangeRates[toCurrency]) {
            this.converterAmount2.value = '';
            return;
        }

        const amountInByn = fromCurrency === 'BYN' ? amount : (amount * this.exchangeRates[fromCurrency].buy);
        const result = toCurrency === 'BYN' ? amountInByn : (amountInByn / this.exchangeRates[toCurrency].sell);

        this.converterAmount2.value = result.toFixed(4);
    }

    async fetchCurrencyRates() {
        try {
            const response = await fetch('/api/currency');
            if (!response.ok) throw new Error('Network response failed');
            const ratesData = await response.json();

            if (ratesData && ratesData.length > 0) {
                this.exchangeRates = {
                    'BYN': { buy: 1, sell: 1 },
                    'USD': { buy: parseFloat(ratesData[0].USD_in), sell: parseFloat(ratesData[0].USD_out) },
                    'EUR': { buy: parseFloat(ratesData[0].EUR_in), sell: parseFloat(ratesData[0].EUR_out) },
                    'RUB': { buy: parseFloat(ratesData[0].RUB_in) / 100, sell: parseFloat(ratesData[0].RUB_out) / 100 },
                    'CNY': { buy: parseFloat(ratesData[0].CNY_in) / 10, sell: parseFloat(ratesData[0].CNY_out) / 10 }
                };

                this.currencyTableBody.innerHTML = `
                    <tr><td>USD</td><td>${this.exchangeRates.USD.buy.toFixed(4)}</td><td>${this.exchangeRates.USD.sell.toFixed(4)}</td></tr>
                    <tr><td>EUR</td><td>${this.exchangeRates.EUR.buy.toFixed(4)}</td><td>${this.exchangeRates.EUR.sell.toFixed(4)}</td></tr>
                    <tr><td>RUB (100)</td><td>${(this.exchangeRates.RUB.buy * 100).toFixed(4)}</td><td>${(this.exchangeRates.RUB.sell * 100).toFixed(4)}</td></tr>
                    <tr><td>CNY (10)</td><td>${(this.exchangeRates.CNY.buy * 10).toFixed(4)}</td><td>${(this.exchangeRates.CNY.sell * 10).toFixed(4)}</td></tr>
                `;
                this.populateConverterSelects();
            } else {
                throw new Error('No exchange rate data found');
            }
        } catch (error) {
            console.error('Failed to fetch currency rates:', error);
            this.currencyTableBody.innerHTML = `<tr><td colspan="3">Не удалось загрузить курсы.</td></tr>`;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.getElementById('notifications-container').appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.container')) {
        new App();
    }
});