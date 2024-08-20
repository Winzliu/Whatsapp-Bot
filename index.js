const { Client, Location, Poll, List, Buttons, LocalAuth } = require('whatsapp-web.js');
const OpenAI = require("openai");
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
    authStrategy: new LocalAuth(),
    // proxyAuthentication: { username: 'username', password: 'password' },
    puppeteer: { 
        // args: ['--proxy-server=proxy-server-that-requires-authentication.example.com'],
        headless: false,
    }
});

// client initialize does not finish at ready now.ka
client.initialize();

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});


// Pairing code only needs to be requested once
let pairingCodeRequested = false;
client.on('qr', async (qr) => {
    // NOTE: This event will not be fired if a session is specified.
    console.log('QR RECEIVED', qr);
    
    // paiuting code example
    const pairingCodeEnabled = false;
    if (pairingCodeEnabled && !pairingCodeRequested) {
        const pairingCode = await client.requestPairingCode('08123456789'); // enter the target phone number
        console.log('Pairing code enabled, code: '+ pairingCode);
        pairingCodeRequested = true;
    }
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', async () => {
    console.log('READY');
    const debugWWebVersion = await client.getWWebVersion();
    console.log(`WWebVersion = ${debugWWebVersion}`);
    
    client.pupPage.on('pageerror', function(err) {
        console.log('Page error: ' + err.toString());
    });
    client.pupPage.on('error', function(err) {
        console.log('Page error: ' + err.toString());
    });
    
});

const DB = 'http://localhost:3001/conversations';
let conversationHistory = [];

