const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('archive')
		.setDescription('アーカイブに関するコマンドです。')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('アーカイブを開始します。')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('アーカイブにチャンネルを追加します。')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('追加するチャンネル')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand => 
            subcommand
                .setName('pause')
                .setDescription('アーカイブを一時停止します。')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('resume')
                .setDescription('アーカイブを再開します。')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('アーカイブを停止します。')
        )
        .addStringOption(option =>
            option
                .setName('name')
                .setDescription('アーカイブ名')
                .setRequired(true)
        ),
};
