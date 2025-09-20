export default class NotificationManager {
    constructor() {
        this.notification = document.querySelector('.notification');
    }
    show(message, type = 'info') {
        const content = this.notification.querySelector('.notification-content');
        const icon = this.notification.querySelector('.notification__icon');
        content.textContent = message;
        this.notification.className = `notification notification--${type}`;
        icon.className =
            type === 'info'
                ? 'fas fa-info-circle notification__icon'
                : type === 'warning'
                    ? 'fas fa-exclamation-circle notification__icon'
                    : 'fas fa-check-circle notification__icon';
        this.notification.classList.add('notification--show');
        setTimeout(() => this.hide(), 3000);
    }
    hide() {
        this.notification.classList.remove('notification--show');
    }
}
