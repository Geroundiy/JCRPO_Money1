// src/main/resources/static/js/App.js
import { getFullData, saveGoal, saveTransaction, deleteGoal, logout } from './api.js';

class App {
    constructor() {
        this.currentGoal = null;
        this.currentTransactions = [];
        this.currencySymbols = { BYN: 'Br', USD: '$', EUR: '€', RUB: '₽', CNY: '¥' };
        this.exchangeRates = {}; // format: { "USD": { buy: Number, sell: Number }, ... }

        this.cacheDOMElements();
        this.bindGlobalEvents();
        this.loadInitialData();
    }

    cacheDOMElements() {
        this.goalTitleEl = document.getElementById('goal-title');
        this.progressFillEl = document.getElementById('progress-fill');
        this.progressTextEl = document.getElementById('progress-text');
        this.progressPercentageEl = document.getElementById('progress-percentage');
        // support both possible ids for piggy fill
        this.piggyBankFillEl = document.getElementById('piggy-bank-fill') || document.getElementById('fill-rect') || null;

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
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.addEventListener('click', logout);

        if (this.mainActionBtn && this.actionButtonsContainer) {
            this.mainActionBtn.addEventListener('click', () => this.actionButtonsContainer.classList.toggle('active'));
        }

        const incomeBtn = document.getElementById('income-btn');
        const expenseBtn = document.getElementById('expense-btn');
        const goalBtn = document.getElementById('goal-btn');
        const deleteGoalBtn = document.getElementById('delete-goal-btn');
        const converterBtn = document.getElementById('converter-btn');

        if (incomeBtn) incomeBtn.addEventListener('click', () => this.openFormWithGoalCheck('income-form-container'));
        if (expenseBtn) expenseBtn.addEventListener('click', () => this.openFormWithGoalCheck('expense-form-container'));
        if (goalBtn) goalBtn.addEventListener('click', () => this.openForm('goal-form-container'));
        if (deleteGoalBtn) deleteGoalBtn.addEventListener('click', () => this.showDeleteConfirmation());
        if (converterBtn) converterBtn.addEventListener('click', () => this.openForm('converter-form-container'));

        this.setupForm('goal-form-container', this.handleGoalSubmit);
        this.setupForm('expense-form-container', this.handleExpenseSubmit);
        this.setupForm('income-form-container', this.handleIncomeSubmit);
        this.setupForm('converter-form-container', () => {}); // converter handled inline

        if (this.modalCancelBtn) {
            this.modalCancelBtn.addEventListener('click', () => {
                if (this.confirmationModal) this.confirmationModal.classList.remove('active');
            });
        }

        if (this.converterAmount1) this.converterAmount1.addEventListener('input', () => this.handleConversion());
        if (this.converterCurrency1) this.converterCurrency1.addEventListener('change', () => this.handleConversion());
        if (this.converterCurrency2) this.converterCurrency2.addEventListener('change', () => this.handleConversion());
    }

