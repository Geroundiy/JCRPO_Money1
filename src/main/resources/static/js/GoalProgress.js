export default class GoalProgress {
    constructor() {
        this.progressFill = document.getElementById('progress-fill');
        this.goalTitle = document.getElementById('goal-title');
        this.savedAmount = document.getElementById('saved-amount');
        this.totalAmount = document.getElementById('total-amount');
        this.deadline = document.getElementById('deadline');
        this.goalStatus = document.getElementById('goal-status');
    }
    update(goal) {
        const pct = (goal.savedAmount / goal.targetAmount) * 100;
        this.progressFill.style.width = `${pct}%`;
        this.goalTitle.textContent = goal.name;
        this.savedAmount.textContent = `${goal.savedAmount.toLocaleString('ru-RU')} ₽`;
        this.totalAmount.textContent = `${goal.targetAmount.toLocaleString('ru-RU')} ₽`;
        this.deadline.textContent = `Дедлайн: ${this.formatDate(goal.deadline)}`;
        this.updateGoalStatus();
    }
    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('ru-RU');
    }
    updateGoalStatus() {
        const days = this.calculateDaysChange();
        this.goalStatus.textContent =
            days > 0
                ? `Ваша цель приблизилась на ${days} дней из-за сегодняшних трат`
                : `Ваша цель отдалилась на ${Math.abs(days)} дней из-за сегодняшних трат`;
    }
    calculateDaysChange() {
        return Math.floor(Math.random() * 5) - 2;
    }
}
