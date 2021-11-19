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
FROM node:${_NODE_VER}-alpine

# Need compilers to build
RUN apk add --no-cache \
        make gcc g++ python3 automake autoconf libtool

# add matching user if needed
RUN grep -q -E ":${_GID}:" /etc/group || \
    addgroup -g ${_GID} user
RUN grep -q -E ":x:${UID}:" /etc/passwd || \
    adduser -u ${_UID} -G user -h "${_HOMEDIR}" -H -D user

WORKDIR ${_HOMEDIR}
EOT

docker run \
    --rm \
    --user ${_UID} \
    -v "$_HOMEDIR:$_HOMEDIR" \
    compiler:latest \
    ash -c "npm ci --build-from-source && ./node_modules/.bin/node-pre-gyp package"
