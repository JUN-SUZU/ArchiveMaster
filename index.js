const config = require('./config.json');
// discord.js
const { ActionRowBuilder, ActivityType, ChannelType, Client, Collection, EmbedBuilder, Events, GatewayIntentBits,
    PermissionsBitField, getUserAgentAppendix } = require('discord.js');
// http
const http = require('http');
// archive.js
const archive = require('./archive');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageTyping
    ]
});

client.on('guildCreate', async (guild) => {
    console.log(`Joined guild ${guild.name}`);
    registerSlashCommands(guild);
});

function registerSlashCommands(guild) {
    const commands = [];
    const commandFiles = fs.readdirSync(path.join(__dirname, './discordCommands')).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./discordCommands/${file}`);
        commands.push(command.data.toJSON());
        guild.commands.create(command.data);
    }
    console.log(`Command registration completed in ${guild.name}`);
}

client.on('guildDelete', async (guild) => {
    console.log(`Left guild ${guild.name}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand() || interaction.commandName !== 'archive') return;
    const subCommand = interaction.options.getSubcommand();
    const name = interaction.options.getString('name');
    // nameに特殊文字が含まれている場合はエラーを返す
    if (name.match(/[\\/:*?"<>|]/)) {
        interaction.reply('アーカイブ名に特殊文字を含めることはできません。');
        return;
    }
    const archiveId = archive.getArchiveId(name);
    if (!archiveId && subCommand !== 'start') {
        interaction.reply(`アーカイブ「${name}」は存在しません。`);
        return;
    }
    switch (subCommand) {
        case 'start':
            archive.startArchive(interaction, name, archiveId);
            break;
        case 'add':
            const channel = interaction.options.getChannel('channel');
            archive.addChannel(interaction, name, channel, archiveId);
            break;
        case 'pause':
            archive.pauseArchive(interaction, name, archiveId);
            break;
        case 'resume':
            archive.resumeArchive(interaction, name, archiveId);
            break;
        case 'stop':
            archive.stopArchive(interaction, name, archiveId);
            break;
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.id === client.user.id) return;
    const archiveId = archive.recordingChannels[message.channel.id];
    if (!archiveId) return;
    const archiveData = archive.recordingArchives[archiveId];
    archiveData.chatData.push({
        timestamp: message.createdTimestamp,
        user: message.author.id,
        content: message.content,
        attachments: message.attachments.map(attachment => attachment.url)
    });
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    if (oldState.channelId === newState.channelId) return;
    const archiveId = archive.recordingChannels[newState.channelId];
    if (!archiveId) return;
    const archiveData = archive.recordingArchives[archiveId];
    if (oldState.channelId) {
        archiveData.voiceData.push({
            timestamp: Date.now(),
            user: oldState.member.id,
            action: 'leave'
        });
    }
    if (newState.channelId) {
        archiveData.voiceData.push({
            timestamp: Date.now(),
            user: newState.member.id,
            action: 'join'
        });
    }
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    await client.guilds.fetch();
});
