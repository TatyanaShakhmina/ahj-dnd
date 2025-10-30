import { TrelloStorage } from './TrelloStorage.js';
import { CardDrag } from './CardDrag.js';

export class TrelloApp {
    constructor() {
        this.storage = new TrelloStorage();
        this.columns = document.querySelectorAll('.column');
        this.dragManager = new CardDrag(this.columns, this.storage);
        this.init();
    }

    init() {
        this.renderCards();

        this.columns.forEach(column => {
            const columnName = column.querySelector('h1').textContent;
            this.setupColumnHandlers(column, columnName);
        });
    }

    renderCards() {
        const data = this.storage.getData();

        this.columns.forEach(column => {
            const columnName = column.querySelector('h1').textContent;
            const cards = data[columnName] || [];

            const existingCards = column.querySelectorAll('.card');
            existingCards.forEach(card => card.remove());

            const form = column.querySelector('.form');
            cards.forEach(cardData => {
                const card = this.createCardElement(cardData, columnName);
                form.before(card);
            });
        });
    }

    createCardElement(cardData, columnName) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = cardData.id;
        card.draggable = true;

        const cardText = document.createElement('span');
        cardText.className = 'card-text';
        cardText.textContent = cardData.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'card-delete';
        deleteBtn.innerHTML = '&#10005;';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteCard(columnName, cardData.id);
        });

        card.append(cardText, deleteBtn);

        this.dragManager.setupDragHandlers(card);

        return card;
    }

    setupColumnHandlers(column, columnName) {
        const addBtn = column.querySelector('.add-card-btn');
        const form = column.querySelector('.form');
        const input = form.querySelector('.form-input');
        const cancelBtn = form.querySelector('.form-btn-cancel');

        addBtn.addEventListener('click', () => {
            form.classList.add('active');
            input.focus();
        });

        cancelBtn.addEventListener('click', () => {
            this.hideForm(form, input);
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = input.value.trim();

            if (text) {
                this.addCard(columnName, text);
                input.value = '';
                this.hideForm(form, input);
            }
        });

        document.addEventListener('click', (e) => {
            if (!column.contains(e.target)) {
                this.hideForm(form, input);
            }
        });
    }

    addCard(columnName, text) {
        this.storage.addCard(columnName, text);
        this.renderCards();
    }

    deleteCard(columnName, cardId) {
        this.storage.deleteCard(columnName, cardId);
        this.renderCards();
    }

    hideForm(form, input) {
        form.classList.remove('active');
        input.value = '';
    }
}