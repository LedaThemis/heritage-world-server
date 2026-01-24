import { MapSchema, Schema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") name: string;
  @type("number") x: number;
  @type("number") y: number;
  @type("number") z: number;
  @type("number") rotX: number;
  @type("number") rotY: number;
  @type("number") rotZ: number;
  @type("number") rotW: number;
}

export class PlayerRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}
