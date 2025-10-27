import './style.css';

class TrelloStorage {
    constructor() {
        this.storageKey = 'trello-cards';
    }

    getData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : this.getDefaultData();
    }

    getDefaultData() {
        return {
            'TODO': [],
            'IN PROGRESS': [],
            'DONE': []
        };
    }

    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    addCard(columnName, cardText) {
        const data = this.getData();
        data[columnName].push({
            id: Date.now(),
            text: cardText
        });
        this.saveData(data);
    }

    deleteCard(columnName, cardId) {
        const data = this.getData();
        data[columnName] = data[columnName].filter(card => card.id !== cardId);
        this.saveData(data);
    }

    saveOrderFromDOM(columns) {
        const data = this.getDefaultData();

        columns.forEach(column => {
            const columnName = column.querySelector('h1').textContent;
            const cards = column.querySelectorAll('.card');

            data[columnName] = Array.from(cards).map(card => ({
                id: parseInt(card.dataset.id),
                text: card.querySelector('.card-text').textContent
            }));
        });

        this.saveData(data);
    }
}

class TrelloApp {
    constructor() {
        this.storage = new TrelloStorage();
        this.columns = document.querySelectorAll('.column');
        this.draggedCard = null;
        this.draggedElement = null;
        this.placeholder = null;
        this.shiftX = 0;
        this.shiftY = 0;
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
                column.insertBefore(card, form);
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

        card.appendChild(cardText);
        card.appendChild(deleteBtn);

        this.setupDragHandlers(card);

        return card;
    }

    setupDragHandlers(card) {
        card.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('card-delete')) {
                return;
            }

            e.preventDefault();

            this.draggedCard = card;
            const rect = card.getBoundingClientRect();

            this.shiftX = e.clientX - rect.left;
            this.shiftY = e.clientY - rect.top;

            this.placeholder = document.createElement('div');
            this.placeholder.className = 'card-placeholder';
            this.placeholder.style.height = rect.height + 'px';

            this.draggedElement = card.cloneNode(true);
            this.draggedElement.classList.add('dragging');
            this.draggedElement.style.width = rect.width + 'px';
            this.draggedElement.style.height = rect.height + 'px';
            document.body.appendChild(this.draggedElement);

            this.moveAt(e.clientX, e.clientY);

            card.style.display = 'none';
            card.after(this.placeholder);

            document.addEventListener('mousemove', this.onMouseMove);
            document.addEventListener('mouseup', this.onMouseUp);

            document.body.style.cursor = 'grabbing';
        });
    }

    onMouseMove = (e) => {
        this.moveAt(e.clientX, e.clientY);

        this.draggedElement.style.display = 'none';
        const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
        this.draggedElement.style.display = 'block';

        if (!elemBelow) return;

        const column = elemBelow.closest('.column');
        if (!column) return;

        const existingPlaceholder = column.querySelector('.card-placeholder');

        if (!existingPlaceholder && this.placeholder && this.placeholder.parentElement !== column) {
            const form = column.querySelector('.form');
            column.insertBefore(this.placeholder, form);
        }

        const cards = Array.from(column.querySelectorAll('.card:not(.dragging)'))
            .filter(card => card.style.display !== 'none');

        let insertBeforeCard = null;

        for (const card of cards) {
            const rect = card.getBoundingClientRect();
            const cardMiddle = rect.top + rect.height / 2;

            if (e.clientY < cardMiddle) {
                insertBeforeCard = card;
                break;
            }
        }

        if (insertBeforeCard) {
            column.insertBefore(this.placeholder, insertBeforeCard);
        } else {
            const form = column.querySelector('.form');
            column.insertBefore(this.placeholder, form);
        }
    }

    onMouseUp = () => {
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);

        document.body.style.cursor = '';

        if (this.placeholder && this.placeholder.parentElement) {
            this.draggedCard.style.display = '';

            this.placeholder.parentElement.insertBefore(this.draggedCard, this.placeholder);
            this.placeholder.remove();

            this.storage.saveOrderFromDOM(this.columns);
        }

        if (this.draggedElement) {
            this.draggedElement.remove();
            this.draggedElement = null;
        }

        this.draggedCard = null;
        this.placeholder = null;
    }

    moveAt(clientX, clientY) {
        if (!this.draggedElement) return;

        this.draggedElement.style.left = clientX - this.shiftX + 'px';
        this.draggedElement.style.top = clientY - this.shiftY + 'px';
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
                input.focus();
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

document.addEventListener('DOMContentLoaded', () => {
    new TrelloApp();
});