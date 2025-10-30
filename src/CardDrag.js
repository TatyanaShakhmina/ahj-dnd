export class CardDrag {
    constructor(columns, storage) {
        this.columns = columns;
        this.storage = storage;
        this.draggedCard = null;
        this.draggedElement = null;
        this.placeholder = null;
        this.shiftX = 0;
        this.shiftY = 0;
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
            document.body.append(this.draggedElement);

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
            form.before(this.placeholder);
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
            insertBeforeCard.before(this.placeholder);
        } else {
            const form = column.querySelector('.form');
            form.before(this.placeholder);
        }
    }

    onMouseUp = () => {
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);

        document.body.style.cursor = '';

        if (this.placeholder && this.placeholder.parentElement) {
            this.draggedCard.style.display = '';

            this.placeholder.before(this.draggedCard);
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
}