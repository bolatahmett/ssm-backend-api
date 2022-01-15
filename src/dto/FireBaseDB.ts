import { initializeApp } from 'firebase/app';
import { getDatabase } from "firebase/database";
import dotenv from 'dotenv';
dotenv.config();

const firebase = initializeApp(JSON.parse(process.env.FIREBASE_CONFIG as any));
const database = getDatabase(firebase);
export { database };
export default firebase;