const net = require('net');

const packetData = {
    'packetStream': [
        { 'symbol': 'AAPL', 'buysellindicator': 'B', 'quantity': 50, 'price': 100, 'packetSequence': 1 },
        { 'symbol': 'AAPL', 'buysellindicator': 'B', 'quantity': 30, 'price': 98, 'packetSequence': 2 },
        { 'symbol': 'AAPL', 'buysellindicator': 'S', 'quantity': 20, 'price': 101, 'packetSequence': 3 },
        { 'symbol': 'AAPL', 'buysellindicator': 'S', 'quantity': 10, 'price': 102, 'packetSequence': 4 },
        { 'symbol': 'MSFT', 'buysellindicator': 'B', 'quantity': 40, 'price': 50, 'packetSequence': 5 },
        { 'symbol': 'MSFT', 'buysellindicator': 'S', 'quantity': 30, 'price': 55, 'packetSequence': 6 },
        { 'symbol': 'MSFT', 'buysellindicator': 'S', 'quantity': 20, 'price': 57, 'packetSequence': 7 },
        { 'symbol': 'META', 'buysellindicator': 'B', 'quantity': 25, 'price': 150, 'packetSequence': 8 },
        { 'symbol': 'META', 'buysellindicator': 'S', 'quantity': 15, 'price': 155, 'packetSequence': 9 },
        { 'symbol': 'META', 'buysellindicator': 'B', 'quantity': 20, 'price': 148, 'packetSequence': 10 },
        { 'symbol': 'AMZN', 'buysellindicator': 'B', 'quantity': 10, 'price': 3000, 'packetSequence': 11 },
        { 'symbol': 'AMZN', 'buysellindicator': 'B', 'quantity': 5, 'price': 2999, 'packetSequence': 12 },
        { 'symbol': 'AMZN', 'buysellindicator': 'S', 'quantity': 15, 'price': 3020, 'packetSequence': 13 },
        { 'symbol': 'AMZN', 'buysellindicator': 'S', 'quantity': 10, 'price': 3015, 'packetSequence': 14 }
    ]
};

const PACKET_CONTENTS = [
    { 'name': 'symbol', 'type': 'ascii', 'size': 4 },
    { 'name': 'buysellindicator', 'type': 'ascii', 'size': 1 },
    { 'name': 'quantity', 'type': 'int32', 'size': 4 },
    { 'name': 'price', 'type': 'int32', 'size': 4 },
    { 'name': 'packetSequence', 'type': 'int32', 'size': 4 }
];

const PACKET_SIZE = PACKET_CONTENTS.reduce((acc, field) => acc + field.size, 0);

function createPayloadToSend(data) {
    let offset = 0;
    const buffer = Buffer.alloc(PACKET_SIZE);

    PACKET_CONTENTS.forEach(field => {
        if (field.type === 'int32') {
            offset = buffer.writeInt32BE(data[field.name], offset);
        } else if (field.type === 'ascii') {
            offset += buffer.write(data[field.name], offset, field.size, 'ascii');
        }
    });

    return buffer;
}

const orderBook = packetData.packetStream;

const server = net.createServer(socket => {
    console.log('Client connected.');
    
    let packet = orderBook.find(packet => packet.symbol === 'AAPL' && packet.buysellindicator === 'B');
    const payload = createPayloadToSend(packet);
    
    socket.write(payload);
    
    socket.on('end', () => {
        console.log('Client disconnected.');
    });

    socket.on('data', data => {
        console.log(data);
        console.log('Packets sent. Client disconnected.');
        socket.write(payload);
        console.log('Packet resent.');
    });

    socket.on('error', err => {
        console.error('Socket error:', err);
    });
});

server.listen(3000, () => {
    console.log('TCP server started on port 3000.');
});
