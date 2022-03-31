// const amqp = require("amqplib");
// const axios = require("axios");

import axios from "axios";
import amqp from "amqplib";

const RABBITMQ_URL = "amqp://rabbitmq:5672";
// const RABBITMQ_URL = "amqp://localhost:5672";

// const serverURL = "http://localhost:3000/new_ride_matching_consumer";
const serverURL = "http://server:3000/new_ride_matching_consumer";

main();

async function main() {
  const data = {
    consumer_id: process.env.CONSUMER_ID
      ? process.env.CONSUMER_ID
      : "Default ID",
    IP: process.env.PRODUCER_ADDRESS
      ? process.env.PRODUCER_ADDRESS
      : "Default IP",
  };

  axios
    .post(serverURL, data)
    .then(async function (res) {
      if (res.data.success) {
        try {
          const connection = await amqp.connect(RABBITMQ_URL);
          const channel = await connection.createChannel();

          channel.consume("ride_match", async function (msg) {
            const input = JSON.parse(msg.content.toString());

            channel.ack(msg);
            await channel.close();
            await connection.close();

            const seconds = input.time;
            console.log(`Processing input for ${seconds} seconds`);
            await sleep(seconds * 1000);
            console.log(`TaskId: ${input.pickup}\nConsumerId: ${data.IP}\n`);
          });
        } catch (err) {
          console.log(err);
        }
      }
    })
    .catch((err) => {
      console.error(err);
    });
}

async function sleep(ms) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
