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

class User {
    get last_name() {
        return this._last_name;
    }

    set last_name(value) {
        this._last_name = value;
    }

    get id() {
        return this._id;
    }

    get first_name() {
        return this._first_name;
    }

    set first_name(value) {
        this._first_name = value;
    }

    set tel(value) {
        this._tel = parseInt(value);
    }

    get tel() {
        return this._tel;
    }

    constructor(parsedData) {
        // let parsedData = JSON.parse(data)[0];
        this._id = parsedData.id;
        this._tel = parseInt(parsedData.tel);
        this._first_name = parsedData.first_name;
        this._last_name = parsedData.last_name;
    }
}

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
    return reply('Теперь вы можете проверить наличие в базе',
        Extra.markup((markup) => {
            return markup.resize().keyboard([
                markup.callbackButton('РЖД бонус', 'ржд бонус'),
                markup.callbackButton('Мои данные', 'Мои данные')
            ])
        }));
}

/**
 * Update phone number associated with user and send requestKeyboard()
 * @param reply
 * @param session
 * @param message
 */
function updatePhone(reply, session, message) {
    request.post(`${api}chat/${message.chat.id}/tel/${session.user.tel}`, (err, res, body) => {
        if (err) {
            console.error(`${api}chat/${message.chat.id}/tel/${session.user.tel}\n ${err}`);
            return sendError(reply);

        }

        if (res.statusCode === 200) {
            return requestKeyboard(reply);

        } else {
            console.error(`Response code of ${api}chat/${message.chat.id}/tel/${session.user.tel} is not 200`);
            return sendError(reply);

        }
    });
}

function getUser(reply, session, message) {
    request.get(`${api}user/${session.user.tel}`, (err, res, body) => {
        if (err) {
            console.error(`${api}chat/${message.chat.id}/tel/${session.user.tel}\n ${err}`);
            return sendError(reply);

        }

        if (res.statusCode === 200) {
            let data = JSON.parse(body)[0];
            session.user = new User(data);
            return reply(`${session.user.tel} + ${session.user.first_name} есть в базе РЖД бонус`).catch(err => console.error(err));

        } else {
            return sendError(reply);

        }
    });
}

// // Register session middleware
bot.use(session());

// Register logger middleware
bot.use((ctx, next) => {
    const start = new Date();
    return next().then(() => {
        let ms = new Date() - start;
        console.log('response time %sms', ms)
    })
});

bot.command('start', (ctx) => requestContact(ctx.reply));

bot.on('contact', ({reply, session, message}) => {
    session.userPhone = session.userPhone || null;
    session.requestCounter = session.requestCounter | 0;

    if (session.userPhone !== message.contact.phone_number && session.requestCounter <= 3) {
        session.userPhone = Number(message.contact.phone_number.replace('+', '').replace(/^8/, 7));
        session.requestCounter++;
    }

    if (!(session.requestCounter <= 3 || session.userPhone === message.contact.phone_number)) {
        return reply('Превышен лимит запросов разных номеров');
    } else {
        return reply('Теперь вы можете проверить наличие в базе', Extra.markup((markup) =>
            markup.resize().keyboard([
                markup.callbackButton('РЖД бонус', 'ржд бонус')
            ])
        ));
    }
});

bot.command('api', (ctx) => request(api, (error, res, body) => {
    return ctx.reply(body).catch(err => console.error(err));
}));

bot.hears(/Мои данные/, ({reply, session}) => reply(session.userPhone || 'null'));

bot.hears(/(ржд|Ржд|РЖД) бонус/, ({match, reply, session}) => {
    if (session.userPhone != null) {
        request(`${api}user/${session.userPhone}`, (error, res, body) => {
            const data = JSON.parse(body);
            if (data[0][0] === 'status' && data[0][1] === 'OK') {
                reply(`${data[1][2]} есть в базе РЖД бонус`).catch(err => console.error(err));
            } else {
                reply('Произошла ошибка').catch(err => console.error(err));
            }
        })
    } else {
        requestContact(reply);
    }
});

// Start polling
bot.startPolling();