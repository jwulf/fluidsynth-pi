"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cursor = exports.Collection = void 0;
const uuid_1 = require("uuid");
class Collection {
    constructor(items, sortField) {
        this.sortField = sortField;
        this.items = [];
        this.cursors = [];
        items.forEach((item) => this.addItem(item, { sort: false }));
        this.sortItems();
    }
    addItem(item, { sort = true } = {}) {
        const isAlreadyCollectionItem = (item) => !!item.uuid;
        const newItem = isAlreadyCollectionItem(item)
            ? item
            : Object.assign(Object.assign({}, item), { uuid: uuid_1.v4() });
        this.items.push(newItem);
        if (sort) {
            this.sortItems();
            this.syncCursors();
        }
    }
    removeItem(element) {
        this.items = this.items.filter((e) => e.uuid !== element.uuid);
        this.syncCursors();
    }
    createCursor() {
        const cursor = new Cursor(this);
        this.cursors.push(cursor);
        return cursor;
    }
    getSize() {
        return this.items.length;
    }
    getItems() {
        return this.items;
    }
    _getItemByIndex(index) {
        return this.items[index];
    }
    /**
     *
     * If the item has been removed from the collection, returns -1
     */
    _getItemIndexByUUID(item) {
        return this.items.reduce((prev, curr, i) => (curr.uuid === item.uuid ? i : prev), -1);
    }
    syncCursors() {
        this.cursors.forEach((c) => c.sync());
    }
    sortItems() {
        if (!this.sortField) {
            return;
        }
        this.items.sort((a, b) => {
            const af = a[this.sortField];
            const bf = b[this.sortField];
            if (af === bf)
                return 0;
            return af < bf ? -1 : 1;
        });
    }
}
exports.Collection = Collection;
class Cursor {
    constructor(collection) {
        this.collection = collection;
        this.index = -1;
        this.item = null;
        if (this.collection.getSize() > 0) {
            this.updateElementPointer(0);
        }
    }
    moveForward() {
        const size = this.collection.getSize();
        if (size === 0) {
            return this.updateElementPointer(-1);
        }
        if (this.index + 1 > size - 1) {
            return this.updateElementPointer(0);
        }
        return this.updateElementPointer(this.index + 1);
    }
    moveBack() {
        const size = this.collection.getSize();
        if (size === 0) {
            return this.updateElementPointer(-1);
        }
        if (this.index === 0) {
            return this.updateElementPointer(size - 1);
        }
        return this.updateElementPointer(this.index - 1);
    }
    sync() {
        const size = this.collection.getSize();
        if (size === 0) {
            this.updateElementPointer(-1);
            this.item = null;
            return;
        }
        if (this.index === -1 && size > 0) {
            return this.updateElementPointer(0);
        }
        if (this.item === null) {
            return this.updateElementPointer(0);
        }
        const current = this.item;
        // is the element still in the collection?
        const newIndex = this.collection._getItemIndexByUUID(current);
        // We dealt with size === 0 above, so if we can't find the element, we go to index 0
        this.updateElementPointer(newIndex === -1 ? 0 : newIndex);
    }
    updateElementPointer(newIndex) {
        this.index = newIndex;
        this.item = this.collection._getItemByIndex(newIndex) || null;
    }
}
exports.Cursor = Cursor;
