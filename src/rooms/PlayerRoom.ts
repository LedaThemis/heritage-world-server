import { Room, Client } from "@colyseus/core";
import { PlayerRoomState, Player } from "./schema/PlayerRoomState";

export class PlayerRoom extends Room<PlayerRoomState> {
  maxClients = 50;
  state = new PlayerRoomState();

  onCreate(options: any) {
    this.onMessage("setName", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      player.name = data.name;
    });
    this.onMessage("updatePosition", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      player.x = data.x;
      player.y = data.y;
      player.z = data.z;
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    // create Player instance
    const player = new Player();

    // place Player at a random position
    const FLOOR_SIZE = 50;
    player.x = -(FLOOR_SIZE / 2) + Math.random() * FLOOR_SIZE;
    player.y = 2;
    player.z = -(FLOOR_SIZE / 2) + Math.random() * FLOOR_SIZE;

    // place player in the map of players by its sessionId
    // (client.sessionId is unique per connection!)
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");

    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
