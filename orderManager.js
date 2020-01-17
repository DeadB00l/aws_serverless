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
    return saveNewOrder(order).then(() => {
        return placeOrderStream(order);
    });
}

const placeOrderStream = order => {
    const params = {
        Data: JSON.stringify(order),
        PartitionKey: order.orderId,
        StreamName: STREAM_NAME
    }

    return kinesis.putRecord(params).promise();
}

const saveNewOrder = order => {
    const params = {
        TableName: TABLE_NAME,
        Item: order
    }

    return dynamo.put(params).promise()
}

module.exports = {
    createOrder, placeNewOrder
}