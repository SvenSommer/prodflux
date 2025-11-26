/**
 * Transfer Todo Model
 * Represents a transfer task to be executed between workshops
 * Frontend-only state (Step 5) - no backend persistence yet
 */
export interface TransferTodo {
  /**
   * Unique identifier (UUID)
   * Generated using crypto.randomUUID()
   */
  id: string;

  /**
   * Material ID to be transferred
   */
  materialId: number;

  /**
   * Material name (denormalized for display)
   */
  materialName: string;

  /**
   * Source workshop ID
   */
  fromWorkshopId: number;

  /**
   * Source workshop name (denormalized for display)
   */
  fromWorkshopName: string;

  /**
   * Destination workshop ID
   */
  toWorkshopId: number;

  /**
   * Destination workshop name (denormalized for display)
   */
  toWorkshopName: string;

  /**
   * Quantity to transfer
   */
  quantity: number;

  /**
   * Whether the transfer has been completed
   */
  done: boolean;
}

/**
 * Generate a unique ID for a transfer todo
 * Uses crypto.randomUUID() with fallback for older browsers/tests
 */
export function generateTodoId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID
  // Simple UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
