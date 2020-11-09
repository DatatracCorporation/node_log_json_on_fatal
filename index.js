const native = require('./build/Release/node_log_json_on_fatal_native.node');


module.exports.setup = setup;


/*
 * Setup a handler to log `template` as JSON to stderr on fatal errors.
 *
 * The message string will be set at the path provided by `msgPath`.
 * The location string will be set at the path provided by `locPath`.
 *
 * After the JSON is logged to stderr, the process will exit as normal
 * for node fatal errors.
 */
function setup(template, msgPath='message', locPath='location') {
    // This function does a bunch of prep work so that the process to
    // write the actual JSON does not need to allocate heap memory or
    // do any complex actions.  Since the process is crashing, it would
    // unwise to perform anything complex.

    // The prep work pre-prepares the object into a JSON string and splits
    // that string into the three parts (leader, middle, trailer) so that
    // at crash time, we can directly print those parts with the string
    // inserted directly without any object manipulation or data conversion.

    const {
        leader,
        middle,
        trailer,
        msgFirst,
    } = prepareMsgParts(template, msgPath, locPath);

    native.register(Buffer.from(leader, 'utf-8'),
        Buffer.from(middle, 'utf-8'),
        Buffer.from(trailer, 'utf-8'),
        msgFirst);
}


// return the parts of the JSON encoded object as strings
function prepareMsgParts(template, msgPath, locPath) {
    const initialString = JSON.stringify(template);

    const {
        msgCode,
        locCode,
    } = pickUniqueCodes(initialString);

    const workObj = JSON.parse(initialString);

    set(workObj, msgPath, msgCode);
    set(workObj, locPath, locCode);

    const finalString = JSON.stringify(workObj);

    const msgIndex = finalString.indexOf(msgCode);
    const locIndex = finalString.indexOf(locCode);

    const firstIndex = Math.min(msgIndex, locIndex);
    const lastIndex = Math.max(msgIndex, locIndex);
    const codeSize = msgCode.length;

    const leader = finalString.slice(0, firstIndex);
    const middle = finalString.slice(firstIndex + codeSize, lastIndex);
    const trailer = finalString.slice(lastIndex + codeSize);

    return {
        leader,
        middle,
        trailer,
        msgFirst: (msgIndex < locIndex),
    };
}


// return code values can be used for replacement
// i.e. that do not appear in the string
function pickUniqueCodes(str) {
    let code = -1;
    let msgCode;
    let locCode;

    do {
        code += 1;
        msgCode = `---msg_${code}---`;
        locCode = `---loc_${code}---`;
    } while (str.includes(msgCode) || str.includes(locCode));

    return {
        msgCode,
        locCode,
    };
}


// set a value at a (dotted) path in an object
function set(obj, path, value) {
    const {name, parts} = splitPath(path);

    let workObj = obj;
    for (const part of parts) {
        const temp = workObj[part];

        if (!workObj) {
            temp = {}
            workObj[part] = temp;
        }

        workObj = temp;
    }

    workObj[name] = value;
}


// return the object path parts and the attribute name from a path
function splitPath(path) {
    const [name, ...parts] = path.split('.').reverse();

    return {
        name,
        parts: parts.reverse(),
    };
}
