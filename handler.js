'use strict';

const orderManager = require("./orderManager")
const kinesisHelper = require("./kinesisHelper")
const cakeProducerManager = require('./cakeProducerManager');
const deliveryManager = require('./deliveryManager');

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

const notifyExternalParties = async event => {
  const records = kinesisHelper.getRecords(event);

  const cakeProducerPromise = getCakeProducerPromise(records);
  const deliveryPromise = getDeliveryPromise(records);

  return Promise.all([ cakeProducerPromise, deliveryPromise ]).then(() => {
    return 'eveything went well'
  }).catch(err => {
    return error;
  })
}

const notifyDeliveryCompany = async event => {
  console.log('called delivery company')
  return 'done'
}

function getCakeProducerPromise(records) {
  const ordersPlaced = records.filter(r => r.eventType === 'order_placed')

  if(ordersPlaced.length > 0) {
    return cakeProducerManager.handlePlacedOrders(ordersPlaced)
  } else {
    return null
  }
}

function getDeliveryPromise(records) {
  const orderFulfilled = records.filter(r => r.eventType === 'order_fulfilled');

  if(orderFulfilled.length > 0) {
    return deliveryManager.deliveryOrder(orderFulfilled);
  } else {
    return null
  }
}

module.exports = {
  createOrder, notifyExternalParties, orderFulfillment
}
