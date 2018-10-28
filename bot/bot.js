'use strict';

const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const session = require('telegraf/session');
const request = require('request');
const {reply} = Telegraf;

const bot = new Telegraf(process.env.BOT_TOKEN);
const api = 'http://api:5000/api/v1/';

function requestContact(reply) {
    return reply('Отправтье свой контакт, чтобы по номеру телефона найти информацию в базе',
        Extra.markup((markup) => {
            return markup.resize()
                .keyboard([
                    markup.contactRequestButton('Отправить контакт')
                ])
        }));
}

// // Register session middleware
bot.use(session());

// Register logger middleware
bot.use((ctx, next) => {
    const start = new Date();
    return next().then(() => {
        const ms = new Date() - start;
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

bot.command('me', (ctx) => {
    return ctx.reply(ctx.session.userPhone || 'null');
});

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