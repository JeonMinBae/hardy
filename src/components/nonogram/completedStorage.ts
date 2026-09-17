import { readStorage, writeStorage } from "@/lib/common/storage";
import { COMPLETED_KEY, deserializeCompleted, serializeCompleted } from "@/lib/nonogram/completed";

export const loadCompleted = (): Set<string> => deserializeCompleted(readStorage(COMPLETED_KEY));

export function addCompleted(id: string): void {
  const ids = loadCompleted();
  ids.add(id);
  writeStorage(COMPLETED_KEY, serializeCompleted(ids));
}
