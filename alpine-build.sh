#! /bin/bash

set -e

if [[ -z "$1" ]]; then
    echo "Usage: $(basename $0) <node-version>" 1>&2
    exit 1
fi

_NODE_VER="$1"
_UID="$(id -u)"
_GID="$(id -g)"
_HOMEDIR="${PWD}"

docker build \
    --tag compiler \
    - <<EOT
FROM mhart/alpine-node:${_NODE_VER}

# Need compilers to build
RUN apk add --no-cache \
        make gcc g++ python3 automake autoconf libtool

# add matching user
RUN addgroup -g ${_GID} user
RUN adduser -u ${_UID} -G user -h "${_HOMEDIR}" -H -D user

WORKDIR ${_HOMEDIR}
EOT

docker run \
    --rm \
    --user user \
    -v "$_HOMEDIR:$_HOMEDIR" \
    compiler:latest \
    ash -c "npm ci --build-from-source && ./node_modules/.bin/node-pre-gyp package"
