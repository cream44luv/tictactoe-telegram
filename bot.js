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
// Обработка данных из Mini App
bot.on('web_app_data', (msg) => {
    try {
        const data = JSON.parse(msg.web_app_data.data);
        console.log('Получены данные:', data);
        
        if (data.action === 'invite') {
            // Отправляем приглашение сопернику
            bot.sendMessage(data.opponent_id, 
                `🎮 ${data.inviter_name} приглашает вас сыграть в крестики-нолики!\n\nИгра начнется через 5 секунд после принятия.`, {
                reply_markup: {
                    inline_keyboard: [[
                        { text: '✅ Принять и начать игру', callback_data: `accept_${data.inviter_id}` },
                        { text: '❌ Отклонить', callback_data: 'decline' }
                    ]]
                }
            });
            
            // Подтверждение отправителю
            bot.sendMessage(msg.chat.id, `✅ Приглашение отправлено пользователю @${data.opponent_username}. Ожидайте ответа...`);
        }
    } catch (error) {
        console.error('Ошибка обработки web_app_data:', error);
    }
});

// Обработка нажатий на кнопки
bot.on('callback_query', (query) => {
  const data = query.data;
  if (data.startsWith('accept_')) {
    const inviterId = data.split('_')[1];
    bot.sendMessage(query.from.id, 'Игра начинается!', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🎮 Перейти в игру', web_app: { url: 'https://YOUR_USERNAME.github.io/tictactoe-telegram-bot' } }
        ]]
      }
    });
  }
});