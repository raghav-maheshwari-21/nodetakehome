const net = require('net');
const fs = require('fs');

const PORT = 3000;
const HOST = '127.0.0.1';

const PACKET_SIZE = 17;
const HEADER_SIZE = 2;
let packets = [];
let expectedSequence = 1;

const requestStreamAll = () => {
    const buffer = Buffer.alloc(HEADER_SIZE);
    buffer.writeInt8(1, 0);
    buffer.writeInt8(0, 1);
    return buffer;
};

const requestResendPacket = (sequence) => {
    const buffer = Buffer.alloc(HEADER_SIZE);
    buffer.writeInt8(2, 0);
    buffer.writeInt8(sequence, 1);
    return buffer;
};

const handlePacket = (data) => {
    const symbol = data.slice(0, 4).toString('ascii').trim();
    const buysellindicator = data.slice(4, 5).toString('ascii');
    const quantity = data.readInt32BE(5);
    const price = data.readInt32BE(9);
    const packetSequence = data.readInt32BE(13);

    return { symbol, buysellindicator, quantity, price, packetSequence };
};

const client = net.createConnection({ port: PORT, host: HOST }, () => {
    console.log('Connected to server');
    client.write(requestStreamAll());
});

client.on('data', (data) => {
    for (let offset = 0; offset < data.length; offset += PACKET_SIZE) {
        const packet = handlePacket(data.slice(offset, offset + PACKET_SIZE));
        packets.push(packet);
        expectedSequence++;
    }
});

client.on('end', () => {
    const missingSequences = [];
    for (let i = 1; i < expectedSequence; i++) {
        if (!packets.find(p => p.packetSequence === i)) {
            missingSequences.push(i);
        }
    }
    requestMissingPackets(missingSequences);
});

const requestMissingPackets = (missingSequences) => {
    if (missingSequences.length === 0) {
        savePackets();
        return;
    }
    const sequence = missingSequences.shift();
    client.write(requestResendPacket(sequence));
    client.once('data', (data) => {
        const packet = handlePacket(data);
        packets.push(packet);
        requestMissingPackets(missingSequences);
    });
};

const savePackets = () => {
    packets.sort((a, b) => a.packetSequence - b.packetSequence);
    fs.writeFileSync('packets.json', JSON.stringify(packets, null, 2));
    console.log('Packets saved to packets.json');
    client.end();
};
