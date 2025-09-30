export class PiggyBank {
    constructor() {
        this.element = document.getElementById('piggy-bank');
    }

    update(progress) {
        // Увеличиваем прозрачность копилки по мере заполнения
        const opacity = Math.max(0.1, Math.min(1.0, progress / 100));
        this.element.style.opacity = opacity;

        // Масштабируем копилку, чтобы показать "наполнение"
        const scale = 1 + (progress / 100) * 0.2; // От 1.0 до 1.2
        this.element.style.transform = `translateX(-50%) scale(${scale})`;
    }
}