import { join, dirname } from "path";
import { Low, JSONFile } from "lowdb";
import { fileURLToPath } from "url";

// let join,
//   dirname = require("path");
// let Low,
//   JSONFile = require("lowdb");
// let fileURLToPath = require("url");

// const amqp = require("amqplib");
import amqp from "amqplib";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RABBITMQ_URL = "amqp://rabbitmq:5672";
// const RABBITMQ_URL = "amqp://localhost:5672";

// Use JSON file for storage
const file = join(__dirname, "db.json");
const adapter = new JSONFile(file);
const db = new Low(adapter);

main();

async function main() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    channel.consume("database", async (msg) => {
      const input = JSON.parse(msg.content.toString());
      channel.ack(msg);

      console.log(`Received: ${input}`);

      await db.read();
      db.data ||= { posts: [] };
      const { posts } = db.data;
      posts.push(input);
      await db.write();
    });
  } catch (err) {
    console.log(err);
  }
}
