exports.activate = (ctx) => {
  ctx.ui.showToast('Sample plugin enabled');

  ctx.command.register({
    id: 'sample.insert-tag',
    handler: async () => {
      const current = await ctx.storage.get('count');
      const next = current ? Number(current) + 1 : 1;
      await ctx.storage.set('count', String(next));
      ctx.ui.showToast('Sample command executed (' + next + ')');
    },
  });
};
