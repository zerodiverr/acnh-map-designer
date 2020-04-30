
import { Observable, AsyncSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

const DB_VERSION = 1;
const OBJECT_STORE_NAME = 'mapData';

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private readonly $ready = new AsyncSubject<void>();
    readonly ready: Observable<void> = this.$ready;

    private db: IDBDatabase;

    constructor(snackBar: MatSnackBar) {
        let req = indexedDB.open('app', DB_VERSION);
        req.onerror = () => {
            snackBar.open('ブラウザがIndexedDBに対応していません', 'OK');
        };
        req.onsuccess = () => {
            this.db = req.result;
            console.log('db open success');
            this.$ready.next();
            this.$ready.complete();
        };
        req.onupgradeneeded = () => {
            let db = req.result;
            if (db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
                snackBar.open('セーブデータのバージョンが変更されたため、以前の地図を取得できません', 'OK');
                db.deleteObjectStore(OBJECT_STORE_NAME);
            }
            db.createObjectStore(OBJECT_STORE_NAME).transaction.oncomplete = () => {
                console.log('createObjectStore OK');
            };
        };
    }

    public save<T>(key: string, data: T): void {
        this.db.transaction([OBJECT_STORE_NAME], 'readwrite').objectStore(OBJECT_STORE_NAME).put(data, key);
    }

    public load<T>(key: string): Observable<T> {
        let s = new AsyncSubject<T>();
        this.db.transaction(OBJECT_STORE_NAME).objectStore(OBJECT_STORE_NAME).get(key).onsuccess = event => {
            let req = event.target as IDBRequest;
            s.next(req.result);
            s.complete();
        };
        return s;
    }
}
