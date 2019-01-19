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

bot.command('start', ({reply}) => {
    reply('Бот Профокма студентов РТУ МИРЭА. Бот работает в тестовом режиме.');
});

bot.on('document', ({reply, session, message, telegram}) => {
    if (/^ржд$/.test(message.caption.toLowerCase())){
        request.post({
            url: `${api}rzd`,
            file: telegram.getFile(message.document.file_id)
        }, (err, res, body) => {
            if (err) {
                console.error(`${api}rzd\n ${err}`);
                return sendError(reply);

            }

            console.log('RZD update success');
            reply('База обновлена')
        });
    }
});

// Start polling
bot.startPolling();