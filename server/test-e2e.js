import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:4000';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('🧪 Starting E2E Socket Integration Test...');

  // 1. Connect Client 1 (Host: Alice)
  const socket1 = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise(res => socket1.on('connect', res));
  console.log('✅ Client 1 (Alice) connected:', socket1.id);

  // 2. Connect Client 2 (Bob)
  const socket2 = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise(res => socket2.on('connect', res));
  console.log('✅ Client 2 (Bob) connected:', socket2.id);

  let roomId = '';

  // Listen for room join
  const pJoin1 = new Promise((resolve) => {
    socket1.on('room_joined', (data) => {
      console.log('✅ Room created with code:', data.roomId);
      roomId = data.roomId;
      resolve(data);
    });
  });

  socket1.emit('create_room', {
    hostName: 'Alice',
    avatar: { color: '#f59e0b', eyes: 1, mouth: 1 },
    settings: { rounds: 2, drawTime: 30, wordCount: 3 }
  });

  await pJoin1;

  // Bob joins Alice's room
  const pJoin2 = new Promise((resolve) => {
    socket2.on('room_joined', (data) => {
      console.log('✅ Bob joined room:', data.roomId);
      resolve(data);
    });
  });

  socket2.emit('join_room', {
    roomId,
    playerName: 'Bob',
    avatar: { color: '#3b82f6', eyes: 2, mouth: 2 }
  });

  await pJoin2;
  await sleep(500);

  // Alice starts game
  console.log('🎮 Alice starting the game...');
  let drawerId = '';
  let wordChoices = [];

  const pWordOptions = new Promise((resolve) => {
    socket1.on('word_options', (wordsData) => {
      console.log('✅ Word options received by drawer (Alice):', wordsData.words);
      wordChoices = wordsData.words;
      resolve(wordsData);
    });
    socket2.on('word_options', (wordsData) => {
      console.log('❌ Bob unexpectedly received word options');
    });
  });

  socket1.emit('start_game');
  await pWordOptions;

  const chosenWord = wordChoices[0] || 'apple';
  console.log(`🎨 Alice choosing word: "${chosenWord}"`);

  const pRoundStartedBob = new Promise((resolve) => {
    socket2.on('round_started', (data) => {
      console.log(`✅ Bob received masked word: "${data.word}" (isDrawer: ${data.isDrawer})`);
      resolve(data);
    });
  });

  socket1.emit('choose_word', { word: chosenWord });
  await pRoundStartedBob;

  // Alice draws stroke
  console.log('🖌️ Alice drawing stroke...');
  const strokeData = {
    id: 's1',
    type: 'brush',
    color: '#ef4444',
    size: 5,
    points: [{ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 }]
  };

  const pStrokeReceived = new Promise((resolve) => {
    socket2.on('draw_stroke', (s) => {
      console.log('✅ Bob received stroke sync:', s.id, s.color);
      resolve(s);
    });
  });

  socket1.emit('draw_stroke', strokeData);
  await pStrokeReceived;

  // Bob guesses close word (if length >= 4)
  if (chosenWord.length >= 4) {
    const misspelled = chosenWord.slice(0, -1) + 'z';
    console.log(`💬 Bob sending close guess: "${misspelled}"`);

    const pClose = new Promise((resolve) => {
      socket2.on('close_guess', () => {
        console.log('✅ Bob received "close_guess" notification!');
        resolve();
      });
    });

    socket2.emit('chat_message', { text: misspelled });
    await pClose;
    await sleep(300);
  }

  // Register round end listener BEFORE sending correct guess so we never miss it
  console.log('⏳ Setting up round end listener...');
  const pRoundEnd = new Promise((resolve) => {
    socket1.once('round_ended', (data) => {
      console.log(`✅ Round ended! The word was "${data.word}". Scores:`, data.scores);
      resolve(data);
    });
  });

  // Bob guesses exact word
  console.log(`💬 Bob sending exact guess: "${chosenWord}"`);
  const pGuessSuccess = new Promise((resolve) => {
    socket2.once('guess_success', (data) => {
      console.log(`🎉 Bob received guess_success! Points: +${data.points}, Word: "${data.word}"`);
      resolve(data);
    });
  });

  socket2.emit('chat_message', { text: chosenWord });
  await pGuessSuccess;
  await pRoundEnd;

  console.log('\n🎉 ALL E2E INTEGRATION TESTS PASSED PERFECTLY!\n');
  socket1.disconnect();
  socket2.disconnect();
  process.exit(0);
}

runTest().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
