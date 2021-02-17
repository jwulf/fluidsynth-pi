import { v4 as uuid } from "uuid";

interface CollectionItemUUID {
  uuid: string;
}

export type CollectionItem<T> = T & CollectionItemUUID;

export class Collection<T> {
  private items: Array<CollectionItem<T>> = [];
  private cursors: Cursor<T>[] = [];

  constructor(items: T[], private sortField?: string) {
    items.forEach((item) => this.addItem(item, { sort: false }));
    this.sortItems();
  }

  addItem(item: T, { sort = true } = {}) {
    const isAlreadyCollectionItem = (item: any): item is CollectionItem<T> =>
      !!item.uuid;
    const newItem = isAlreadyCollectionItem(item)
      ? item
      : { ...item, uuid: uuid() };
    this.items.push(newItem);
    if (sort) {
      this.sortItems();
      this.syncCursors();
    }
  }

  removeItem(element: CollectionItem<T>) {
    this.items = this.items.filter((e) => e.uuid !== element.uuid);
    this.syncCursors();
  }

  createCursor() {
    const cursor = new Cursor<T>(this);
    this.cursors.push(cursor);
    return cursor;
  }

  getSize() {
    return this.items.length;
  }

  getItems() {
    return this.items;
  }

  _getItemByIndex(index: number) {
    return this.items[index];
  }

  /**
   *
   * If the item has been removed from the collection, returns -1
   */
  _getItemIndexByUUID(item: CollectionItem<T>) {
    return this.items.reduce(
      (prev, curr, i) => (curr.uuid === item.uuid ? i : prev),
      -1
    );
  }

  private syncCursors() {
    this.cursors.forEach((c) => c.sync());
  }

  private sortItems() {
    if (!this.sortField) {
      return;
    }
    this.items.sort((a, b) => {
      const af = (a as any)[this.sortField!];
      const bf = (b as any)[this.sortField!];
      if (af === bf) return 0;
      return af < bf ? -1 : 1;
    });
  }
}

export class Cursor<T> {
  private index = -1;
  public item: CollectionItem<T> | null = null;

  constructor(private collection: Collection<T>) {
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

  private updateElementPointer(newIndex: number) {
    this.index = newIndex;
    this.item = this.collection._getItemByIndex(newIndex) || null;
  }
}
