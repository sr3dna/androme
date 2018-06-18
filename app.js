const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use('/build', express.static(path.join(__dirname, 'build')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));
app.use('/demos', express.static(path.join(__dirname, 'demos')));
app.use('/demos-dev', express.static(path.join(__dirname, 'demos-dev')));

app.listen(port, () => { console.log(`Express server listening on port ${port}`); });