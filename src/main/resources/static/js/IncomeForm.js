export class IncomeForm {
    constructor() {
        this.container = document.getElementById('income-form-container');
        this.form = document.getElementById('income-form');
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