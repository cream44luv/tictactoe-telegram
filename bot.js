// Бот для игры в крестики-нолики
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

const appUrl = 'https://cream44luv.github.io/tictactoe-telegram/';

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '🎮 Добро пожаловать в игру "Крестики-нолики"!', {
        reply_markup: {
            inline_keyboard: [[
                { text: '🎮 Открыть игру', web_app: { url: appUrl } }
            ]]
        }
    });
});

// Обработка данных из Mini App
bot.on('web_app_data', (msg) => {
    try {
        const data = JSON.parse(msg.web_app_data.data);
        console.log('Получены данные:', data);
        
        if (data.action === 'invite') {
            const friendUsername = data.opponent_username.replace('@', '');
            const gameId = data.game_id;
            
            // Ссылка прямо на игру с параметрами
            const gameUrl = `${appUrl}?game=${gameId}&inviter=${data.inviter_username}`;
            
            // Пытаемся найти пользователя по юзернейму
            bot.getChat(`@${friendUsername}`).then((chat) => {
                // Отправляем приглашение другу с ссылкой сразу на игру
                bot.sendMessage(chat.id, 
                    `🎮 ${data.inviter_name} (@${data.inviter_username}) приглашает вас сыграть в крестики-нолики!\n\n👉 **Нажмите кнопку ниже, чтобы сразу перейти в игру**`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '🎮 Перейти в игру', web_app: { url: gameUrl } }
                        ]]
                    }
                });
                
                // Подтверждение отправителю
                bot.sendMessage(msg.chat.id, `✅ Приглашение отправлено пользователю @${friendUsername}`);
                
            }).catch(() => {
                bot.sendMessage(msg.chat.id, 
                    `❌ Пользователь @${friendUsername} не найден или не начинал диалог с ботом.\n\n👉 Отправь ему ссылку: ${gameUrl}`);
            });
        }
    } catch (error) {
        console.error('Ошибка обработки web_app_data:', error);
    }
});

// Обработка нажатий на кнопки
bot.on('callback_query', (query) => {
    const data = query.data;
    const chatId = query.message.chat.id;
    
    if (data === 'decline') {
        bot.sendMessage(chatId, '❌ Вы отклонили приглашение');
    }
    
    bot.answerCallbackQuery(query.id);
});

// Веб-сервер для Render
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
    res.send('🤖 Бот для крестиков-ноликов работает!');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Веб-сервер для Render запущен на порту ${PORT}`);
});

console.log('🤖 Бот запущен и готов к работе!');