export default {
    data: {
        name: 'ping',
        description: 'Ping!',
    },
    async execute(interaction) {
        await interaction.reply('Pong!');
    },
};
//# sourceMappingURL=ping.js.map