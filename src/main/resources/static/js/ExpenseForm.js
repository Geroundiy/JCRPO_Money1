export default class ExpenseForm {
    constructor(goalProgress, piggyBank, notificationManager, currentGoal, expenses) {
        this.formContainer = document.getElementById('expense-form-container');
        this.form = document.getElementById('expense-form');
        this.expenseBtn = document.getElementById('expense-btn');
        this.goalProgress = goalProgress;
        this.piggyBank = piggyBank;
        this.notificationManager = notificationManager;
        this.currentGoal = currentGoal;
        this.expenses = expenses;
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.expenseBtn.addEventListener('click', () => this.toggle());
        this.form.addEventListener('submit', e => this.handleSubmit(e));
    }
    toggle() {
        const isExp = this.formContainer.classList.toggle('form-container--expanded');
        document.getElementById('goal-form-container').classList.remove('form-container--expanded');
        if (isExp) this.formContainer.scrollIntoView({ behavior: 'smooth' });
    }
    handleSubmit(e) {
        e.preventDefault();
        const amount = parseInt(document.getElementById('expense-amount').value);
        const category = document.getElementById('expense-category').value;
        const description = document.getElementById('expense-description').value;
        this.expenses.push({ amount, category, description, date: new Date() });
        this.currentGoal.savedAmount -= amount;
        this.addExpenseToList(amount, category, description);
        this.goalProgress.update(this.currentGoal);
        this.piggyBank.updateFillLevel((this.currentGoal.savedAmount / this.currentGoal.targetAmount) * 100);
        this.formContainer.classList.remove('form-container--expanded');
        this.notificationManager.show('Расход успешно добавлен!', 'success');
        this.form.reset();
    }
    addExpenseToList(amount, category, description) {
        const list = document.getElementById('today-expenses');
        const names = {
            food: 'Еда',
            transport: 'Транспорт',
            entertainment: 'Развлечения',
            utilities: 'Коммунальные услуги',
            health: 'Здоровье',
            other: 'Другое'
        };
        const li = document.createElement('li');
        li.className = 'expense-item';
        li.innerHTML = `
      <div>
        <span class="expense-item__category">${names[category] || 'Другое'}</span>
        <p>${description}</p>
      </div>
      <span class="expense-amount">-${amount.toLocaleString('ru-RU')} ₽</span>`;
        list.appendChild(li);
    }
}
