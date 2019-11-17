const https = require('https');
const fs = require('fs');
const path = require('path');
const yauzl = require('yauzl');

const config = require('../config');

const args = process.argv.slice(2);
if (args.length === 0) console.log("No args passed in, expected either 'download' and or 'extract'");


const folderName = config.dataFolder;
const apiUrl = 'https://dd.b.pvp.net/';
const { langs } = config;
const files = langs.map(lang => `datadragon-core-${lang}.zip`)
	.concat(langs.map(lang => `datadragon-set1-lite-${lang}.zip`));

if (!fs.existsSync(folderName)) fs.mkdirSync(folderName);
if (!fs.existsSync(`${folderName}/extracted`)) fs.mkdirSync(`${folderName}/extracted`);

function writeStream(fileName) {
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(`${folderName}/${fileName}`);
		https.get(`${apiUrl}${fileName}`, response => {
			response.pipe(file).on('close', () => {
				console.log(`${fileName} downloaded`);
				resolve();
			}).on('error', reject);
		}).on('error', reject);
	});
}

function mkdirp(dir, cb) {
	if (dir === '.') return cb();

	fs.stat(dir, err => {
		if (!err) return cb();
		mkdirp(path.dirname(dir), () => fs.mkdir(dir, cb));
	});
}

function extractFile(fileName) {
	return new Promise((resolve, reject) => {
		yauzl.open(`${folderName}/${fileName}`, (err, zipfile) => {
			if (err) throw err;

			zipfile.on('error', reject);

			zipfile.once('end', () => {
				console.log(`zip file ${fileName} finished extracting`);
				resolve();
			});

			zipfile.on('entry', entry => {
				zipfile.openReadStream(entry, (err, readStream) => {
					if (err) reject(err);
					const outName = `${folderName}/extracted/${entry.fileName}`;
					mkdirp(path.dirname(outName), () => {
						const file = fs.createWriteStream(outName);
						readStream.pipe(file);
					});
				});
			});
		});
	});
}

(async () => {
	if (args.includes('download')) {
		const filePromises = [];
		for (const file of files) {
			filePromises.push(writeStream(file));
		}
		await Promise.all(filePromises);
		console.log('files all downloaded');
	}

	if (args.includes('extract')) {
		const extractedPromises = [];
		for (const file of files) {
			extractedPromises.push(extractFile(file));
		}
		await Promise.all(extractedPromises);
		console.log('files all extracted');
	}
})();
