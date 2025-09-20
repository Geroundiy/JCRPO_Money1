export default class GoalForm {
    constructor(goalProgress, piggyBank, notificationManager, currentGoal) {
        this.formContainer = document.getElementById('goal-form-container');
        this.form = document.getElementById('goal-form');
        this.goalBtn = document.getElementById('goal-btn');
        this.goalProgress = goalProgress;
        this.piggyBank = piggyBank;
        this.notificationManager = notificationManager;
        this.currentGoal = currentGoal;
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.goalBtn.addEventListener('click', () => this.toggle());
        this.form.addEventListener('submit', e => this.handleSubmit(e));
    }
    toggle() {
        const isExp = this.formContainer.classList.toggle('form-container--expanded');
        document.getElementById('expense-form-container').classList.remove('form-container--expanded');
        if (isExp) this.formContainer.scrollIntoView({ behavior: 'smooth' });
    }
    handleSubmit(e) {
        e.preventDefault();
        this.currentGoal.name = document.getElementById('goal-name').value;
        this.currentGoal.targetAmount = parseInt(document.getElementById('goal-amount').value);
        this.currentGoal.deadline = document.getElementById('goal-deadline').value;
        this.goalProgress.update(this.currentGoal);
        this.piggyBank.updateFillLevel((this.currentGoal.savedAmount / this.currentGoal.targetAmount) * 100);
        this.formContainer.classList.remove('form-container--expanded');
        this.notificationManager.show('Цель успешно сохранена!', 'success');
        this.form.reset();
    }
}
