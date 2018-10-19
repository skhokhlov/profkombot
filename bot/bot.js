'use strict';

const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup')
const session = require('telegraf/session');
const request = require('request');
const {reply} = Telegraf;

const bot = new Telegraf(process.env.BOT_TOKEN);

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

bot.command('start', (ctx) => {
    return ctx.reply('Special buttons keyboard', Extra.markup((markup) => {
        return markup.resize()
            .keyboard([
                markup.contactRequestButton('Send contact')
            ])
    }))
});

bot.on('contact', ({reply, session, message}) => {
    session.userPhone = session.userPhone || null;
    session.requestCounter = session.requestCounter | 0;

    if (session.userPhone !== message.contact.phone_number && session.requestCounter <= 3) {
        session.userPhone = message.contact.phone_number;
        session.requestCounter++;
    }

    if (!(session.requestCounter <= 3 || session.userPhone === message.contact.phone_number)) {
        return reply('Превышен лимит запросов разных номеров');
    } else {
        return reply('Ok');
    }
});

// Login widget events
bot.on('connected_website', ({reply}) => reply('Website connected'));

// Telegram passport events
bot.on('passport_data', ({reply}) => reply('Telegram password connected'));

bot.command('api', (ctx) => request('http://api:5000/', (error, res, body) => {
    return ctx.reply(body).catch(err => console.error(err));
}));

bot.command('me', (ctx) => {
    return ctx.reply(ctx.session.userPhone || 'null');
});

bot.hears(/ржд|Ржд/, ({match, reply, session}) => {
    request(`http://api:5000/api/v1/user/${session.userPhone}`, (error, res, body) => {
        reply(body).catch(err => console.error(err));
    })
});

// Start polling
bot.startPolling();