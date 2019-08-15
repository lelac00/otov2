const Discord = require("discord.js");
const client = new Discord.Client();
const prefix = "&";
const ytdl = require('ytdl-core');
const queue = new Map();
 
client.on("ready", () => {
  console.log("ready");
  client.user.setStatus('online');
  client.user.setActivity("play music and more!", { type: 'LISTENING' });
}); 

// coffee
 
client.on("message", (message) => {
  if (message.content.startsWith(prefix + "coffee")) {
    message.channel.send("Voici votre café, " + message.author.toString(), {files: ["./gi.gif"]});
  }
});

client.on("message", (message) => {
  if (message.content.startsWith(prefix + "help")) {
    message.channel.send("```!play + URL / Jouer de la musique en salon vocal\n!skip / Passe à la musique suivante\n!stop / Arrête complétement la musique et réinitialise la file```");
  }
});

// music

client.once('reconnecting', () => {
	console.log('Reconnexion!');
});

client.once('disconnect', () => {
	console.log('Deconnexion!');
});

client.on('message', async message => {
	if (message.author.bot) return;
	if (!message.content.startsWith(prefix)) return;

	const serverQueue = queue.get(message.guild.id);

	if (message.content.startsWith(`${prefix}play`)) {
		execute(message, serverQueue);
		return;
	} else if (message.content.startsWith(`${prefix}skip`)) {
		skip(message, serverQueue);
		return;
	} else if (message.content.startsWith(`${prefix}stop`)) {
		stop(message, serverQueue);
		return;
	} else if (message.content.startsWith(`${prefix}help`)) {
		stop(message, serverQueue);
		return;
	} else if (message.content.startsWith(`${prefix}coffee`)) {
		stop(message, serverQueue);
		return;
	} else {
		message.channel.send('')
	}
});

async function execute(message, serverQueue) {
	const args = message.content.split(' ');

	const voiceChannel = message.member.voiceChannel;
	if (!voiceChannel) return message.channel.send("Il faut être dans un salon vocal pour pouvoir écouter de la musique, c'est pas assez logique pour toi ?");
	const permissions = voiceChannel.permissionsFor(message.client.user);
	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return message.channel.send("Je n'ai pas les permissions suffisantes pour rejoindre... ):");
	}

	const songInfo = await ytdl.getInfo(args[1]);
	const song = {
		title: songInfo.title,
		url: songInfo.video_url,
	};

	if (!serverQueue) {
		const queueContruct = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true,
		};

		queue.set(message.guild.id, queueContruct);

		queueContruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueContruct.connection = connection;
			play(message.guild, queueContruct.songs[0]);
		} catch (err) {
			console.log(err);
			queue.delete(message.guild.id);
			return message.channel.send(err);
		}
	} else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		return message.channel.send(`${song.title} has been added to the queue!`);
	}

}

function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}

	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', () => {
			console.log('Fin de liste, fin de service!');
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => {
			console.error(error);
		});
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}
 
client.login("NTQyMDc1NTk0MzYwNDg3OTc2.XPz75A.KZZqXHvB0PS06IFLsTcR9kg0zcc");


