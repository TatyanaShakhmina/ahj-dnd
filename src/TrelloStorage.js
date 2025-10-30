export class TrelloStorage {
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