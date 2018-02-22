import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process';
import * as readline from 'readline';
import { promisify } from 'util';
import { exit } from 'process';

const exec = promisify(child_process.exec);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const isFirefoxRunning = async () => {
	try {
		return (await exec('pidof firefox')).stdout;
	} catch (e) {
		if (e.code === 1) {
			return false;
		}

		throw e;
	}
}

const firefox = async (isLaptop?: true) => {
	const { stdout: path, stderr } = await exec('printf ~/.mozilla/firefox/*.default*/prefs.js');

	const firefoxPrefs = await readFile(path, { encoding: 'utf-8' });

	const firefoxSetting = 'layout.css.devPixelsPerPx';
	const firefoxSettingRegEx = RegExp(`"${firefoxSetting}".+"(\\d(\.\\d+)?)"`, 'g');

	const newFirefoxSettingValue = `"${firefoxSetting}", "${isLaptop ? 1.33 : 1}"`;

	const newFirefoxPrefs = firefoxPrefs.replace(firefoxSettingRegEx, newFirefoxSettingValue);

	if (await isFirefoxRunning()) {
		console.log('==========');
		process.stdout.write('Closing Firefox');
		await exec('wmctrl -c firefox');
		while(await isFirefoxRunning()) {
			process.stdout.write('.');
		}
		console.log('');
		console.log('==========');
	}

	await writeFile(path, newFirefoxPrefs, { encoding: 'utf-8'  });
	console.log('Restarting Firefox');
	console.log('==========');
	exec('firefox');
};

const vsCode = async (isLaptop?: true) => {
	const { stdout: path, stderr } = await exec('printf ~/.config/Code/User/settings.json');
	const vsCodeSettings = require(path);
	const currZoom = vsCodeSettings["window.zoomLevel"];
	vsCodeSettings["window.zoomLevel"] = isLaptop ? 1.5 : 0.75;

	await writeFile(path, JSON.stringify(vsCodeSettings, null, 3));
};

const main = async () => {
	if (process.argv[2] === 'laptop') {
		await firefox(true);
		await vsCode(true);
		exit();
	}

	await firefox();
	await vsCode();
	exit();
}

main();
