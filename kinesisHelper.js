'use strict'

const parsePayload = record => {
    const json = new Buffer(record.kinesis.data, 'base64').toString('utf8');
    return JSON.parse(json);
}

const getRecords = event => {
    return event.Records.map(parsePayload);
}

module.exports = {
    getRecords
}