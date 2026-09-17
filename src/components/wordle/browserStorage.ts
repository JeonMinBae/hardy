import { readStorage, writeStorage } from "@/lib/common/storage";
import { deserialize, serialize, STORAGE_KEY, type SavedData } from "@/lib/wordle/saved";

export const loadSaved = (): SavedData => deserialize(readStorage(STORAGE_KEY));

export const storeSaved = (data: SavedData): void => writeStorage(STORAGE_KEY, serialize(data));
