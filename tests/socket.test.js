// tests/socket.test.js
const http = require('http');
const { io: Client } = require('socket.io-client');
const app = require('../src/app');
const { initSocket } = require('../src/socket/socketServer');
const socketEmitter = require('../src/socket/socketEmitter');
require('./setup');

describe('Socket.IO Room Isolation & Real-Time Broadcasting', () => {
  let server;
  let port;
  let clientEventAlpha;
  let clientEventBeta;

  beforeAll((done) => {
    server = http.createServer(app);
    initSocket(server);
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    if (clientEventAlpha && clientEventAlpha.connected) clientEventAlpha.disconnect();
    if (clientEventBeta && clientEventBeta.connected) clientEventBeta.disconnect();
    server.close(done);
  });

  test('Clients join isolated event rooms (event:alpha and event:beta)', (done) => {
    let alphaJoined = false;
    let betaJoined = false;

    const checkDone = () => {
      if (alphaJoined && betaJoined) done();
    };

    clientEventAlpha = Client(`http://localhost:${port}`);
    clientEventBeta = Client(`http://localhost:${port}`);

    clientEventAlpha.on('connect', () => {
      clientEventAlpha.emit('joinEvent', { eventId: 'event_alpha', role: 'anchor' });
    });

    clientEventAlpha.on('joinedEvent', (data) => {
      expect(data.room).toBe('event:event_alpha');
      alphaJoined = true;
      checkDone();
    });

    clientEventBeta.on('connect', () => {
      clientEventBeta.emit('joinEvent', { eventId: 'event_beta', role: 'anchor' });
    });

    clientEventBeta.on('joinedEvent', (data) => {
      expect(data.room).toBe('event:event_beta');
      betaJoined = true;
      checkDone();
    });
  });

  test('Broadcasting to event:alpha is received by Alpha client and NOT Beta client', (done) => {
    let alphaReceived = false;
    let betaReceivedFalsePositive = false;

    clientEventAlpha.on('sessionDelayed', (data) => {
      expect(data.eventId).toBe('event_alpha');
      expect(data.delayMinutes).toBe(15);
      alphaReceived = true;
    });

    clientEventBeta.on('sessionDelayed', () => {
      betaReceivedFalsePositive = true;
    });

    // Broadcast sessionDelayed specifically to event_alpha
    socketEmitter.emitSessionDelayed('event_alpha', {
      agendaId: 'agenda_xyz',
      delayMinutes: 15,
      eventHealth: 'RUNNING_LATE',
      currentSession: { title: 'Hackathon Orientation' },
    });

    setTimeout(() => {
      expect(alphaReceived).toBe(true);
      expect(betaReceivedFalsePositive).toBe(false);
      clientEventAlpha.off('sessionDelayed');
      clientEventBeta.off('sessionDelayed');
      done();
    }, 400);
  });

  test('Session started, completed, and skipped events are properly scoped to room', (done) => {
    let receivedCount = 0;

    clientEventAlpha.on('sessionStarted', () => { receivedCount++; });
    clientEventAlpha.on('sessionCompleted', () => { receivedCount++; });
    clientEventAlpha.on('sessionSkipped', () => { receivedCount++; });

    socketEmitter.emitSessionStarted('event_alpha', { _id: 's1', title: 'S1' });
    socketEmitter.emitSessionCompleted('event_alpha', { _id: 's1', title: 'S1' });
    socketEmitter.emitSessionSkipped('event_alpha', { _id: 's2', title: 'S2' });

    setTimeout(() => {
      expect(receivedCount).toBe(3);
      clientEventAlpha.off('sessionStarted');
      clientEventAlpha.off('sessionCompleted');
      clientEventAlpha.off('sessionSkipped');
      done();
    }, 400);
  });
});
