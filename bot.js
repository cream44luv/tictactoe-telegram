// Бот для игры в крестики-нолики (настоящий мультиплеер)
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

console.log('🚀 Бот запускается...');
console.log('🔍 Версия Node.js:', process.version);

// Получаем токен из переменных окружения
const token = process.env.TOKEN;
if (!token) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Токен не найден в переменных окружения!');
    process.exit(1);
}
console.log('🔑 Токен получен: ✅ (первые 5 символов: ' + token.substring(0, 5) + '...)');

let bot;
try {
    bot = new TelegramBot(token, { 
        polling: true,
        onlyFirstMatch: true,
        request: {
            timeout: 30000 // 30 секунд таймаут
        }
    });
    console.log('✅ Экземпляр бота создан');
} catch (error) {
    console.error('❌ Ошибка при создании бота:', error);
    process.exit(1);
}

const appUrl = 'https://cream44luv.github.io/tictactoe-telegram/';
console.log('📱 URL приложения:', appUrl);

// Хранилище игр (в памяти)
const games = new Map();
console.log('📦 Хранилище игр инициализировано');

// ======================================================
// ОБРАБОТЧИК КОМАНДЫ /start
// ======================================================
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || 'без username';
    const firstName = msg.from.first_name || '';
    
    console.log(`📨 [${new Date().toLocaleTimeString()}] ПОЛУЧЕНА КОМАНДА /start:`);
    console.log(`   └─ От: @${username} (${firstName}) [ID: ${userId}]`);
    
    bot.sendMessage(chatId, '🎮 Добро пожаловать в игру "Крестики-нолики"!\n\nНажмите кнопку ниже, чтобы начать', {
        reply_markup: {
            inline_keyboard: [[
                { text: '🎮 Открыть игру', web_app: { url: appUrl } }
            ]]
        }
    }).then(() => {
        console.log(`   └─ ✅ Приветствие отправлено пользователю @${username}`);
    }).catch((err) => {
        console.error(`   └─ ❌ Ошибка отправки приветствия:`, err.message);
    });
});

