#include <nan.h>
#include <stdlib.h>

using namespace v8;


Eternal<Uint8Array> leader;
Eternal<Uint8Array> middle;
Eternal<Uint8Array> trailer;
bool msgFirst;


static void printUint8Array(Eternal<Uint8Array>& str) {
    Nan::HandleScope scope;
    Isolate* curr = Isolate::GetCurrent();

    auto local = str.Get(curr);
    Nan::TypedArrayContents<uint8_t> bytes(local);

    fwrite(*bytes, 1, bytes.length(), stderr);
}


static void out(const char ch) {
    fwrite(&ch, 1, 1, stderr);
}


static void escapeAndPrint(const char* str) {
    if (!str) {
        return;
    }

    // not efficient, but not sure that crashing efficiently is important
    for (const char* cp = str; *cp != 0; cp +=1 ) {
        switch (*cp) {
          case '"':
          case '\\':
          case '\b':
          case '\t':
          case '\n':
          case '\r':
          case '\f':
            out('\\');
            out(*cp);
            break;
          default:
            if (*cp < 0x20) {
                fprintf(stderr, "\\u%04X", *cp);
            } else {
                out(*cp);
            }
        }
    }
}


static void printMsgOrLoc(const char* location, const char* message,
        bool printMsg) {
    if (printMsg) {
        escapeAndPrint(message);
    } else {
        escapeAndPrint(location);
    }
}


static void OnFatalError(const char* location, const char* message) {
    // Do as little as possible in here, we are already crashing...
    fprintf(stderr, "\n<--- Fatal error in process --->\n");

    printUint8Array(leader);
    printMsgOrLoc(location, message, msgFirst);
    printUint8Array(middle);
    printMsgOrLoc(location, message, !msgFirst);
    printUint8Array(trailer);
    fprintf(stderr, "\n");

    exit(1);
}


NAN_METHOD(Register) {
    // validate all our params
    if (info.Length() != 4) {
        Nan::ThrowError("Incorrect number of params, must be 4");
    }

    if (!info[0]->IsUint8Array()) {
        Nan::ThrowError("Wrong type for param 1 (leader), must be Uint8Array");
    }

    if (!info[1]->IsUint8Array()) {
        Nan::ThrowError("Wrong type for param 2 (middle), must be Uint8Array");
    }

    if (!info[2]->IsUint8Array()) {
        Nan::ThrowError("Wrong type for param 3 (trailer), must be Uint8Array");
    }

    if (!info[3]->IsBoolean()) {
        Nan::ThrowError("Wrong type for param 4 (msgFirst), must be Boolean");
    }

    // save the parameters for later use
    Isolate* curr = Isolate::GetCurrent();

    leader.Set(curr, info[0].As<Uint8Array>());
    middle.Set(curr, info[1].As<Uint8Array>());
    trailer.Set(curr, info[2].As<Uint8Array>());
    msgFirst = info[3].As<Boolean>()->Value();

    // register our handler
    curr->SetFatalErrorHandler(OnFatalError);
}


NODE_MODULE_INIT(/* exports, module, context */) {
    exports->Set(
        context,
        Nan::New("register").ToLocalChecked(),
        Nan::New<FunctionTemplate>(Register)->GetFunction(context)
            .ToLocalChecked()).FromJust();
}
