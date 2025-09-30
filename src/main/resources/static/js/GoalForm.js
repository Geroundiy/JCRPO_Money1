export class GoalForm {
    constructor() {
        this.container = document.getElementById('goal-form-container');
        this.form = document.getElementById('goal-form');
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