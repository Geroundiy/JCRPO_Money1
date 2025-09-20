import NotificationManager from './NotificationManager.js';
import PiggyBank from './PiggyBank.js';
import GoalProgress from './GoalProgress.js';
import GoalForm from './GoalForm.js';
import ExpenseForm from './ExpenseForm.js';

document.addEventListener('DOMContentLoaded', () => {
    const notificationManager = new NotificationManager();
    const piggyBank = new PiggyBank();
    const goalProgress = new GoalProgress();

    const currentGoal = {
        name: 'Новая машина',
        targetAmount: 800000,
        savedAmount: 150000,
        deadline: '2023-12-15'
    };
    const expenses = [
        { amount: 1500, category: 'food', description: 'Обед в ресторане', date: new Date() },
        { amount: 450, category: 'transport', description: 'Такси до работы', date: new Date() }
    ];

    new GoalForm(goalProgress, piggyBank, notificationManager, currentGoal);
    new ExpenseForm(goalProgress, piggyBank, notificationManager, currentGoal, expenses);

    goalProgress.update(currentGoal);
    piggyBank.updateFillLevel((currentGoal.savedAmount / currentGoal.targetAmount) * 100);

    setTimeout(() => notificationManager.show('Вы не вносили расходы сегодня', 'info'), 2000);
});
