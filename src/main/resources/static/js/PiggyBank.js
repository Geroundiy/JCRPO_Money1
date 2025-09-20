export default class PiggyBank {
    constructor() {
        this.coinsElement = document.getElementById('piggy-coins');
    }
    updateFillLevel(percentage) {
        this.coinsElement.style.height = `${percentage}%`;
    }
}
