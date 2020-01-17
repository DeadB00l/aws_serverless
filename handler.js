'use strict';

const orderManager = require("./orderManager")
const kinesisHelper = require("./kinesisHelper")
const cakeProducerManager = require('./cakeProducerManager');

const createResponse = (statusCode, message) => {
  const response = {
    statusCode,
    body: JSON.stringify(message)
  }

  return response
}

const createOrder = async event => {

  const body = JSON.parse(event.body)
  const order = orderManager.createOrder(body)

  return orderManager.placeNewOrder(order).then(() => {
    return createResponse(200, order);
  }).catch(error => {
    return createResponse(400, error);
  })
};

const orderFulfillment = async (event) => {
  const body = JSON.parse(event.body);
  const orderId = body.orderId;
  const fulfillmentId = body.fulfillmentId;

  return orderManager.fulfillOrder(orderId, fulfillmentId).then(() => {
    return createResponse(200, `Order with orderId:${orderId} was sent to delivery`);
  }).catch(error => {
    return createResponse(400, error);
  })
}

const notifyCakeProducer = async event => {
  const records = kinesisHelper.getRecords(event);

  const ordersPlaced = records.filter(r => r.eventType === 'order_placed')

  if(ordersPlaced.length <= 0) {
    return 'there is nothing'
  }

  cakeProducerManager.handlePlacedOrders(ordersPlaced).then(() => {
    return 'eveything went well'
  }).catch(err => {
    return error;
  })
}

module.exports = {
  createOrder, notifyCakeProducer, orderFulfillment
}
