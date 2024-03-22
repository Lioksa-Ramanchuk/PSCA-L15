const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const { readFileSync, writeFileSync } = require('fs');

const PORT = 3000;
const DATA_FILE = './phone_book.json'

const app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'hbs');
app.engine('hbs', engine({
	extname: 'hbs',
	helpers: {
		cancelButton: () => {
			return `<button type="button" class="button-btn" onclick="window.location.href='/'">Отказаться</button>`
		}
	}
}));

app.get('/', (_req, res) => {
	const data = getJsonData(DATA_FILE);
	renderPage(res, { data, renderGet: true })
});
app.get('/add', (_req, res) => {
	const data = getJsonData(DATA_FILE);
	renderPage(res, { data, renderAdd: true })
});
app.get('/update', (req, res) => {
	const fullName = req.query.fullName;
	const data = getJsonData(DATA_FILE);
	const recordIndex = data.findIndex(rec => rec.fullName === fullName);
	if (recordIndex === -1) {
		renderError(res, 404, 'Записи с таким ФИО нет');
		return;
	}
	renderPage(res, { data, record: data[recordIndex], renderUpdate: true })
});

app.post('/add', (req, res) => {
	const { fullName, phoneNumber } = req.body;
	if (getRecordByFullName(fullName)) {
		renderError(res, 400, 'Запись с таким ФИО уже есть');
		return;
	}
	let data = getJsonData(DATA_FILE);
	data.push({ fullName: fullName.trim(), phoneNumber: phoneNumber.trim() });
	updateJsonData(DATA_FILE, data);
	res.redirect('/');
});

app.post('/update', (req, res) => {
	const { fullName, phoneNumber } = req.body;
	let data = getJsonData(DATA_FILE);
	const recordIndex = data.findIndex(rec => rec.fullName === fullName);
	if (recordIndex === -1) {
		renderError(res, 404, 'Записи с таким ФИО нет');
		return;
	}
	data[recordIndex].phoneNumber = phoneNumber;
	updateJsonData(DATA_FILE, data);
	res.redirect('/')
})
app.post('/delete', (req, res) => {
	const { fullName } = req.body;
	let data = getJsonData(DATA_FILE);
	const recordIndex = data.findIndex(rec => rec.fullName === fullName);
	if (recordIndex === -1) {
		renderError(res, 404, 'Записи с таким ФИО нет');
		return;
	}
	data.splice(recordIndex, 1);
	updateJsonData(DATA_FILE, data);
	res.redirect('/');
})

app.listen(PORT, () => {
	console.log(`Server is running at localhost:${PORT}`)
});

function getRecordByFullName(fullName) {
	return getJsonData(DATA_FILE).find(rec => rec.fullName === fullName)
}

function getJsonData(file) {
	try {
		return JSON.parse(readFileSync(file));
	} catch (e) {
		console.error('Error: ', e);
		return {};
	}
}
function updateJsonData(file, data) {
	writeFileSync(file, JSON.stringify(data));
}
function renderPage(res, params) {
	res.render('layouts/main', params);
}
function renderError(res, code, message) {
	res.status(code).contentType('json').send(JSON.stringify({ message }))
}