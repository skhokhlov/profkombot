'use strict';

const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const session = require('telegraf/session');
const request = require('request');
const {reply} = Telegraf;

const bot = new Telegraf(process.env.BOT_TOKEN);
const api = 'http://api:5000/api/v1/';

const sendError = (reply) => reply('Произошла ошибка').catch((err) => console.error(err));

const makeUpTel = (tel) => parseInt(tel.replace(/^\+7/, 8).replace(/^7/, 8));

/**
 * Send keyboard to user for the phone number request
 * @param reply
 * @returns {*}
 */
function requestContact(reply) {
    return reply('Отправтье свой контакт, чтобы по номеру телефона найти информацию в базе',
        Extra.markup((markup) => {
            return markup.resize()
                .keyboard([
                    markup.contactRequestButton('Отправить контакт')
                ])
        }));
}

/**
 * Send keyboard to user
 * @param reply
 * @returns {*} keyboard
 */
function requestKeyboard(reply) {
    return reply('Вы можете проверить наличие в базе',
        Extra.markup((markup) => {
            return markup.resize().keyboard([
                markup.callbackButton('РЖД бонус', 'ржд бонус'),
                // markup.callbackButton('Дотации', 'Дотации'),
                markup.callbackButton('Основное меню', 'Основное меню')
            ])
        }));
}

function mainMenu(reply) {
    return reply('Основное меню',
        Extra.markup((markup) => {
            return markup.resize()
                .keyboard([
                    [markup.callbackButton('Контакты отделений', 'Контакты отделений'),
                        markup.callbackButton('Часы работы', 'Часы работы'),],
                    [markup.callbackButton('Задать вопрос', 'Задать вопрос'),
                        markup.callbackButton('Статусы заявок', 'Статусы заявок')]
                ])
        }));
}

// Register session middleware
bot.use(session());

// Register logger middleware
bot.use((ctx, next) => {
    request.post(`${api}analytics/counter`);

    const start = new Date();
    return next().then(() => {
        let ms = new Date() - start;
        console.log('response time %sms', ms)
    })
});

bot.command('start', ({reply, message}) => {
    request({
        method: 'POST',
        uri: api + 'analytics',
        form: {user: JSON.stringify(message)}
    });

    reply('Бот Профокма студентов РТУ МИРЭА. Бот работает в тестовом режиме.');
    mainMenu(reply);
});

bot.on('contact', ({reply, session, message}) => {
    session.tel = makeUpTel(message.contact.phone_number);
    requestKeyboard(reply);
});

bot.hears(/Основное меню/, ({reply}) => mainMenu(reply));

bot.hears(/Задать вопрос/, ({reply}) => reply('Сейчас задать вопрос можно только в другом боте',
    Extra.markup((markup) => markup.inlineKeyboard([
        Markup.urlButton('Перейти️', 'https://t.me/mireaprofkomfeedbackbot')
    ]))));

bot.hears(/(ржд|Ржд|РЖД) бонус/, ({match, reply, session, message}) => {
    if (session.tel == null) {
        reply('Сначала нужно отправить номер телефона');
        return requestContact(reply);
    } else {
        request({
            method: 'POST',
            uri: api + 'analytics/rzd',
            form: {user: JSON.stringify(message)}
        });

        request.get(`${api}rzd/${session.tel}`, (err, res, body) => {
            if (err) {
                console.error(err);
                sendError(reply);

            }

            if (res.statusCode === 200) {
                return reply(`${session.tel} есть в базе РЖД бонус`).catch(err => console.error(err));

            } else if (res.statusCode === 404) {
                return reply(`${session.tel} не найден в базе РЖД бонус`);

            } else {
                return sendError(reply);

            }
        });
    }
});

bot.hears(/(дотации|Дотации)/, ({match, reply, session, message}) => {
    if (session.tel == null) {
        reply('Сначала нужно отправить номер телефона');
        return requestContact(reply);
    } else {
        request({
            method: 'POST',
            uri: api + 'analytics/subsidies',
            form: {user: JSON.stringify(message)}
        });

        request.get(`${api}subsidies/${session.tel}`, (err, res, body) => {
            if (err) {
                console.error(err);
                sendError(reply);

            }

            if (res.statusCode === 200) {
                return reply(`${session.tel} есть в базе дотаций`).catch(err => console.error(err));

            } else if (res.statusCode === 404) {
                return reply(`${session.tel} не найден в базе дотаций`);

            } else {
                return sendError(reply);

            }
        });
    }
});

bot.hears(/Контакты отделений/, ({match, reply, session}) => {
    reply(`Отделения Профкома студентов находтся в трех кампусах университета:\n
    Вернадского 78 ауд. А-170\n
    Вернадского 86 ауд. Л-117\n
    Стромынка 20 ауд. 411\n
    `)
});

bot.hears(/Часы работы/, ({match, reply, session}) => {
    reply(`Отделения Профкома студентов работают с 11 до 17 часов с понедельника по пятницу.`)
});

bot.hears(/Статусы заявок/, ({match, reply, session}) => requestKeyboard(reply));

// Start polling
bot.startPolling();