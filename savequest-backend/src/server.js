const app = require('./app');
const config = require('./config');

const PORT = config.port || 5000;

app.listen(PORT, () => {
  console.log(`SaveQuest backend running on port ${PORT}`);
});