// ======================================================
// ОБРАБОТЧИК ДАННЫХ ИЗ MINI APP (САМОЕ ВАЖНОЕ)
// ======================================================
bot.on('web_app_data', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || 'без username';
    
    console.log(`\n🔥🔥🔥 [${new Date().toLocaleTimeString()}] ПОЛУЧЕНЫ ДАННЫЕ ИЗ MINI APP! 🔥🔥🔥`);
    console.log(`   └─ От: @${username} [ID: ${userId}]`);
    console.log(`   └─ Сырые данные:`, msg.web_app_data.data);
    
    try {
        const data = JSON.parse(msg.web_app_data.data);
        console.log(`   └─ ✅ Распарсенные данные:`, JSON.stringify(data, null, 2));
        
        // ======================================================
        // ДЕЙСТВИЕ: ПРИГЛАШЕНИЕ ДРУГА
        // ======================================================
        if (data.action === 'invite') {
            console.log(`   └─ 🎯 ДЕЙСТВИЕ: ПРИГЛАШЕНИЕ`);
            
            const friendUsername = data.opponent_username.replace('@', '');
            const gameId = data.game_id;
            const inviterName = data.inviter_name;
            const inviterUsername = data.inviter_username;
            
            console.log(`   └─ 👤 Друг: @${friendUsername}`);
            console.log(`   └─ 🎮 ID игры: ${gameId}`);
            console.log(`   └─ 👤 Приглашающий: ${inviterName} (@${inviterUsername})`);
            
            // Сохраняем игру
            games.set(gameId, {
                creator: {
                    id: msg.chat.id,
                    name: inviterName,
                    username: inviterUsername,
                    side: 'X'
                },
                opponent: null,
                board: ['', '', '', '', '', '', '', '', ''],
                currentTurn: 'X',
                status: 'waiting',
                createdAt: Date.now()
            });
            
            console.log(`   └─ 💾 Игра сохранена в хранилище. Всего игр: ${games.size}`);
            
            const gameUrl = `${appUrl}?game=${gameId}`;
            
            // Пытаемся найти пользователя по юзернейму
            console.log(`   └─ 🔍 Ищем пользователя @${friendUsername}...`);
            
            bot.getChat(`@${friendUsername}`).then((chat) => {
                console.log(`   └─ ✅ Пользователь @${friendUsername} НАЙДЕН! Chat ID: ${chat.id}`);
                
                // Отправляем приглашение другу
                return bot.sendMessage(chat.id, 
                    `🎮 ${inviterName} (@${inviterUsername}) приглашает вас сыграть в крестики-нолики!\n\n👉 **Нажмите кнопку, чтобы присоединиться**`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '🎮 Присоединиться к игре', web_app: { url: gameUrl } }
                        ]]
                    }
                });
            }).then(() => {
                console.log(`   └─ ✉️ Сообщение с приглашением ОТПРАВЛЕНО пользователю @${friendUsername}`);
                
                // Подтверждение отправителю
                return bot.sendMessage(msg.chat.id, `✅ Приглашение отправлено пользователю @${friendUsername}. Ожидайте...`);
            }).then(() => {
                console.log(`   └─ ✅ Подтверждение отправлено приглашающему`);
            }).catch((err) => {
                console.error(`   └─ ❌ ОШИБКА при работе с пользователем @${friendUsername}:`, err.message);
                
                if (err.message.includes('chat not found')) {
                    bot.sendMessage(msg.chat.id, 
                        `❌ Пользователь @${friendUsername} не найден.\n\n👉 Убедись, что он написал боту команду /start`);
                } else {
                    bot.sendMessage(msg.chat.id, 
                        `❌ Произошла ошибка: ${err.message}`);
                }
            });
        }
        
        // ======================================================
        // ДЕЙСТВИЕ: ПРИСОЕДИНЕНИЕ К ИГРЕ
        // ======================================================
        else if (data.action === 'join') {
            console.log(`   └─ 🎯 ДЕЙСТВИЕ: ПРИСОЕДИНЕНИЕ`);
            
            const gameId = data.game_id;
            const playerName = data.player_name;
            const playerUsername = data.player_username;
            
            console.log(`   └─ 🎮 ID игры: ${gameId}`);
            console.log(`   └─ 👤 Игрок: ${playerName} (@${playerUsername})`);
            
            const game = games.get(gameId);
            
            if (!game) {
                console.log(`   └─ ❌ Игра с ID ${gameId} не найдена в хранилище`);
                return;
            }
            
            console.log(`   └─ 📊 Статус игры: ${game.status}`);
            
            if (game.status === 'waiting') {
                game.opponent = {
                    id: msg.chat.id,
                    name: playerName,
                    username: playerUsername,
                    side: 'O'
                };
                game.status = 'ready';
                
                console.log(`   └─ ✅ Игрок @${playerUsername} присоединился к игре ${gameId}`);
                console.log(`   └─ 📊 Новый статус: ready`);
                
                // Уведомляем создателя
                bot.sendMessage(game.creator.id, 
                    `🎮 ${playerName} присоединился к игре! Игра начинается через 5 секунд...`)
                .then(() => {
                    console.log(`   └─ ✅ Уведомление отправлено создателю игры @${game.creator.username}`);
                })
                .catch((err) => {
                    console.error(`   └─ ❌ Ошибка уведомления создателя:`, err.message);
                });
            } else {
                console.log(`   └─ ❌ Игра ${gameId} уже начата или недоступна (статус: ${game.status})`);
            }
        }
        
        // ======================================================
        // ДЕЙСТВИЕ: ХОД В ИГРЕ
        // ======================================================
        else if (data.action === 'move') {
            console.log(`   └─ 🎯 ДЕЙСТВИЕ: ХОД`);
            
            const gameId = data.game_id;
            const game = games.get(gameId);
            
            if (!game) {
                console.log(`   └─ ❌ Игра с ID ${gameId} не найдена`);
                return;
            }
            
            // Обновляем доску
            game.board = data.board;
            game.currentTurn = data.nextTurn;
            
            console.log(`   └─ 📊 Текущая доска:`, game.board);
            console.log(`   └─ 👤 Следующий ход: ${game.currentTurn}`);
            
            // Определяем, кому отправлять ход
            const receiver = (data.player === 'creator') ? game.opponent : game.creator;
            
            if (receiver) {
                console.log(`   └─ 📤 Отправляем ход игроку @${receiver.username}`);
                
                bot.sendMessage(receiver.id, JSON.stringify({
                    action: 'opponent_move',
                    board: data.board,
                    nextTurn: data.nextTurn,
                    gameId: gameId
                }))
                .then(() => {
                    console.log(`   └─ ✅ Ход успешно отправлен`);
                })
                .catch((err) => {
                    console.error(`   └─ ❌ Ошибка отправки хода:`, err.message);
                });
            } else {
                console.log(`   └─ ❌ Получатель не найден`);
            }
        }
        
        else {
            console.log(`   └─ ⚠️ Неизвестное действие: ${data.action}`);
        }
        
    } catch (error) {
        console.error(`   └─ ❌ ОШИБКА ПАРСИНГА ДАННЫХ:`, error.message);
        console.error(`   └─ Сырые данные:`, msg.web_app_data.data);
    }
});

// ======================================================
// ОБРАБОТЧИК ОШИБОК ПОЛЛИНГА
// ======================================================
bot.on('polling_error', (error) => {
    console.error(`⚠️ [polling_error] ${error.code}: ${error.message}`);
});

bot.on('webhook_error', (error) => {
    console.error(`⚠️ [webhook_error] ${error.code}: ${error.message}`);
});

console.log('🤖 Обработчики событий зарегистрированы');

// ======================================================
// ВЕБ-СЕРВЕР ДЛЯ RAILWAY
// ======================================================
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('🤖 Бот для крестиков-ноликов работает!\n\n' +
             `Время запуска: ${new Date().toLocaleString()}\n` +
             `Активных игр: ${games.size}`);
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        games: games.size,
        timestamp: Date.now()
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Веб-сервер запущен на порту ${PORT}`);
    console.log(`   └─ URL: http://0.0.0.0:${PORT}`);
    console.log(`   └─ Health check: http://0.0.0.0:${PORT}/health`);
});

console.log('🤖 Бот запущен и готов к работе!');
console.log(`✅ Инициализация завершена в ${new Date().toLocaleTimeString()}`);

// ======================================================
// ОЧИСТКА СТАРЫХ ИГР (раз в час)
// ======================================================
setInterval(() => {
    const now = Date.now();
    let deletedCount = 0;
    
    for (const [id, game] of games.entries()) {
        if (now - game.createdAt > 3600000) { // 1 час
            games.delete(id);
            deletedCount++;
        }
    }
    
    if (deletedCount > 0) {
        console.log(`🧹 Очистка: удалено ${deletedCount} старых игр. Осталось: ${games.size}`);
    }
}, 3600000);