const { createApp } = require('./app');

const PORT = Number(process.env.PORT || 4000);
const app = createApp();

const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`emberquest-server listening on ${HOST}:${PORT}`);
});
