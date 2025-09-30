export class NotificationManager {
    constructor() {
        this.container = document.getElementById('notifications-container');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        this.container.appendChild(notification);

        // Удаляем уведомление после окончания анимации
        setTimeout(() => {
            notification.remove();
        }, 4000); // Должно быть больше, чем длительность animation
    }
}