    setupForm(containerId, submitHandler) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const closeBtn = container.querySelector('.close-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => container.classList.remove('active'));
        const form = container.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                // call submit handler with `this` context and pass form element
                submitHandler.call(this, form);
            });
        }
    }

    async loadInitialData() {
        try {
            const storedData = sessionStorage.getItem('userData');
            let data = null;
            if (storedData) {
                data = JSON.parse(storedData);
                sessionStorage.removeItem('userData');
            } else {
                data = await getFullData();
            }

            if (data) {
                this.currentGoal = data.goal || null;
                this.currentTransactions = data.transactions || [];
                this.updateUI();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showNotification('Ошибка загрузки данных.', 'error');
        }

        // fetch currency rates regardless
        this.fetchCurrencyRates().catch(() => {
            this.showNotification('Не удалось загрузить курсы валют', 'error');
        });
    }

    updateUI() {
        if (!this.goalTitleEl || !this.progressTextEl || !this.progressPercentageEl || !this.progressFillEl) {
            // if some essential elements missing — bail out
            return;
        }

        if (!this.currentGoal) {
            this.goalTitleEl.textContent = 'Цель не установлена';
            this.progressTextEl.textContent = 'Пожалуйста, добавьте цель';
            this.progressPercentageEl.textContent = '';
            this.progressFillEl.style.width = '0%';
            if (this.piggyBankFillEl) {
                // for rect y-attribute transition we might set y value - but previous implementation used clipPath
                // we'll try clipPath (works for our css)
                this.piggyBankFillEl.style.clipPath = 'inset(100% 0 0 0)';
            }
        } else {
            const totalCollected = this.currentTransactions.reduce((acc, t) => {
                const amt = Number(t.amount) || 0;
                return t.type === 'INCOME' ? acc + amt : acc - amt;
            }, 0);

            const goalAmount = Number(this.currentGoal.amount) || 0;
            const currencySymbol = this.currencySymbols[this.currentGoal.currency] || '';
            const progressPercent = goalAmount > 0 ? Math.max(0, Math.min(100, (totalCollected / goalAmount) * 100)) : 0;

            this.goalTitleEl.textContent = `Накопления на "${this.currentGoal.name}"`;
            this.progressTextEl.textContent = `${totalCollected.toFixed(2)} ${currencySymbol} / ${goalAmount.toFixed(2)} ${currencySymbol}`;
            this.progressPercentageEl.textContent = `${progressPercent.toFixed(1)}% накоплено`;
            this.progressFillEl.style.width = `${progressPercent}%`;
            if (this.piggyBankFillEl) {
                // clipPath expects percent of how much to hide from top: inset(top right bottom left)
                this.piggyBankFillEl.style.clipPath = `inset(${100 - progressPercent}% 0 0 0)`;
            }
        }

        this.renderTodaysExpenses();
        this.renderIncomeHistory();
    }

    renderTodaysExpenses() {
        if (!this.expensesListEl) return;
        this.expensesListEl.innerHTML = '';
        const today = new Date().toISOString().split('T')[0];
        const todayExpenses = this.currentTransactions.filter(t => t.type === 'EXPENSE' && (t.date ? t.date === today : false));

        if (todayExpenses.length === 0) {
            this.expensesListEl.innerHTML = '<li>Сегодня расходов нет.</li>';
            return;
        }
        todayExpenses.forEach(exp => this.renderTransaction(exp, this.expensesListEl));
    }

    renderIncomeHistory() {
        if (!this.incomesListEl) return;
        this.incomesListEl.innerHTML = '';
        const allIncomes = this.currentTransactions
            .filter(t => t.type === 'INCOME')
            .sort((a, b) => new Date(b.timestamp || b.date || 0) - new Date(a.timestamp || a.date || 0));

        if (allIncomes.length === 0) {
            this.incomesListEl.innerHTML = '<li>История доходов пуста.</li>';
            return;
        }
        allIncomes.forEach(inc => this.renderTransaction(inc, this.incomesListEl, true));
    }

    renderTransaction(transaction, listElement, showTimestamp = false) {
        const li = document.createElement('li');
        const currencySymbol = this.currencySymbols[this.currentGoal?.currency] || this.currencySymbols.BYN || '';
        const sign = transaction.type === 'INCOME' ? '+' : '-';
        const description = transaction.description || (transaction.type === 'INCOME' ? 'Доход' : (transaction.category || 'Расход'));

        // guard amount
        const amount = Number(transaction.amount) || 0;
        const color = sign === '+' ? 'green' : 'red';

        let mainInfo = `<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;"><span>${description}</span><span style="color:${color};font-weight:600;">${sign}${amount.toFixed(2)} ${currencySymbol}</span></div>`;

        if (showTimestamp && (transaction.timestamp || transaction.date)) {
            const d = transaction.timestamp ? new Date(transaction.timestamp) : new Date(transaction.date);
            if (!isNaN(d.getTime())) {
                const formattedDate = d.toLocaleDateString('ru-RU');
                const formattedTime = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                mainInfo += `<div class="date">${formattedDate} ${formattedTime}</div>`;
            }
        }

        li.innerHTML = mainInfo;
        listElement.appendChild(li);
    }

    openForm(containerId) {
        document.querySelectorAll('.form-container').forEach(c => c.classList.remove('active'));
        const el = document.getElementById(containerId);
        if (el) el.classList.add('active');
    }

    openFormWithGoalCheck(containerId) {
        if (!this.currentGoal) {
            this.showNotification('Пожалуйста, сначала установите цель!', 'error');
            return;
        }
        this.openForm(containerId);
    }

    async handleGoalSubmit(form) {
        // validate form fields
        const selectedDateStr = form.querySelector('#goal-date-input')?.value;
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

        const amount = parseFloat(form.querySelector('#goal-amount-input')?.value || '0');
        if (!(amount > 0)) {
            this.showNotification('Сумма цели должна быть положительной.', 'error');
            return;
        }

        const name = (form.querySelector('#goal-name-input')?.value || '').trim();
        const currency = form.querySelector('#goal-currency-input')?.value || 'BYN';
        if (!name) {
            this.showNotification('Введите название цели.', 'error');
            return;
        }

        const goalData = {
            name,
            amount,
            currency,
            date: selectedDateStr
        };

        try {
            const updatedGoal = await saveGoal(goalData);
            // backend may return the saved goal or partial; handle gracefully
            this.currentGoal = updatedGoal || goalData;
            this.currentTransactions = []; // new goal resets transactions locally
            this.updateUI();
            form.closest('.form-container')?.classList.remove('active');
            this.showNotification('Цель успешно сохранена!', 'success');
        } catch (e) {
            console.error('Ошибка сохранения цели:', e);
            this.showNotification('Ошибка сохранения цели.', 'error');
        }
    }

    async handleTransactionSubmit(form, type) {
        const amountInput = form.querySelector(type === 'EXPENSE' ? '#expense-amount-input' : '#income-amount-input');
        const amount = parseFloat(amountInput?.value || '0');
        if (!(amount > 0)) {
            this.showNotification('Сумма должна быть положительной.', 'error');
            return;
        }

        const transactionData = {
            amount,
            type,
            category: type === 'EXPENSE' ? (form.querySelector('#expense-category-input')?.value || 'other') : 'income',
            description: (form.querySelector(type === 'EXPENSE' ? '#expense-description-input' : '#income-description-input')?.value || '').trim(),
            date: new Date().toISOString().split('T')[0], // default date
            timestamp: new Date().toISOString()
        };

        try {
            const newTransaction = await saveTransaction(transactionData);
            // backend might return created transaction — fallback to local one
            this.currentTransactions.push(newTransaction || transactionData);
            this.updateUI();
            form.closest('.form-container')?.classList.remove('active');
            this.showNotification(`Добавлен ${type === 'EXPENSE' ? 'расход' : 'доход'}!`, 'success');
        } catch (e) {
            console.error('Ошибка сохранения транзакции:', e);
            this.showNotification('Ошибка сохранения транзакции.', 'error');
        }
    }

    handleExpenseSubmit(form) { this.handleTransactionSubmit(form, 'EXPENSE'); }
    handleIncomeSubmit(form) { this.handleTransactionSubmit(form, 'INCOME'); }

    showDeleteConfirmation() {
        if (!this.currentGoal) {
            this.showNotification('Нет цели для удаления.', 'error');
            return;
        }
        const modalText = document.getElementById('modal-text');
        if (modalText) modalText.textContent = 'Вы уверены, что хотите удалить цель? Вся история транзакций также будет очищена.';
        if (this.confirmationModal) this.confirmationModal.classList.add('active');

        // replace confirm handler to avoid double-binding
        const parent = this.modalConfirmBtn?.parentNode;
        if (!parent || !this.modalConfirmBtn) return;

        const newConfirmBtn = this.modalConfirmBtn.cloneNode(true);
        parent.replaceChild(newConfirmBtn, this.modalConfirmBtn);
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
                console.error('Failed to delete goal:', error);
                this.showNotification('Ошибка удаления цели.', 'error');
            }
        });
    }

    populateConverterSelects() {
        if (!this.converterCurrency1 || !this.converterCurrency2 || !this.converterAmount1) return;

        const currencies = Object.keys(this.exchangeRates);
        // Guarantee BYN exists
        if (!currencies.includes('BYN')) this.exchangeRates.BYN = { buy: 1, sell: 1 };

        this.converterCurrency1.innerHTML = '';
        this.converterCurrency2.innerHTML = '';
        Object.keys(this.exchangeRates).forEach(currency => {
            const option1 = document.createElement('option');
            option1.value = currency;
            option1.textContent = currency;
            this.converterCurrency1.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = currency;
            option2.textContent = currency;
            this.converterCurrency2.appendChild(option2);
        });

        // sensible defaults if available
        this.converterCurrency1.value = this.exchangeRates.USD ? 'USD' : Object.keys(this.exchangeRates)[0] || 'BYN';
        this.converterCurrency2.value = this.exchangeRates.BYN ? 'BYN' : Object.keys(this.exchangeRates)[0] || 'BYN';
        this.converterAmount1.value = this.converterAmount1.value || 1;
        this.handleConversion();
    }

    handleConversion() {
        if (!this.converterAmount1 || !this.converterCurrency1 || !this.converterCurrency2 || !this.converterAmount2) return;

        const amount = parseFloat(this.converterAmount1.value);
        const fromCurrency = this.converterCurrency1.value;
        const toCurrency = this.converterCurrency2.value;

        if (isNaN(amount) || !this.exchangeRates[fromCurrency] || !this.exchangeRates[toCurrency]) {
            this.converterAmount2.value = '';
            return;
        }

        // Interpret exchangeRates as BYN per 1 unit of foreign currency
        // amountInByn = amount * buy_rate_of_fromCurrency  (if fromCurrency != BYN)
        const fromRate = this.exchangeRates[fromCurrency];
        const toRate = this.exchangeRates[toCurrency];

        const amountInByn = fromCurrency === 'BYN' ? amount : (amount * (Number(fromRate.buy) || 0));
        const result = toCurrency === 'BYN' ? amountInByn : (amountInByn / (Number(toRate.sell) || 1));

        this.converterAmount2.value = Number.isFinite(result) ? result.toFixed(4) : '';
    }

    async fetchCurrencyRates() {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            const response = await fetch('/api/currency', {
                cache: 'no-store',
                signal: controller.signal,
                credentials: 'include'
            });
            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`Network response not ok (${response.status})`);
            }
            const data = await response.json();

            let ratesSource = data.find(item => item && item.USD_in && item.EUR_in);
            if (!ratesSource) {
                ratesSource = data.find(item => item && item.USD_in);
            }
            if (!ratesSource) {
                ratesSource = {};
            }

            const rates = { BYN: { buy: 1, sell: 1 } };
            const toNum = (v) => {
                if (v === null || v === undefined) return NaN;
                const n = Number(String(v).replace(',', '.'));
                return Number.isFinite(n) ? n : NaN;
            };

            rates.USD = { buy: toNum(ratesSource.USD_in), sell: toNum(ratesSource.USD_out) };
            rates.EUR = { buy: toNum(ratesSource.EUR_in), sell: toNum(ratesSource.EUR_out) };
            rates.RUB = { buy: toNum(ratesSource.RUB_in) / 100, sell: toNum(ratesSource.RUB_out) / 100 };
            rates.CNY = { buy: toNum(ratesSource.CNY_in) / 10, sell: toNum(ratesSource.CNY_out) / 10 };

            const normalized = { BYN: { buy: 1, sell: 1 } };
            for (const [code, val] of Object.entries(rates)) {
                if (val && Number.isFinite(val.buy) && Number.isFinite(val.sell)) {
                    normalized[code] = val;
                }
            }
            this.exchangeRates = normalized;

            const rows = [];
            if (normalized.USD) rows.push(`<tr><td>USD</td><td>${normalized.USD.buy.toFixed(4)}</td><td>${normalized.USD.sell.toFixed(4)}</td></tr>`);
            if (normalized.EUR) rows.push(`<tr><td>EUR</td><td>${normalized.EUR.buy.toFixed(4)}</td><td>${normalized.EUR.sell.toFixed(4)}</td></tr>`);
            if (normalized.RUB) rows.push(`<tr><td>RUB (100)</td><td>${(normalized.RUB.buy * 100).toFixed(4)}</td><td>${(normalized.RUB.sell * 100).toFixed(4)}</td></tr>`);
            if (normalized.CNY) rows.push(`<tr><td>CNY (10)</td><td>${(normalized.CNY.buy * 10).toFixed(4)}</td><td>${(normalized.CNY.sell * 10).toFixed(4)}</td></tr>`);

            if (this.currencyTableBody) {
                this.currencyTableBody.innerHTML = rows.length ? rows.join('') : `<tr><td colspan="3">Курсы недоступны</td></tr>`;
            }
            this.populateConverterSelects();
        } catch (error) {
            console.warn('⚠️ Не удалось загрузить курсы валют:', error);
            this.exchangeRates = { BYN: { buy: 1, sell: 1 } };
            if (this.currencyTableBody) {
                this.currencyTableBody.innerHTML = `<tr><td colspan="3">Не удалось загрузить курсы.</td></tr>`;
            }
            this.populateConverterSelects();
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications-container');
        if (!container) {
            console.warn('No notifications container in DOM:', message);
            return;
        }
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        container.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.container')) {
        new App();
    }
});