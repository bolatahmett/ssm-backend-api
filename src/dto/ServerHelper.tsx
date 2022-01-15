
import { ref, get, child, query, update, push, set, onChildAdded, limitToLast } from "firebase/database";
import { database } from './FireBaseDB.js';

export async function getUser(nickName: string, password: string, loginType: number): Promise<any> {
    let result = undefined;

    const dbRef = ref(database);

    await get(child(dbRef, `User/${nickName}`)).then((snapshot: { val: () => any; }) => {

        var snapshotValue = snapshot.val();
        if (snapshotValue["Password"] == password && snapshotValue["LoginType"] == loginType) {
            result = snapshotValue;
        }
    });

    return result;
}

export async function getTableItemWithId<T>(tableName: string, id: string): Promise<T> {
    let result = undefined;
    const dbRef = ref(database);
    await get(child(dbRef, `${tableName}/${id}`)).then((snapshot: { val: () => any; }) => {
        result = snapshot.val();
        return result;
    });
    return result as unknown as Promise<T>;
}

export async function getTableItemWithIdasync<T>(tableName: string, id: string): Promise<T> {
    let result = undefined;
    const dbRef = ref(database);
    get(child(dbRef, `${tableName}/${id}`)).then((snapshot: { val: () => any; }) => {
        result = snapshot.val();
        return result;
    });
    return result as unknown as Promise<T>;
}

export async function getTableItems(tableName: string): Promise<any> {
    let result = undefined;

    await get(query(ref(database, tableName))).then((snapshot: any) => {
        result = [];
        var json = snapshot.val();

        for (var key in json) {
            var keyTemp = json[key];
            keyTemp["Id"] = key;
            result.push(keyTemp);
        }
    });

    return result;;
}

export async function insertItemOnDb(tableName: string, item: any) {
    let uniqueKey: any = push(child(ref(database), tableName)).key;
    if (uniqueKey === null)
        uniqueKey = undefined;
    return updateItemOnDb(tableName, item, uniqueKey);
}

export async function updateItemOnDb(tableName: string, item: any, key: string) {
    const updates = {} as any;
    let uniqueKey = key ? key : item.Id;

    if (!uniqueKey) {
        uniqueKey = push(child(ref(database), tableName)).key;
    }

    const { Id, ...newObj } = item;
    updates[`/${tableName}/${uniqueKey}`] = newObj;

    return update(ref(database), updates);
}


