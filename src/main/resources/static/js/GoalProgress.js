export class GoalProgress {
    constructor() {
        this.progressFill = document.getElementById('progress-fill');
        this.goalTitle = document.getElementById('goal-title');
        this.savedAmount = document.getElementById('saved-amount');
        this.totalAmount = document.getElementById('total-amount');
        this.deadline = document.getElementById('deadline');
        this.goalStatus = document.getElementById('goal-status');
    }

    update(currentGoal) {
        const percentage = (currentGoal.savedAmount / currentGoal.targetAmount) * 100;
        this.progressFill.style.width = `${percentage}%`;

        this.goalTitle.textContent = currentGoal.name;
        this.savedAmount.textContent = `${currentGoal.savedAmount.toLocaleString('ru-RU')} ₽`;
        this.totalAmount.textContent = `${currentGoal.targetAmount.toLocaleString('ru-RU')} ₽`;
        this.deadline.textContent = `Дедлайн: ${this.formatDate(currentGoal.deadline)}`;

        this.updateGoalStatus(currentGoal);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }

    updateGoalStatus(currentGoal) {
        // Здесь можно добавить более сложную логику
        const dailyRate = currentGoal.targetAmount / this.getDaysDifference(currentGoal.deadline);
        const savedSoFar = currentGoal.savedAmount;
        const daysAhead = Math.floor(savedSoFar / dailyRate);

        if (daysAhead > 0) {
            this.goalStatus.textContent = `Ваша цель приблизилась на ${daysAhead} дней. 🎉`;
        } else if (daysAhead < 0) {
            this.goalStatus.textContent = `Ваша цель отдалилась на ${Math.abs(daysAhead)} дней. 😢`;
        } else {
            this.goalStatus.textContent = `Вы идёте по плану! 💪`;
        }
    }

    getDaysDifference(deadline) {
        const now = new Date();
        const futureDate = new Date(deadline);
        const diffInTime = futureDate.getTime() - now.getTime();
        return Math.max(1, Math.ceil(diffInTime / (1000 * 3600 * 24)));
    }
}