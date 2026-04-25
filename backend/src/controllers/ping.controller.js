export const ping = async (_req, res) => {
  res.json({ success: true, message: 'pong' });
};

