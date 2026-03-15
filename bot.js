// Бот для игры в крестики-нолики (настоящий мультиплеер)
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

console.log('🚀 Бот запускается...');

const token = process.env.TOKEN;
console.log('🔑 Токен получен:', token ? '✅' : '❌');

const bot = new TelegramBot(token, { polling: true });

const appUrl = 'https://cream44luv.github.io/tictactoe-telegram/';

// Хранилище игр (в памяти)
const games = new Map();

console.log('📦 Хранилище игр инициализировано');

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    console.log('📨 Получена команда /start от пользователя:', msg.from.username);
    bot.sendMessage(chatId, '🎮 Добро пожаловать в игру "Крестики-нолики"!', {
        reply_markup: {
            inline_keyboard: [[
                { text: '🎮 Открыть игру', web_app: { url: appUrl } }
            ]]
        }
    });
});

// ВАЖНО: Обработка данных из Mini App
bot.on('web_app_data', (msg) => {
    console.log('🔥🔥🔥 ПОЛУЧЕНЫ ДАННЫЕ ИЗ MINI APP! 🔥🔥🔥');
    console.log('📦 Сырые данные:', msg.web_app_data.data);
    
    try {
        const data = JSON.parse(msg.web_app_data.data);
        console.log('✅ Распарсенные данные:', data);
        
        // Действие: приглашение друга
        if (data.action === 'invite') {
            console.log('🎯 Действие: ПРИГЛАШЕНИЕ');
            const friendUsername = data.opponent_username.replace('@', '');
            const gameId = data.game_id;
            
            console.log('👤 Друг:', friendUsername);
            console.log('🎮 ID игры:', gameId);
            
            // Сохраняем игру
            games.set(gameId, {
                creator: {
                    id: msg.chat.id,
                    name: data.inviter_name,
                    username: data.inviter_username,
                    side: 'X'
                },
                opponent: null,
                board: ['', '', '', '', '', '', '', '', ''],
                currentTurn: 'X',
                status: 'waiting',
                createdAt: Date.now()
            });
            
            console.log('💾 Игра сохранена');
            
            const gameUrl = `${appUrl}?game=${gameId}`;
            
            // Пытаемся найти пользователя по юзернейму
            bot.getChat(`@${friendUsername}`).then((chat) => {
                console.log('✅ Пользователь найден:', chat.id);
                
                // Отправляем приглашение другу
                bot.sendMessage(chat.id, 
                    `🎮 ${data.inviter_name} (@${data.inviter_username}) приглашает вас сыграть в крестики-нолики!\n\n👉 **Нажмите кнопку, чтобы присоединиться**`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '🎮 Присоединиться к игре', web_app: { url: gameUrl } }
                        ]]
                    }
                }).then(() => {
                    console.log('✉️ Сообщение другу отправлено');
                }).catch((err) => {
                    console.error('❌ Ошибка отправки другу:', err);
                });
                
                // Подтверждение отправителю
                bot.sendMessage(msg.chat.id, `✅ Приглашение отправлено пользователю @${friendUsername}. Ожидайте...`);
                
            }).catch((err) => {
                console.error('❌ Пользователь не найден:', err);
                bot.sendMessage(msg.chat.id, 
                    `❌ Пользователь @${friendUsername} не найден.\n\n👉 Убедись, что он написал боту команду /start`);
            });
        }
        
        // Действие: присоединение к игре
        if (data.action === 'join') {
            console.log('🎯 Действие: ПРИСОЕДИНЕНИЕ');
            const gameId = data.game_id;
            const game = games.get(gameId);
            
            if (game && game.status === 'waiting') {
                game.opponent = {
                    id: msg.chat.id,
                    name: data.player_name,
                    username: data.player_username,
                    side: 'O'
                };
                game.status = 'ready';
                
                console.log('✅ Игрок присоединился к игре:', gameId);
                
                // Уведомляем создателя
                bot.sendMessage(game.creator.id, 
                    `🎮 ${data.player_name} присоединился к игре! Игра начинается через 5 секунд...`);
            } else {
                console.log('❌ Игра не найдена или уже началась');
            }
        }
        
        // Действие: ход в игре
        if (data.action === 'move') {
            console.log('🎯 Действие: ХОД');
            const gameId = data.game_id;
            const game = games.get(gameId);
            
            if (!game) {
                console.log('❌ Игра не найдена');
                return;
            }
            
            // Обновляем доску
            game.board = data.board;
            game.currentTurn = data.nextTurn;
            
            // Определяем, кому отправлять ход
            const receiver = (data.player === 'creator') ? game.opponent : game.creator;
            
            if (receiver) {
                console.log('📤 Отправляем ход игроку:', receiver.username);
                // Отправляем ход второму игроку
                bot.sendMessage(receiver.id, JSON.stringify({
                    action: 'opponent_move',
                    board: data.board,
                    nextTurn: data.nextTurn,
                    gameId: gameId
                }));
            }
        }
        
    } catch (error) {
        console.error('❌ Ошибка обработки web_app_data:', error);
    }
});

console.log('🤖 Обработчики событий зарегистрированы');

// Веб-сервер для Railway
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('🤖 Бот для крестиков-ноликов работает!');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Веб-сервер запущен на порту ${PORT}`);
});

console.log('🤖 Бот запущен и готов к работе!');

// Очистка старых игр (раз в час)
setInterval(() => {
    const now = Date.now();
    for (const [id, game] of games.entries()) {
        if (now - game.createdAt > 3600000) { // 1 час
            games.delete(id);
            console.log('🧹 Удалена старая игра:', id);
        }
    }
}, 3600000);

console.log('✅ Инициализация завершена');