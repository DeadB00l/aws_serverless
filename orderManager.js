'user strict'

const uuidv1 = require('uuid/v1');
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const kinesis = new AWS.Kinesis();

const TABLE_NAME = process.env.orderTableName;
const STREAM_NAME = process.env.orderStreamName;

const createOrder = body => {
    const order = {
        orderId: uuidv1(),
        name: body.name,
        address: body.address,
        productId: body.productId,
        quantity: body.quantity,
        orderDate: Date.now(),
        eventType: 'order_placed'
    }

    return order;
}

const placeNewOrder = order => {
    return this.saveOrder(order).then(() => {
        return placeOrderStream(order);
    });
}

const fulfillOrder = (orderId, fulfillmentId) => {

    return getOrder(orderId).then(savedOrder => {
        const order = createFulfilledOrder(savedOrder, fulfillmentId);
        return this.saveOrder(order).then(() => {
           return placeOrderStream(order) 
        });
    });
}

const updateOrderForDelivery = orderId => {
    return getOrder(orderId).then(order => {
        order.sentToDeliverDate = Date.now()
        return order;
    })
}

const saveOrder = (order) => {
    const params = {
        TableName: TABLE_NAME,
        Item: order
    }

    return dynamo.put(params).promise()
}

function placeOrderStream(order) {
    const params = {
        Data: JSON.stringify(order),
        PartitionKey: order.orderId,
        StreamName: STREAM_NAME
    }

    return kinesis.putRecord(params).promise();
}

function getOrder(orderId) {
    const params = {
        Key: {
            orderId: orderId
        },
        TableName: TABLE_NAME
    };

    return dynamo.get(params).promise().then(result => {
        return result.Item;
    })
}

function createFulfilledOrder(savedOrder, fulfillmentId) {
    savedOrder.fulfillmentId = fulfillmentId;
    savedOrder.fulfillmentDate = Date.now();
    savedOrder.eventType = 'order_fulfilled';

    return savedOrder;
}

module.exports = {
    createOrder, placeNewOrder, fulfillOrder, updateOrderForDelivery, saveOrder
}