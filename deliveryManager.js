'use strict'

const deliveryOrder = ordersFulfilled => {
    console.log('Delivery order was called');

    return new Promise(resolve => {
        setTimeout(() => {
            console.log('foo')
            resolve('foo');
        }, 300)
    })
}