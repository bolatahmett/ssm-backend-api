import { initializeApp } from 'firebase/app';
import { getDatabase } from "firebase/database";
import dotenv from 'dotenv';
dotenv.config();
var firebase = initializeApp(JSON.parse(process.env.FIREBASE_CONFIG));
var database = getDatabase(firebase);
export { database };
export default firebase;
