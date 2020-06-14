const { Client, MessageEmbed } = require('discord.js');
const bot = new Client();
const yts = require('yt-search');
const ytdl = require('ytdl-core')
require('colors');
const config = require('./config.json');

queue = [];
vol = 1;
let embed = new MessageEmbed();
let prefix = config.prefix;
let kek;

bot.on('ready' , () => {
    console.log('Connected'.green,`Invite link: https://discord.com/oauth2/authorize?client_id=${bot.user.id}&scope=bot&permissions=8`)
})

bot.on('message', async msg => {
    
    if (!msg.content.toLocaleLowerCase().startsWith(prefix)) return;
    if (msg.author.bot || msg.channel.type === 'dm') return;

    const args = msg.content.toLocaleLowerCase().substring(prefix.length).split(' ');

    switch(args[0]){

        case 'ping':
            embed = new MessageEmbed();
            embed.addField('Bot ping', Math.round(bot.ws.ping));
            embed.setColor('RED');
            msg.channel.send(embed);
            break;

        case 'play':
            if(!msg.member.voice.channel) return msg.channel.send('Join a voice channel first');
            if(!args[1]) return msg.channel.send('Supply either a search query or a url for me to play music');
            init(msg,queue)
            kek = msg;
            break;

        case 'np':
            if(queue.length){
                const np = await ytdl.getInfo(queue[0]);
                msg.channel.send('Currently playing '+ `${np.title}`);
            } else{
                msg.channel.send("There's nothing playing at the momment");
            }
            
    }
})


/*
///////
////////////
//////////////////////////
////////////////////////////////
///////////////////////
                     Don't mess with the part below or you might break the bot
/////////////////////
///////////////////////
///////////////////////////
//////////////////////////////////////////////////
/////////////////////////////////////
/////////////////////////////
///////////////////////////////////////
*/
async function init (msg, queue){
    const args = msg.content.substring(prefix.length).split(' ');
    query = args.slice(1).join(' ');
    if(queue.length){
        if(args[1].match(/^https?:\/\/(www.youtube.com|youtube.com)\/watch(.*)$/)){
            queue.push(args[1])
            console.log(queue)
            const np = await ytdl.getInfo(args[1]);
            msg.channel.send( `${np.title}`+ ' was added to the queue');   
        }
        else {
            yts(query , function(err , r , callback){
                if(err) return msg.channel.send('An error occured , please try again');
                const videos = r.videos
                videos.onload = () => callback(videos)
                queue.push(videos[0].url)
                msg.channel.send(videos[0].title + ' has been added to the queue');
            })
        } 
    }else{
        if(args[1].match(/^https?:\/\/(www.youtube.com|youtube.com)\/watch(.*)$/)){
            queue.push(args[1]);
            console.log(queue);
            const np = await ytdl.getInfo(args[1]);
            msg.channel.send('Currently playing '+ `${np.title}`);
            play(msg,queue)  
        }else{
        yts(query , function(err , r , callback){
            if(err) return msg.channel.send('An error occured , please try again');
            const videos = r.videos
            videos.onload = () => callback(videos)
            queue.push(videos[0].url)
            msg.channel.send('Playing '+videos[0].title);
        play(msg,queue)
        })
    }
    }
}

async function play  (msg, queue){
        const connection = await msg.member.voice.channel.join();
        const dispatcher = connection.play(ytdl(queue[0], { filter: 'audioonly' }) , {volume : vol})
        const filter = m => m.content;
        let collector = msg.channel.createMessageCollector(filter);
        collector.on('collect', m => {
            if (m.content.startsWith(prefix + 'pause')) {
                msg.channel.send('Paused')
                .then(() => {dispatcher.pause();});
            } else if (m.content.startsWith(prefix + 'resume')){
                msg.channel.send('Resumed')
                .then(() => {dispatcher.resume();});
            } else if (m.content.startsWith(prefix + 'skip')){
                msg.channel.send('Skipped')
                .then(() => {
                    dispatcher.end();
                });
            } else if (m.content.startsWith(prefix+'volume')){
                const nargs = m.content.toLocaleLowerCase().substring(prefix.length).split(' ');
                if(!nargs[1]){
                     msg.channel.send('Current volume: '+ dispatcher.volume*100 + '/200' );
                }else{
                if(nargs[1] > 200 || nargs[1] < 0) { 
                    msg.channel.send('Volume can only range from 0 to 200');
                }else{
                dispatcher.setVolume(nargs[1]*0.01);
                msg.channel.send('Volume set to:' + dispatcher.volume*100 );
                vol = dispatcher.volume;
                }
                }
            } 
        }) 
            dispatcher.on('finish', () => {
                collector.stop()
                queue.shift()
                if(queue.length){
                whydoiexist(kek,queue)
                }else{
                    msg.channel.send('Playback finished')
                    msg.member.voice.channel.leave();
                }

            })
}

function whydoiexist(kek,queue){
    play(kek,queue)
}

bot.on('error', err => {
    if (err.msg === 'ECONNRESET' || err.msg === 'ERROR' || err.statusCode === 520 || !err.msg) return;
    console.log(err);
});

bot.login(config.token)