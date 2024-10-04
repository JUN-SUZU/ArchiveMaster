const config = require('./config.json');
// discord.js
const { ActionRowBuilder, ActivityType, ChannelType, Client, Collection, EmbedBuilder, Events, GatewayIntentBits, PermissionsBitField, getUserAgentAppendix } = require('discord.js');
// http
const http = require('http');

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

client.on('guildDelete', async (guild) => {
    console.log(`Left guild ${guild.name}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand() || interaction.commandName !== 'archive') return;
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

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    await client.guilds.fetch();
});
