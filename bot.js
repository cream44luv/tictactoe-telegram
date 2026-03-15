// Бот для игры в крестики-нолики
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

// URL твоего приложения
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
            
            // Пытаемся найти пользователя по юзернейму
            bot.getChat(`@${friendUsername}`).then((chat) => {
                // Отправляем приглашение другу
                bot.sendMessage(chat.id, 
                    `🎮 ${data.inviter_name} (@${data.inviter_username}) приглашает вас сыграть в крестики-нолики!\n\nИгра начнётся через 5 секунд после принятия.`, {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '✅ Принять игру', callback_data: `accept_${msg.chat.id}_${data.inviter_name}` },
                            { text: '❌ Отклонить', callback_data: 'decline' }
                        ]]
                    }
                });
                
                // Подтверждение отправителю
                bot.sendMessage(msg.chat.id, `✅ Приглашение отправлено пользователю @${friendUsername}`);
                
            }).catch((error) => {
                console.error('Ошибка поиска пользователя:', error);
                bot.sendMessage(msg.chat.id, 
                    `❌ Не удалось найти пользователя @${friendUsername}.\n\nУбедись, что:\n1️⃣ Друг написал боту команду /start\n2️⃣ Юзернейм введён правильно (без @)\n3️⃣ Друг не скрыл свой юзернейм в настройках`);
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
    
    if (data.startsWith('accept_')) {
        const parts = data.split('_');
        const inviterChatId = parts[1];
        const inviterName = parts[2];
        
        // Сообщение тому, кто принял
        bot.sendMessage(chatId, '✅ Вы приняли приглашение! Игра начинается...', {
            reply_markup: {
                inline_keyboard: [[
                    { text: '🎮 Перейти в игру', web_app: { url: appUrl } }
                ]]
            }
        });
        
        // Уведомление тому, кто пригласил
        bot.sendMessage(inviterChatId, `🎮 ${query.from.first_name} принял ваше приглашение! Игра начинается!`, {
            reply_markup: {
                inline_keyboard: [[
                    { text: '🎮 Перейти в игру', web_app: { url: appUrl } }
                ]]
            }
        });
        
    } else if (data === 'decline') {
        bot.sendMessage(chatId, '❌ Вы отклонили приглашение');
    }
    
    bot.answerCallbackQuery(query.id);
});

const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
    res.send('Бот работает!');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Веб-сервер для Render запущен на порту ${PORT}`);
});

console.log('🤖 Бот запущен и готов к работе!');