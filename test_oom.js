const fatal = require('./index.js');

const obj = {
    a: 1,
    b: {
        foo: 'this is a message',
        bar: {},
    },
};

fatal.setup(obj, 'b.bar.msg', 'b.bar.loc');

// now, just run out of memory
let junk=['a'];
while (true) {
    junk=[junk,junk];
}
