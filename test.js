const {spawnSync} = require('child_process');

let failed = false;

function run(script) {
    const rslt = spawnSync(process.execPath,
        ['--max_old_space_size=80', script],
        {
            stdio: 'pipe',
            timeout: 30*1000,
            encoding: 'utf-8',
        }
    );

    if (rslt.error) {
        throw rslt.error;
    }

    return {
        status: rslt.status,
        stdout: rslt.stdout,
        stderr: rslt.stderr,
    };
}


function verifyFail(script) {
    const rslt = run(script);

    if (rslt.status !== 1) {
        throw new Error(`${script} wrong status:  status='${rslt.status}'`);
    }

    if (rslt.stdout !== '') {
        throw new Error(`${script} returned stdout: ${rslt.stdout}`);
    }

    // ignore leadup to our output
    const marker = '\n<--- Fatal error in process --->\n';

    if (!rslt.stderr.includes(marker)) {
        console.log(`Failed to find marker in output from test ${script}`);
        console.log('output was:');
        console.debug(rslt.stderr);
        failed = true;
        return;
    }

    const jsonString = rslt.stderr.split(marker).reverse()[0];

    try {
        const err = JSON.parse(jsonString);
        // TODO: verify content of JSON itself?
    } catch (err) {
        console.log(`Failed to parse JSON from test ${script}`);
        console.log('split JSON was:');
        console.debug(jsonString);
        console.log('split JSON was:');
        console.debug(jsonString);
        failed = true;
        return;
    }

    console.log(`Passed: ${script}`);
}

console.log('\n\n\nStarting tests');

verifyFail('test_oom.js');

if (failed) {
    process.exit(1);
}
