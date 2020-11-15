# node_log_json_on_fatal

Node module that will log a JSON object to `stderr` if the process is
crashing with a fatal error.

Prebuilt binaries are hosted in the Github release to simplify use.  An
alpine compatible version is included.

The package is setup with
[`node-pre-gyp`](https://github.com/mapbox/node-pre-gyp) so if the
needed binary exists in the Github releases, it will downloaded.  But if
does not exist, it will be compiled locally.

# Why?

The default behavior for Node.js when encountering a fatal error is to
print useful info to standard error and crash.  But this data is
unstructured, so if you are using a log monitoring service that expects
JSON objects, it is not very helpful.  This corrects that to get the
basic data into JSON form so that it can be processed by log monitoring
services.

# Usage

```shell
npm install node_log_json_on_fatal
```

The module exports one function with the signature:

```javascript
function setup(template, msgPath='message', locPath='location')
```

It can be used like:

```javascript
const fatal = require('node_log_json_on_fatal');

const template = {
    whatever: 'fields that need to be logged',
    canBe: {
        nested: true,
        lists: [true, true],
    },
    details: {},
};

fatal.setup(template, 'details.message', 'details.location');
```

If the process crashes with a Node.js fatal error, the V8 supplied
`message` and `location` with be added to the template object at the
specified paths and the object will be logged as JSON.

NOTE: The module deep clones the `template`, meaning later changes to it will
not be reflected in the output.

# Thanks

* Initial version based on
  [trevnorris](https://github.com/trevnorris) /
  [node-ofe](https://github.com/trevnorris/node-ofe/).
* Github Actions based on
  [blueconic](https://github.com/blueconic) /
  [node-oom-heapdump](https://github.com/blueconic/node-oom-heapdump).

# Development

This uses node-gyp for building, so you'll need the normal C++ build
tools like `make` and a compiler.

A basic build and test cycle can use invoked with:

```shell
npm run test
```

# Deployment

In this repo, Github actions are setup to build the binaries for the
common operating systems when a Github release is created. So, the
process for releasing a version is:

1. `git fetch`
1. `git status`
1. `vi CHANGELOG.md`
1. `git add CHANGELOG.md`
1. `npm version -f -m "Release new version" <new-version>`
1. `git push && git push --tags`
1. Create a release on github to build binaries
1. `npm publish`
