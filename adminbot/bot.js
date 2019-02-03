'use strict';

const fs = require('fs');

const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const session = require('telegraf/session');
const request = require('request');
const csv = require("csvtojson");
const {reply} = Telegraf;

const bot = new Telegraf(process.env.BOT_TOKEN);
const api = 'http://api:5000/api/v1/';

const sendError = (reply, err) => {
    console.error(err);
    reply('Произошла ошибка').catch((err) => console.error(err));
};

const makeUpTel = (tel) => parseInt(tel.replace(/^8/, 7));

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
    if (message.caption == null) {
        return reply('Для корректной работы нужно отправить файл с подписью');
    }

    if (/^(ржд|rzd)$/.test(message.caption.toLowerCase())) {
        reply('Обновление базы РЖД');
        telegram.getFile(message.document.file_id).then(({file_path}) => {
            const writable = fs.createWriteStream('rzd.csv');
            let stream = request.get(`https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file_path}`)
                .pipe(writable);

            stream.on('finish', () => {
                csv()
                    .fromFile('rzd.csv')
                    .then((data) => {
                        let set = new Set();
                        for (let row in data) {
                            set.add(makeUpTel(data[row]['Мобильный телефон']))
                        }

                        request({
                            method: 'PUT',
                            uri: `${api}rzd`,
                            form: {phone_numbers: JSON.stringify([...set])}
                        }, (err, res, body) => {
                            if (err && res.statusCode !== 200) {
                                return sendError(reply, err);
                            }

                            console.log('RZD update success');
                            reply('База обновлена');

                        });

                        writable.close();
                        fs.unlinkSync('rzd.csv');
                    }).catch((err) => sendError(reply, err))
            });
        }).catch((err) => sendError(reply, err));

    } else if (/^(дотации|subsidies)$/.test(message.caption.toLowerCase())) {
        reply('Обновление базы дотаций');
        telegram.getFile(message.document.file_id).then(({file_path}) => {
            const writable = fs.createWriteStream('subsidies.csv');
            let stream = request.get(`https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file_path}`)
                .pipe(writable);

            stream.on('finish', () => {
                csv()
                    .fromFile('subsidies.csv')
                    .then((data) => {
                        let set = new Set();
                        for (let row in data) {
                            set.add(makeUpTel(data[row]['Мобильный телефон']))
                        }

                        request({
                            method: 'PUT',
                            uri: `${api}subsidies`,
                            form: {phone_numbers: JSON.stringify([...set])}
                        }, (err, res, body) => {
                            if (err && res.statusCode !== 200) {
                                return sendError(reply, err);
                            }

                            console.log('SUBSIDIES update success');
                            reply('База обновлена');

                        });

                        writable.close();
                        fs.unlinkSync('subsidies.csv');
                    }).catch((err) => sendError(reply, err))
            });
        }).catch((err) => sendError(reply, err));
    }
});

// Start polling
bot.startPolling();