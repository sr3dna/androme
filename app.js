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
    const processingTime = Date.now() + ((!isNaN(parseInt(req.query.processingtime)) ? parseInt(req.query.processingtime) : 30) * 1000);
    try {
        mkdirp.sync(diroutput);
        try {
            let delayed = 0;
            const filetype = (req.query.filetype == 'tar' ? 'tar' : 'zip');
            const zip = archiver(filetype, {
                zlib: { level: 9 }
            });
            const zipname = `${dirname}/${req.query.appname || 'androme'}.${filetype}`;
            const output = fs.createWriteStream(zipname);
            output.on('close', () => {
                console.log(`WRITE: ${zipname} (${zip.pointer()} bytes)`);
                res.json({
                    directory: dirname,
                    zipname,
                    bytes: zip.pointer()
                });
            });
            zip.pipe(output);
            function finalize() {
                if (delayed == 0 || Date.now() >= processingTime) {
                    delayed = -1;
                    zip.finalize();
                }
            }
            for (const file of req.body) {
                const pathname = `${diroutput}/${file.pathname}`;
                const filename = `${pathname}/${file.filename}`;
                try {
                    mkdirp.sync(pathname);
                    const entrydata = { name: `${(directory ? `${req.query.directory}/` : '')}${file.pathname}/${file.filename}` };
                    if (file.content != null) {
                        fs.writeFileSync(filename, file.content);
                        zip.file(filename, entrydata);
                    }
                    else if (file.uri != null) {
                        delayed++;
                        const stream = fs.createWriteStream(filename);
                        stream.on('finish', () => {
                            if (delayed != -1) {
                                zip.file(filename, entrydata);
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
            finalize();
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