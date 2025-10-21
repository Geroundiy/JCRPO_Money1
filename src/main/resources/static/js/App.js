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

        // Подсказка пользователю, где добавить цель — показываем однократно, если цели нет
        try {
            if (!this.currentGoal) {
                const hintKey = 'hint_add_goal_shown_v1';
                if (!localStorage.getItem(hintKey)) {
                    this.showNotification('Подсказка: чтобы добавить цель — нажмите кнопку меню внизу (кнопка открытия меню).', 'info');
                    localStorage.setItem(hintKey, '1');
                }
            }
        } catch (e) {
            // localStorage может быть недоступен — игнорируем
            console.warn('Не удалось проверить/установить подсказку в localStorage', e);
        }
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

            // реальный процент (может быть >100)
            const realPercent = goalAmount > 0 ? ((totalCollected / goalAmount) * 100) : 0;
            const displayPercent = Number.isFinite(realPercent) ? realPercent : 0;

            this.goalTitleEl.textContent = `Накопления на "${this.currentGoal.name}"`;
            this.progressTextEl.textContent = `${totalCollected.toFixed(2)} ${currencySymbol} / ${goalAmount.toFixed(2)} ${currencySymbol}`;
            this.progressPercentageEl.textContent = `${displayPercent.toFixed(1)}% накоплено`;
            // Для визуала ограничиваем до 100%, а значение текста может превышать 100%
            this.progressFillEl.style.width = `${Math.min(displayPercent, 100)}%`;
            if (this.piggyBankFillEl) {
                const fillPercentForPiggy = Math.min(displayPercent, 100);
                this.piggyBankFillEl.style.clipPath = `inset(${100 - fillPercentForPiggy}% 0 0 0)`;
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

        // Проверка: не уйдём ли в минус (только для расходов)
        if (type === 'EXPENSE') {
            const totalCollectedNow = this.currentTransactions.reduce((acc, t) => {
                const amt = Number(t.amount) || 0;
                return t.type === 'INCOME' ? acc + amt : acc - amt;
            }, 0);
            if (totalCollectedNow - amount < 0) {
                this.showNotification('Ошибка: нельзя уйти в минус на копилке.', 'error');
                return; // блокируем сохранение транзакции
            }
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
        // Логируем полностью (для отладки в devtools)
        try { console.debug('Raw currency data:', ratesData); } catch (e) {}

        // Если сервер вдруг вернул строку — пробуем распарсить
        if (typeof ratesData === 'string') {
            const trimmed = ratesData.trim();
            // Попытка прямого JSON.parse
            try {
                ratesData = JSON.parse(trimmed);
            } catch (e) {
                // Если внутри строки есть JSON (например, HTML-обёртка), пытаемся вытащить { ... }
                const first = trimmed.indexOf('{');
                const last = trimmed.lastIndexOf('}');
                if (first !== -1 && last !== -1 && last > first) {
                    try {
                        ratesData = JSON.parse(trimmed.slice(first, last + 1));
                    } catch (err) {
                        // не удалось распарсить — оставляем строку
                        console.warn('Не удалось распарсить строковый ответ как JSON.', err);
                    }
                }
            }
        }

        // Функция для проверки, содержит ли узел нужные поля курсов
        const nodeLooksLikeRates = (node) => {
            if (!node || typeof node !== 'object') return false;
            const keys = Object.keys(node);
            // прямые поля USD_in / EUR_in / RUB_in / CNY_in
            if (keys.some(k => /^(USD|EUR|RUB|CNY)_in$/.test(k))) return true;
            // вложенный объект вида USD: { in: .., out: .. } или USD: { buy:.., sell:.. }
            if (keys.includes('USD') && typeof node.USD === 'object') {
                if (('in' in node.USD) || ('out' in node.USD) || ('buy' in node.USD) || ('sell' in node.USD)) return true;
            }
            // похожие альтернативы (buy/sell на верхнем уровне)
            if (keys.some(k => /(USD|EUR|RUB|CNY)/.test(k) && typeof node[k] === 'number')) return true;
            return false;
        };

        // Рекурсивный поиск подходящего узла в объекте/массиве
        const findRatesNode = (obj, visited = new Set()) => {
            if (!obj || typeof obj !== 'object') return null;
            if (visited.has(obj)) return null;
            visited.add(obj);

            if (Array.isArray(obj)) {
                for (const item of obj) {
                    const found = findRatesNode(item, visited);
                    if (found) return found;
                }
                return null;
            } else {
                if (nodeLooksLikeRates(obj)) return obj;
                // часто API кладёт курсы в поле 'data', 'rates', 'exchange' — проверим их в первую очередь
                for (const candidateKey of ['data', 'rates', 'exchange', 'kurs', 'branches']) {
                    if (obj[candidateKey]) {
                        const found = findRatesNode(obj[candidateKey], visited);
                        if (found) return found;
                    }
                }
                // иначе рекурсивно в значения
                for (const val of Object.values(obj)) {
                    const found = findRatesNode(val, visited);
                    if (found) return found;
                }
                return null;
            }
        };

        const toNum = (v) => {
            if (v === null || v === undefined || String(v).trim() === '') return NaN;
            const n = Number(String(v).replace(',', '.').replace(/\s+/g, ''));
            return Number.isFinite(n) ? n : NaN;
        };

        // Найдём узел с курсами
        const ratesNode = findRatesNode(ratesData);
        if (!ratesNode) {
            console.error('Не найден узел с курсами в ответе API. Пример ответа (усечённо):', (typeof ratesData === 'string' ? ratesData.slice(0, 1000) : JSON.stringify(ratesData).slice(0, 1000)));
            if (this.currencyTableBody) this.currencyTableBody.innerHTML = `<tr><td colspan="3">Ошибка формата данных от API.</td></tr>`;
            this.populateConverterSelects();
            // подсказка пользователю/разработчику: откройте DevTools -> Console -> найдите "Raw currency data"
            this.showNotification('Не удалось распознать формат ответа от API. Откройте консоль (F12) и пришлите первый лог "Raw currency data".', 'error');
            return;
        }

        // Поддерживаем оба варианта: USD_in/USD_out или USD: { in/out } или USD: { buy/sell }
        const extractValue = (node, code, dir) => {
            // dir: 'in' или 'out' или 'buy'/'sell'
            // Популярные имена:
            const candidates = [
                `${code}_in`, `${code}_out`,
                code, // may be object
            ];
            // прямые поля like USD_in
            if (node[`${code}_in`] !== undefined && node[`${code}_out`] !== undefined) {
                return { buy: toNum(node[`${code}_in`]), sell: toNum(node[`${code}_out`]) };
            }
            // вложенный объект USD: { in, out } или { buy, sell }
            if (node[code] && typeof node[code] === 'object') {
                const inner = node[code];
                const buy = inner.in ?? inner.buy ?? inner.buy_rate ?? inner.rate_in ?? inner.rateBuy ?? inner.purchase;
                const sell = inner.out ?? inner.sell ?? inner.sell_rate ?? inner.rate_out ?? inner.rateSell ?? inner.sale;
                return { buy: toNum(buy), sell: toNum(sell) };
            }
            // иногда ключи находятся как USD_in и USD_out под другим именем в узле (например, в массиве элементов) — попробуем найти везде в узле
            const buyKey = Object.keys(node).find(k => new RegExp(`^${code}(_|\\W)?(in|buy|purchase|rate_in)$`, 'i').test(k));
            const sellKey = Object.keys(node).find(k => new RegExp(`^${code}(_|\\W)?(out|sell|sale|rate_out)$`, 'i').test(k));
            if (buyKey || sellKey) {
                return { buy: toNum(buyKey ? node[buyKey] : undefined), sell: toNum(sellKey ? node[sellKey] : undefined) };
            }
            // не найдено
            return { buy: NaN, sell: NaN };
        };

        const rawRates = {
            USD: extractValue(ratesNode, 'USD'),
            EUR: extractValue(ratesNode, 'EUR'),
            RUB: extractValue(ratesNode, 'RUB'),
            CNY: extractValue(ratesNode, 'CNY')
        };

        const normalized = { BYN: { buy: 1, sell: 1 } };
        for (const [code, val] of Object.entries(rawRates)) {
            if (val && Number.isFinite(val.buy) && Number.isFinite(val.sell)) {
                normalized[code] = val;
            } else {
                console.warn(`Курс для ${code} не найден или не числовой в обнаруженном узле. Значение:`, val);
            }
        }

        // Если не нашлось ни одной валюы — сообщаем
        if (Object.keys(normalized).length <= 1) {
            console.error('В нормализованные курсы ничего полезного не попало:', normalized);
            if (this.currencyTableBody) this.currencyTableBody.innerHTML = `<tr><td colspan="3">Курсы валют временно недоступны.</td></tr>`;
            this.populateConverterSelects();
            this.showNotification('Невозможно распознать курсы валют в ответе API. Проверьте консоль.', 'error');
            return;
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
            // Попробуем получить текст, потому что иногда сервер отдает JSON в тексте или с неверным заголовком
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                // оставляем как строку (processAndDisplayRates попытается распарсить)
                data = text;
            }
            // Кладём примерно для отладки
            localStorage.setItem('currencyRatesCache', JSON.stringify(data));
            this.processAndDisplayRates(data);
        } catch (error) {
            console.warn('⚠️ Не удалось загрузить курсы валют из сети:', error);
            this.showNotification('Нет соединения. Загружены последние курсы (если есть).', 'info');

            const cachedData = localStorage.getItem('currencyRatesCache');
            if (cachedData) {
                try {
                    this.processAndDisplayRates(JSON.parse(cachedData));
                } catch (e) {
                    console.error('Ошибка чтения кэша курсов:', e);
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
            if (currency === 'BYN') return 1;
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