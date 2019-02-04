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

function updateIndex(telegram, reply, index) {
    telegram.getFile(message.document.file_id).then(({file_path}) => {
        const writable = fs.createWriteStream(`${index}.csv`);
        let stream = request.get(`https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file_path}`)
            .pipe(writable);

        stream.on('finish', () => {
            csv()
                .fromFile(`${index}.csv`)
                .then((data) => {
                    let set = new Set();
                    for (let row in data) {
                        set.add(makeUpTel(data[row]['Мобильный телефон']))
                    }

                    request({
                        method: 'PUT',
                        uri: api + index,
                        form: {phone_numbers: JSON.stringify([...set])}
                    }, (err, res, body) => {
                        if (err && res.statusCode !== 200) {
                            return sendError(reply, err);
                        }

                        console.log(`${index} update success`);
                        reply('База обновлена');

                    });

                    writable.close();
                    fs.unlinkSync(`${index}.csv`);
                }).catch((err) => sendError(reply, err))
        });
    }).catch((err) => sendError(reply, err));
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

bot.command('start', ({reply}) => {
    reply('Бот Профокма студентов РТУ МИРЭА. Бот работает в тестовом режиме.');
});

bot.on('document', ({reply, message, telegram}) => {
    if (message.caption == null) {
        return reply('Для корректной работы нужно отправить файл с подписью');
    }

    if (/^(ржд|rzd)$/.test(message.caption.toLowerCase())) {
        reply('Обновление базы РЖД');
        updateIndex(telegram, reply, 'rzd');

    } else if (/^(дотации|subsidies)$/.test(message.caption.toLowerCase())) {
        reply('Обновление базы дотаций');
        updateIndex(telegram, reply, 'subsidies');

    }
});

// Start polling
bot.startPolling();