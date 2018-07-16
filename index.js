#!/usr/bin/env node
const fs = require('fs');
const { promisify } = require('util');
const { join } = require('path');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const exec = promisify(require('child_process').exec);

const PATH = join(process.env.HOME, 'Library', 'Application Support', 'Google', 'Chrome', 'Local State');

const findProfileId = (currentState, name) =>
    Object.entries(currentState.profile.info_cache)
        .find(([ id, profile ]) => id.toLowerCase() === name || (profile.name && profile.name.toLowerCase() === name) || (profile.gaia_given_name && profile.gaia_given_name.toLowerCase() === name))[0];


const commands = {
    async activate([profileName]) {
        let wasRunning = true;
        await exec('killall "Google Chrome"').then(() => new Promise(r => setTimeout(r, 500)), () => (wasRunning = false));
        await exec(`cp "${PATH}" "${PATH}-backup-${new Date().getTime()}"`);

        const currentState = JSON.parse(await readFile(PATH));
        const id = findProfileId(currentState, profileName.toLowerCase());
        currentState.profile.last_used = id;
        currentState.profile.last_active_profiles = [id];
        await writeFile(PATH, JSON.stringify(currentState));
        if (wasRunning) {
            exec('open -a "Google Chrome"');
        }
    }
}

async function main([command, ...argv]) {
    if (commands[command]) {
        return await commands[command](argv);
    }

    throw new Error(`Unrecognised command ${command}`);
}

main(process.argv.slice(2)).then(null, err => console.error(err && err.stack || err));