client.on('message', async msg => {
    // history chat
    try{
        const response = await fetch(DB);
        if(!response.ok) {
            throw new Error('Something went wrong');
        };
        conversationHistory = await response.json();
    }catch(err){
        console.log(err);
    }

    if (msg.body === '!ping reply') {
        // Send a new message as a reply to the current one
        msg.reply('pong');

    } else if (msg.body === '!ping') {
        // Send a new message to the same chat
        client.sendMessage(msg.from, 'pong');

    } else if (msg.body.startsWith('!sendto ')) {
        try {
            // Direct send a new message to specific id
            let number = msg.body.split(' ')[1];
            let messageIndex = msg.body.indexOf(number) + number.length;
            let message = msg.body.slice(messageIndex, msg.body.length);
            number = number.includes('@c.us') ? number : `${number}@c.us`;
            let chat = await msg.getChat();
            await chat.sendSeen();
            await client.sendMessage(number, message);
            await client.sendMessage(msg.from, "Pesan berhasil terkirim");
        } catch (err) {
            client.sendMessage(msg.from, 'Pastikan nomor tidak salah dan menggunakan format !{perintah} {nomor dipisah dengan koma tanpa spasi} {pesan}');
        }
    } else if (msg.body.startsWith('!broadcastnameto ')) {
            // Direct send a new message to specific id
            let commandParts = msg.body.split(' ');
            let numberNames = commandParts[1].split(',');
    
            let numbers = [];
            let names = [];
    
            numberNames.forEach(async (number) => {
            if(number.includes(':')) {
                [angka, nama] = number.split(':');
                numbers.push(angka);
                nama = nama.replace(/#/g, ' ');
                names.push(nama);
            }else{
                numbers.push(number);
                names.push(number);
            }
        });
    
            let messageIndex = msg.body.indexOf(commandParts[2]);
            let message = msg.body.slice(messageIndex, msg.body.length);
    
            numbers.forEach(async (number, index) => {
            number = number.includes('@c.us') ? number : `${number}@c.us`;
            let chat = await msg.getChat();
            await chat.sendSeen();
            setTimeout(async () => {
                try{
                    await client.sendMessage(number, "Halo, " + names[index] + '. ' + message);
                    await client.sendMessage(msg.from, "Pesan berhasil terkirim");
                }catch(err){
                    client.sendMessage(msg.from, 'Pastikan nomor tidak salah dan menggunakan format !{perintah} {nomor dipisah dengan koma tanpa spasi} {pesan}');
                }
            }, 1000);
        });
    }else if (msg.body.startsWith('!broadcastto ')) {
        // Direct send a new message to specific id
        let commandParts = msg.body.split(' ');
        let numbers = commandParts[1].split(',');

        let messageIndex = msg.body.indexOf(commandParts[2]);
        let message = msg.body.slice(messageIndex, msg.body.length);

        numbers.forEach(async (number) => {
            number = number.includes('@c.us') ? number : `${number}@c.us`;
            console.log(number);
            let chat = await msg.getChat();
            chat.sendSeen();
            setTimeout(async () => {
                try{
                    await client.sendMessage(number, message);
                    await client.sendMessage(msg.from, "Pesan berhasil terkirim");
                }catch(err){
                    client.sendMessage(msg.from, 'Pastikan nomor tidak salah dan menggunakan format !{perintah} {nomor dipisah dengan koma tanpa spasi} {pesan}');
                }
            }, 1000);
        });
    }   else if(msg.body === '!reset'){
        await fetch(`${DB}/${msg.from}`, {
            method : "DELETE",
            headers : {
                'Content-type' : 'application/json'
            }
        });

        client.sendMessage(msg.from, 'Reset AI Bot conversation history');
    }else {
        const apiKey = process.env.API_KEY;
        let chatCompletion = {}

        let historyObj = false;
        let history;
        let response;
        let responseData;
        conversationHistory.forEach(async element => {
            if(element.id == msg.from){
                historyObj = element;
            }
        });

        if (historyObj) {
            history = historyObj.data;
        } else {
            try{
                const body = {
                    id: msg.from,
                    data: [{
                        role: 'user',
                        content: 'Gunakan Bahasa Indonesia untuk menjawab pertanyaan apapun dari saya kecuali saya menyuruh kamu untuk melakukan translate atau penerjemaan ke bahasa lain'
                    },
                    {
                        role: 'assistant',
                        content: 'Selamat datang! Saya siap membantu Anda dengan pertanyaan apapun dalam Bahasa Indonesia. Tinggalkan pertanyaan Anda, dan saya akan menjawab secepatnya.'
                    }]
                };

                const historyObj = await fetch(`${DB}`, {
                    method : "POST",
                    headers : {
                        'Content-type' : 'application/json'
                    },
                    body: JSON.stringify(body)
                });

                history = await historyObj.json();
                history = history.data;
            }catch (err) {
                console.log(err);
            }
        }

        if(msg.hasMedia){
            function extractText(data) {
                let extractedText = "";

                data.elements.forEach(element => {
                    if (element.text) {
                        extractedText += element.text + "\n\n"; 
                    }
                });

                return extractedText.trim();
            }

            const media = await msg.downloadMedia()

            const base64Data = media.data.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            // random filename
            const filename = './media/' + msg.from + '_' + Date.now() + "." + media.mimetype.split("/")[1];

            fs.writeFileSync(filename, buffer, (err) => {
                if (err) {
                    console.error('Error saving image:', err);
                } else {
                    console.log('Image saved successfully:', filename);
                }
            });

            const image = filename.replace("./media/", "D:/Alwin-Liufandy/Learning/Web-Back-End/WAJS/media/");

            let data = new FormData();
            data.append('document', fs.createReadStream(image));
            
            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'https://api.upstage.ai/v1/document-ai/layout-analysis',
                headers: { 
                    'Authorization': 'Bearer ' + apiKey, 
                    ...data.getHeaders()
                },
                data : data
            };
            
            axios.request(config)
            .then(async (response) => {
                const openai = new OpenAI({
                    apiKey: apiKey,
                    baseURL: 'https://api.upstage.ai/v1/solar'
                    })

                const requestUser = extractText(response.data) + "\n " + msg.body;

                history.push({
                    role: 'user',
                    content: requestUser
                });

                response = await fetch(`${DB}/${msg.from}`, {
                    method : "PATCH",
                    headers : {
                        'Content-type' : 'application/json'
                    },
                    body: JSON.stringify({
                        data: history
                    })
                });

                responseData = await response.json();

                // client.sendMessage(msg.from, extractText(response.data));
                chatCompletion = await openai.chat.completions.create({
                    model: 'solar-1-mini-chat',
                    messages: responseData.data,
                    stream: false
                });

                history.push({
                    role: 'assistant',
                    content: chatCompletion.choices[0].message.content
                });

                history = await fetch(`${DB}/${msg.from}`, {
                    method : "PATCH",
                    headers : {
                        'Content-type' : 'application/json'
                    },
                    body: JSON.stringify({
                        data: history
                    })
                });

                client.sendMessage(msg.from, chatCompletion.choices[0].message.content || '');
            })
            .catch((error) => {
                client.sendMessage(msg.from, "erorr: " + error);
            });            
        }else{
            const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: 'https://api.upstage.ai/v1/solar'
            })
    
            history.push({
                role: 'user',
                content: msg._data.quotedMsg ? msg._data.quotedMsg.body + "\n " + msg.body : msg.body
            });

            response = await fetch(`${DB}/${msg.from}`, {
                method : "PATCH",
                headers : {
                    'Content-type' : 'application/json'
                },
                body: JSON.stringify({
                    data: history
                })
            });

            responseData = await response.json();

            chatCompletion = await openai.chat.completions.create({
                model: 'solar-1-mini-chat',
                messages: responseData.data,
                stream: false
            });

            history.push({
                role: 'assistant',
                content: chatCompletion.choices[0].message.content
            });

            history = await fetch(`${DB}/${msg.from}`, {
                method : "PATCH",
                headers : {
                    'Content-type' : 'application/json'
                },
                body: JSON.stringify({
                    data: history
                })
            });

            client.sendMessage(msg.from, chatCompletion.choices[0].message.content || '');
        }
    }
    // end Ai chatbot
});