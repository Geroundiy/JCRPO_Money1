// src/main/resources/static/js/App.js
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
        this.piggyBankFillEl = document.getElementById('fill-rect') || null;
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
        document.getElementById('income-btn')?.addEventListener('click', () => this.openFormWithGoalCheck('income-form-container'));
        document.getElementById('expense-btn')?.addEventListener('click', () => this.openFormWithGoalCheck('expense-form-container'));
        document.getElementById('goal-btn')?.addEventListener('click', () => this.openForm('goal-form-container'));
        document.getElementById('delete-goal-btn')?.addEventListener('click', () => this.showDeleteConfirmation());
        document.getElementById('converter-btn')?.addEventListener('click', () => this.openForm('converter-form-container'));

        this.setupForm('goal-form-container', this.handleGoalSubmit);
        this.setupForm('expense-form-container', this.handleExpenseSubmit);
        this.setupForm('income-form-container', this.handleIncomeSubmit);
        this.setupForm('converter-form-container', () => {}); // Конвертер обрабатывается отдельно

        this.modalCancelBtn?.addEventListener('click', () => {
            if (this.confirmationModal) this.confirmationModal.classList.remove('active');
        });
        this.converterAmount1?.addEventListener('input', () => this.handleConversion());
        this.converterCurrency1?.addEventListener('change', () => this.handleConversion());
        this.converterCurrency2?.addEventListener('change', () => this.handleConversion());
    }

    setupForm(containerId, submitHandler) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.querySelector('.close-btn')?.addEventListener('click', () => container.classList.remove('active'));
        const form = container.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                submitHandler.call(this, form);
            });
        }
    }

    async loadInitialData() {
        try {
            const storedData = sessionStorage.getItem('userData');
            let data = storedData ? JSON.parse(storedData) : await getFullData();
            sessionStorage.removeItem('userData');

            if (data) {
                this.currentGoal = data.goal || null;
                this.currentTransactions = data.transactions || [];
                this.updateUI();
            }
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.showNotification('Ошибка загрузки данных.', 'error');
        }
        this.fetchCurrencyRates();
    }

    updateUI() {
        if (!this.goalTitleEl || !this.progressTextEl || !this.progressPercentageEl || !this.progressFillEl) {
            return;
        }
        if (!this.currentGoal) {
            this.goalTitleEl.textContent = 'Цель не установлена';
            this.progressTextEl.textContent = 'Пожалуйста, добавьте цель';
            this.progressPercentageEl.textContent = '';
            this.progressFillEl.style.width = '0%';
            if (this.piggyBankFillEl) {
                this.piggyBankFillEl.style.clipPath = 'inset(100% 0 0 0)';
            }
        } else {
            const totalCollected = this.currentTransactions.reduce((acc, t) => {
                const amt = Number(t.amount) || 0;
                return t.type === 'INCOME' ? acc + amt : acc - amt;
            }, 0);
            const goalAmount = Number(this.currentGoal.amount) || 0;
            const currencySymbol = this.currencySymbols[this.currentGoal.currency] || '';
            const progressPercent = goalAmount > 0 ?
                Math.max(0, Math.min(100, (totalCollected / goalAmount) * 100)) : 0;
            this.goalTitleEl.textContent = `Накопления на "${this.currentGoal.name}"`;
            this.progressTextEl.textContent = `${totalCollected.toFixed(2)} ${currencySymbol} / ${goalAmount.toFixed(2)} ${currencySymbol}`;
            this.progressPercentageEl.textContent = `${progressPercent.toFixed(1)}% накоплено`;
            this.progressFillEl.style.width = `${progressPercent}%`;
            if (this.piggyBankFillEl) {
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
        const todayExpenses = this.currentTransactions.filter(t => t.type === 'EXPENSE' && t.date === today);
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
            .sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));
        if (allIncomes.length === 0) {
            this.incomesListEl.innerHTML = '<li>История доходов пуста.</li>';
            return;
        }
        allIncomes.forEach(inc => this.renderTransaction(inc, this.incomesListEl, true));
    }

    renderTransaction(transaction, listElement, showTimestamp = false) {
        const li = document.createElement('li');
        const currencySymbol = this.currencySymbols[this.currentGoal?.currency] || 'Br';
        const sign = transaction.type === 'INCOME' ? '+' : '-';
        const description = transaction.description || (transaction.type === 'INCOME' ? 'Доход' : transaction.category || 'Расход');
        const amount = Number(transaction.amount) || 0;
        const color = sign === '+' ? 'green' : 'red';
        let mainInfo = `<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;"><span>${description}</span><span style="color:${color};font-weight:600;">${sign}${amount.toFixed(2)} ${currencySymbol}</span></div>`;
        if (showTimestamp && (transaction.timestamp || transaction.date)) {
            const d = new Date(transaction.timestamp || transaction.date);
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
        document.getElementById(containerId)?.classList.add('active');
    }

    openFormWithGoalCheck(containerId) {
        if (!this.currentGoal) {
            this.showNotification('Пожалуйста, сначала установите цель!', 'error');
            return;
        }
        this.openForm(containerId);
    }

    async handleGoalSubmit(form) {
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
        const name = form.querySelector('#goal-name-input')?.value.trim();
        const currency = form.querySelector('#goal-currency-input')?.value || 'BYN';
        if (!name) {
            this.showNotification('Введите название цели.', 'error');
            return;
        }
        const goalData = { name, amount, currency, date: selectedDateStr };
        try {
            const updatedGoal = await saveGoal(goalData);
            this.currentGoal = updatedGoal || goalData;
            this.currentTransactions = [];
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
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        };
        try {
            const newTransaction = await saveTransaction(transactionData);
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
        document.getElementById('modal-text').textContent = 'Вы уверены, что хотите удалить цель? Вся история транзакций также будет очищена.';
        this.confirmationModal?.classList.add('active');

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
                console.error('Failed to delete goal:', error);
                this.showNotification('Ошибка удаления цели.', 'error');
            }
        }, { once: true });
    }

    processAndDisplayRates(ratesData) {
        // УЛУЧШЕННАЯ ЛОГИКА:
        if (!Array.isArray(ratesData) || ratesData.length === 0) {
            console.error("API вернул невалидные данные (не массив или пустой массив):", ratesData);
            if (this.currencyTableBody) this.currencyTableBody.innerHTML = `<tr><td colspan="3">Ошибка формата данных от API.</td></tr>`;
            this.populateConverterSelects();
            return;
        }

        // 1. Сначала пытаемся найти идеальный объект с курсами доллара в [0] элементе.
        let ratesSource = (ratesData[0] && ratesData[0].USD_in) ? ratesData[0] : null;

        // 2. Если в первом элементе нет курсов, ищем в остальных.
        if (!ratesSource) {
            ratesSource = ratesData.find(item => item && item.USD_in && item.USD_out);
        }

        // 3. Если после всех попыток ничего не найдено, выводим сообщение.
        if (!ratesSource) {
            console.error("Не удалось найти валидный объект с курсами в ответе API:", ratesData);
            if (this.currencyTableBody) this.currencyTableBody.innerHTML = `<tr><td colspan="3">Курсы валют временно недоступны.</td></tr>`;
            this.populateConverterSelects();
            return;
        }

        const toNum = (v) => {
            if (v === null || v === undefined || String(v).trim() === '') return NaN;
            const n = Number(String(v).replace(',', '.'));
            return Number.isFinite(n) ? n : NaN;
        };

        const rates = {
            USD: { buy: toNum(ratesSource.USD_in), sell: toNum(ratesSource.USD_out) },
            EUR: { buy: toNum(ratesSource.EUR_in), sell: toNum(ratesSource.EUR_out) },
            RUB: { buy: toNum(ratesSource.RUB_in), sell: toNum(ratesSource.RUB_out) },
            CNY: { buy: toNum(ratesSource.CNY_in), sell: toNum(ratesSource.CNY_out) }
        };

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
        if (normalized.RUB) rows.push(`<tr><td>RUB (100)</td><td>${normalized.RUB.buy.toFixed(4)}</td><td>${normalized.RUB.sell.toFixed(4)}</td></tr>`);
        if (normalized.CNY) rows.push(`<tr><td>CNY (10)</td><td>${normalized.CNY.buy.toFixed(4)}</td><td>${normalized.CNY.sell.toFixed(4)}</td></tr>`);

        if (this.currencyTableBody) {
            this.currencyTableBody.innerHTML = rows.length ? rows.join('') : `<tr><td colspan="3">Курсы не найдены.</td></tr>`;
        }

        this.populateConverterSelects();
    }

    async fetchCurrencyRates() {
        try {
            const response = await fetch('/api/currency', { cache: 'no-store', credentials: 'include' });
            if (!response.ok) {
                throw new Error(`Сетевой ответ не был успешным (${response.status})`);
            }
            const data = await response.json();
            localStorage.setItem('currencyRatesCache', JSON.stringify(data));
            this.processAndDisplayRates(data);
        } catch (error) {
            console.warn('⚠️ Не удалось загрузить курсы валют из сети:', error);
            this.showNotification('Нет соединения. Загружены последние курсы.', 'info');

            const cachedData = localStorage.getItem('currencyRatesCache');
            if (cachedData) {
                try {
                    this.processAndDisplayRates(JSON.parse(cachedData));
                } catch (e) {
                    if (this.currencyTableBody) this.currencyTableBody.innerHTML = `<tr><td colspan="3">Ошибка чтения кэша.</td></tr>`;
                }
            } else {
                if (this.currencyTableBody) this.currencyTableBody.innerHTML = `<tr><td colspan="3">Не удалось загрузить курсы.</td></tr>`;
                this.populateConverterSelects();
            }
        }
    }

    populateConverterSelects() {
        if (!this.converterCurrency1 || !this.converterCurrency2) return;

        if (!this.exchangeRates.BYN) {
            this.exchangeRates.BYN = { buy: 1, sell: 1 };
        }

        const availableCurrencies = Object.keys(this.exchangeRates);
        this.converterCurrency1.innerHTML = '';
        this.converterCurrency2.innerHTML = '';

        availableCurrencies.forEach(currency => {
            this.converterCurrency1.add(new Option(currency, currency));
            this.converterCurrency2.add(new Option(currency, currency));
        });

        this.converterCurrency1.value = availableCurrencies.includes('USD') ? 'USD' : (availableCurrencies[0] || 'BYN');
        this.converterCurrency2.value = 'BYN';
        if(this.converterAmount1) this.converterAmount1.value = this.converterAmount1.value || 1;

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

        const getRate = (currency, type) => {
            let rate = this.exchangeRates[currency][type];
            if (currency === 'RUB') return rate / 100;
            if (currency === 'CNY') return rate / 10;
            return rate;
        };

        const fromRateBuy = getRate(fromCurrency, 'buy');
        const toRateSell = getRate(toCurrency, 'sell');

        const amountInByn = fromCurrency === 'BYN' ? amount : (amount * fromRateBuy);
        const result = toCurrency === 'BYN' ? amountInByn : (amountInByn / toRateSell);

        this.converterAmount2.value = Number.isFinite(result) ? result.toFixed(4) : '';
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications-container');
        if (!container) {
            console.warn('Контейнер для уведомлений не найден:', message);
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