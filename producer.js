// https://www.rabbitmq.com/tutorials/tutorial-one-javascript.html
// docker-compose up --force-recreate
// docker run -d --name some-rabbit -p 5672:5672 rabbitmq:latest

const RABBITMQ_URL = "amqp://rabbitmq:5672";
// const RABBITMQ_URL = "amqp://localhost:5672";

import amqp from "amqplib";
import express from "express";

// const amqp = require("amqplib");
// const express = require("express");
// const requestIp = require("request-ip");
// require("dotenv").config();

const app = express();
const port = 3000;

// app.use(requestIp.mw());
app.use(express.json());

let newConsumers = [];

app.get("/", (req, res) => {
  res.send("Building Microservice Communication With RabbitMQ");
});

app.post("/new_ride", async function (req, res) {
  const newRide = {
    pickup: req.body.pickup,
    destination: req.body.destination,
    time: req.body.time,
    costs: req.body.costs,
    seats: req.body.seats,
  };

  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue("ride_match");
    await channel.sendToQueue(
      "ride_match",
      Buffer.from(JSON.stringify(newRide))
    );

    await channel.assertQueue("database");
    await channel.sendToQueue("database", Buffer.from(JSON.stringify(newRide)));

    res.json({ success: true, message: "Ride created" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "RabbitMQ server error" });
  }
});

app.post("/new_ride_matching_consumer", (req, res) => {
  //   const consumerDetails = {
  //     name: req.body.consumer_id,
  //     IP: req.clientIp,
  //   };

  const consumerDetails = {
    name: req.body.consumer_id,
    IP: req.body.IP,
  };

  newConsumers.push(consumerDetails);
  //   console.log(newConsumers);
  res.json({ success: true, message: "Consumer added" });
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
