export class ExpenseForm {
    constructor() {
        this.container = document.getElementById('expense-form-container');
        this.form = document.getElementById('expense-form');
        this.closeBtn = this.container.querySelector('.close-btn');
        this.bindEvents();
    }

    bindEvents() {
        this.closeBtn.addEventListener('click', () => this.hide());
    }

    toggle() {
        this.container.classList.toggle('active');
    }

    hide() {
        this.container.classList.remove('active');
    }
}