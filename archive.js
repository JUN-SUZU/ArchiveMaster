const { entersState, AudioPlayerStatus, AudioReceiveStream, createAudioPlayer, createAudioResource, EndBehaviorType,
    joinVoiceChannel, getVoiceConnection, NoSubscriberBehavior, StreamType } = require('@discordjs/voice');
const ffmpeg = require('fluent-ffmpeg');
class archive {
    constructor() {
        this.recordingChannels = {};// チャンネルIDとアーカイブIDを紐づける。キーはチャンネルID。
        this.recordingArchives = {};// チャットデータと音声データのファイル名を紐づける。キーはアーカイブID。その他情報も格納する。
        this.guildsVoiceConnections = {};// ギルドIDとボイスコネクションを紐づける。キーはギルドID。
    }

    getArchiveId(name) {
        // アーカイブ名からアーカイブIDを取得する
        for (const archiveId in this.recordingArchives) {
            if (this.recordingArchives[archiveId].name === name) {
                return archiveId;
            }
        }
        return null;
    }

    startArchive(interaction, name, archiveId) {
        // アーカイブを開始する
        if (archiveId) {
            interaction.reply(`アーカイブ「${name}」は既に開始されています。`);
            return;
        }
        if (this.recordingChannels[interaction.channel.id]) {
            interaction.reply('このチャンネルは既にアーカイブ中です。');
            return;
        }
        archiveId = Math.random().toString(36).substring(7);
        this.recordingChannels[interaction.channel.id] = archiveId;
        this.recordingArchives[archiveId] = {
            name: name,
            proprietary: interaction.user.id,
            guild: interaction.guild.id,
            status: 'recording',
            channels: [],
            chatData: [],
            voiceData: []
        };
        interaction.reply(`アーカイブ「${name}」を開始しました。`);
    }

    addChannel(interaction, name, channel, archiveId) {
        // アーカイブにチャンネルを追加する
        if (channel.type === 'GUILD_VOICE') {
            if (this.guildsVoiceConnections[channel.guild.id]) {
                interaction.reply('既に別のアーカイブで音声チャンネルが使用されています。');
                return;
            }
            joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false,
                timeout: 10 * 1000
            })
                .receiver.speaking.on('start', (userId) => {
                    const archiveId = this.recordingChannels[channel.id];
                    if (!archiveId) return;
                    const archiveData = this.recordingArchives[archiveId];
                    archiveData.voiceData.push({
                        timestamp: Date.now(),
                        user: userId,
                        speaking: true
                    });
                    const audioStream = receiver.subscribe(userId, { end: { behavior: EndBehaviorType.AfterSilence, duration: 1000 } });
                    // 音声データをファイルに保存する
                    // pcm形式の音声データをwav形式に変換して保存する
                    const name = `${archiveId}-${userId}-${Date.now()}.wav`;
                    const writeStream = fs.createWriteStream(`./audio/${name}`);
                    // ffmpegを使用してpcm形式の音声データをwebm形式に変換する
                    const ffmpegCommand = ffmpeg();
                    audioStream.pipe(ffmpegCommand);
                    ffmpegCommand
                        .inputFormat('s32le')
                        .audioFrequency(48000)
                        .audioChannels(2)
                        .format('wav')
                        .pipe(writeStream);
                    audioStream.on('end', () => {
                        writeStream.end();
                        ffmpegCommand.kill();
                    });
                })
        }
        this.recordingChannels[channel.id] = archiveId;
        this.recordingArchives[archiveId].channels.push(channel.id);
        this.guildsVoiceConnections[channel.guild.id] = channel.id;
        interaction.reply(`アーカイブ「${name}」にチャンネル「${channel.name}」を追加しました。`);
    }

    pauseArchive(interaction, name, archiveId) {
        // アーカイブを一時停止する
        this.recordingArchives[archiveId].status = 'paused';
        interaction.reply(`アーカイブ「${name}」を一時停止しました。`);
    }

    resumeArchive(interaction, name, archiveId) {
        // アーカイブを再開する
        this.recordingArchives[archiveId].status = 'recording';
        interaction.reply(`アーカイブ「${name}」を再開しました。`);
    }

    stopArchive(interaction, name, archiveId) {
        // アーカイブを停止する
        if (this.guildsVoiceConnections[interaction.guild.id]) {
            // ボイスコネクションを切断する
            interaction.guild.me.voice.disconnect();
            delete this.guildsVoiceConnections[interaction.guild.id];
        }
        this.recordingArchives[archiveId].status = 'stopped';
        interaction.reply(`アーカイブ「${name}」を停止しました。`);
    }
}

module.exports = archive;
