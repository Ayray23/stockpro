import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const addMaterial = async (data) => {
  return await addDoc(collection(db, "materials"), {
    ...data,
    quantity: Number(data.quantity),
    addedAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
  });
};
