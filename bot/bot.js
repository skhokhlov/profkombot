'use strict';

const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
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

// Login widget events
bot.on('connected_website', ({reply}) => reply('Website connected'));

// Telegram passport events
bot.on('passport_data', ({reply}) => reply('Telegram password connected'));

bot.command('api', (ctx) => request('http://api:5000/', (error, res, body) => {
    return ctx.reply(body).catch(err => console.error(err));
}));

bot.hears(/ржд|Ржд (.+)/, ({match, reply, session}) => {
    const phone = Number(match[1]);
    session.userPhone = session.userPhone || null;
    session.requestCounter = session.requestCounter | 0;

    if (session.userPhone !== phone && session.requestCounter <= 3) {
        session.userPhone = phone;
        session.requestCounter++;
    }

    if (session.requestCounter <= 3 || session.userPhone === phone) {
        request(`http://api:5000/api/v1/user/${phone}`, (error, res, body) => {
            reply(body).catch(err => console.error(err));
        });
    } else {
        reply('Превышен лимит запросов разных номеров');
    }
});

// Start polling
bot.startPolling();