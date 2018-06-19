const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const uuid = require('uuid/v1');
const archiver = require('archiver');
const request = require('request');

const app = express();
const port = process.env.PORT || 3000;

app.set('port', port);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));
app.use('/demos', express.static(path.join(__dirname, 'demos')));
app.use('/temp', express.static(path.join(__dirname, 'temp')));

if (app.get('env') === 'development') {
    app.use('/build', express.static(path.join(__dirname, 'build')));
    app.use('/demos-dev', express.static(path.join(__dirname, 'demos-dev')));
}

app.post('/api/savetodisk', (req, res) => {
    const directory = (req.query.directory != null && req.query.directory !== '');
    const dirname = `${__dirname.replace(/\\/g, '/')}/temp/${uuid()}`;
    const diroutput = dirname + (directory ? `/${req.query.directory}` : '');
    const processingTime = ((!isNaN(parseInt(req.query.processingtime)) ? parseInt(req.query.processingtime) : 30) * 1000);
    const finalizeTime = Date.now() + processingTime;
    try {
        mkdirp.sync(diroutput);
        try {
            let delayed = 0;
            const compression = (req.query.compression == 'tar' ? 'tar' : 'zip');
            const archive = archiver(compression, { zlib: { level: 9 } });
            const zipname = `${dirname}/${req.query.appname || 'androme'}.${compression}`;
            const output = fs.createWriteStream(zipname);
            output.on('close', () => {
                delayed = -1;
                console.log(`WRITE: ${zipname} (${archive.pointer()} bytes)`);
                res.json({
                    directory: dirname,
                    zipname,
                    bytes: archive.pointer()
                });
            });
            archive.pipe(output);
            function finalize() {
                if (delayed != -1 && (delayed == 0 || Date.now() >= finalizeTime)) {
                    delayed = -1;
                    archive.finalize();
                }
            }
            for (const file of req.body) {
                const pathname = `${diroutput}/${file.pathname}`;
                const filename = `${pathname}/${file.filename}`;
                try {
                    mkdirp.sync(pathname);
                    const entrydata = { name: `${(directory ? `${req.query.directory}/` : '')}${file.pathname}/${file.filename}` };
                    if (file.content != null) {
                        delayed++;
                        fs.writeFile(filename, file.content, (err) => {
                            if (delayed != -1) {
                                if (!err) {
                                    archive.file(filename, entrydata);
                                }
                                delayed--;
                                finalize();
                            }
                        });
                    }
                    else if (file.uri != null) {
                        delayed++;
                        const stream = fs.createWriteStream(filename);
                        stream.on('finish', () => {
                            if (delayed != -1) {
                                archive.file(filename, entrydata);
                                delayed--;
                                finalize();
                            }
                        });
                        request(file.uri)
                            .on('response', response => {
                                if (response.statusCode != 200) {
                                    if (delayed != -1) {
                                        delayed--;
                                        finalize();
                                    }
                                }
                            })
                            .on('error', err => {
                                if (delayed != -1) {
                                    delayed--;
                                    finalize();
                                }
                            })
                            .pipe(stream);
                    }
                }
                catch (err) {
                    throw { filename, system: err };
                }
            }
            setTimeout(finalize, processingTime);
        }
        catch (err) {
            res.json({
                application: `FILE: ${err.filename}`,
                system: err.system
            });
        }
    }
    catch (err) {
        res.json({
            application: `DIRECTORY: ${diroutput}`,
            system: err
        });
    }
});

app.get('/api/downloadtobrowser', (req, res) => {
    if (req.query.filename != null && req.query.filename.trim() != '') {
        res.sendFile(req.query.filename, (err) => {
            if (err) {
                console.log(`ERROR: ${err}`);
            }
        });
    }
    else {
        res.json(null);
    }
});

app.listen(port, () => { console.log(`Express server listening on port ${port}`); });