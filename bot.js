// Простой бот на Node.js (пример)
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Добро пожаловать в игру!', {
    reply_markup: {
      inline_keyboard: [[
        { text: '🎮 Открыть игру', web_app: { url: 'https://cream44luv.github.io/tictactoe-telegram/' } }
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
            // Ищем пользователя по юзернейму
            bot.getChat(`@${data.opponent_username}`).then((chat) => {
                // Отправляем приглашение сопернику
                bot.sendMessage(chat.id, 
                    `🎮 ${data.inviter_name} (@${data.inviter_username}) приглашает вас сыграть в крестики-нолики!`, {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '✅ Принять игру', callback_data: `accept_${msg.chat.id}_${data.inviter_name}` },
                            { text: '❌ Отклонить', callback_data: 'decline' }
                        ]]
                    }
                });
                
                // Подтверждение отправителю
                bot.sendMessage(msg.chat.id, `✅ Приглашение отправлено пользователю @${data.opponent_username}`);
            }).catch(() => {
                bot.sendMessage(msg.chat.id, `❌ Пользователь @${data.opponent_username} не найден или не начинал диалог с ботом`);
            });
        }
    } catch (error) {
        console.error('Ошибка обработки web_app_data:', error);
    }
});

// Обработка нажатий на кнопки (ТОЛЬКО ОДИН РАЗ!)
bot.on('callback_query', (query) => {
    const data = query.data;
    const chatId = query.message.chat.id;
    
    if (data.startsWith('accept_')) {
        const parts = data.split('_');
        const inviterChatId = parts[1];
        const inviterName = parts[2];
        
        bot.sendMessage(chatId, '✅ Вы приняли приглашение! Игра начинается...', {
            reply_markup: {
                inline_keyboard: [[
                    { text: '🎮 Перейти в игру', web_app: { url: 'https://cream44luv.github.io/tictactoe-telegram/' } }
                ]]
            }
        });
        
        // Уведомляем пригласившего
        bot.sendMessage(inviterChatId, `🎮 ${query.from.first_name} принял ваше приглашение! Игра начинается!`, {
            reply_markup: {
                inline_keyboard: [[
                    { text: '🎮 Перейти в игру', web_app: { url: 'https://cream44luv.github.io/tictactoe-telegram/' } }
                ]]
            }
        });
        
    } else if (data === 'decline') {
        bot.sendMessage(chatId, '❌ Вы отклонили приглашение');
    }
    
    bot.answerCallbackQuery(query.id);
});