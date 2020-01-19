'use strict'

const orderManager = require("./orderManager")
const AWS = require("aws-sdk");

const sqs = new AWS.SQS({
    region: process.env.region
})

const DELIVER_COMPANY_QUEUE = process.env.deliveryCompanyQueue;

const deliveryOrder = orderFulfilled => {
    let orderFulfilledPromises = [];

    for(let order of orderFulfilled){
        const temp = orderManager.updateOrderForDelivery(order.orderId)
            .then(updateOrder => {
                orderManager.saveOrder(updateOrder)
                    .then(() => {
                        notifyDeliveryCompany(updateOrder);
                    })
            })

            orderFulfilledPromises.push(temp);
    }

    return Promise.all(orderFulfilledPromises)
}

function notifyDeliveryCompany(order) {
    const params = {
        MessageBody: JSON.stringify(order),
        QueueUrl: DELIVER_COMPANY_QUEUE
    }

    return sqs.sendMessage(params).promise();
}

module.exports = {
    deliveryOrder
}