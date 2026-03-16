import { type RoomPlan, type InsertRoomPlan } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getRoomPlan(id: string): Promise<RoomPlan | undefined>;
  createRoomPlan(plan: InsertRoomPlan): Promise<RoomPlan>;
}

export class MemStorage implements IStorage {
  private plans: Map<string, RoomPlan>;

  constructor() {
    this.plans = new Map();
  }

  async getRoomPlan(id: string): Promise<RoomPlan | undefined> {
    return this.plans.get(id);
  }

  async createRoomPlan(insertPlan: InsertRoomPlan): Promise<RoomPlan> {
    const id = randomUUID();
    const plan: RoomPlan = { ...insertPlan, id };
    this.plans.set(id, plan);
    return plan;
  }
}

export const storage = new MemStorage();
