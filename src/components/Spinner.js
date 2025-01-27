export class Spinner {
    constructor(container) {
        this.container = container;
    }

    show() {
        this.container.innerHTML = `
            <div class="spinner">
                <div class="bounce1"></div>
                <div class="bounce2"></div>
                <div class="bounce3"></div>
            </div>
        `;
        this.container.style.display = 'block';
    }

    hide() {
        this.container.style.display = 'none';
    }
} 