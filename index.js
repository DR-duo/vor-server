const polka = require('polka');
const path = require('path');

const config = require('./config');

console.log('Initializing data');
const cardData = config.langs.reduce((langKeys, lang) => {
	const myPath = path.resolve(config.dataFolder, 'extracted', lang, 'data', `set1-${lang}.json`);
	console.log(`loading ${myPath}`);
	const data = require(myPath).reduce((cards, card) => {
		cards[card.cardCode] = card;
		return cards;
	}, {});

	langKeys[lang] = data;
	return langKeys;
}, {});
console.log('Data initialized');

polka()
	.get('/cards/:id', (req, res) => {
		const lang = req.query.lang || 'en_us';
		console.log(lang, req.params.id);
		const card = cardData[lang][req.params.id];
		res.end(JSON.stringify(card, ['descriptionRaw', 'flavorText', 'name', 'keywords', 'spellSpeed', 'rarity', 'region']));
	})
	.get('/cards/:id/sounds/:type', (req, res) => {
		console.log(req.params.id);
		res.end(req.params.id);
	})
	.get('/sounds/:name', (req, res) => {
		console.log(req.params.id);
		res.end(req.params.id);
	})
	.listen(4000, console.error);
