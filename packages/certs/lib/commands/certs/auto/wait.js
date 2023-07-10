"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
class CertsAutoWait extends core_1.Command {
    async run() {
        this.parse(CertsAutoWait);
    }
}
exports.default = CertsAutoWait;
CertsAutoWait.description = 'waits for the certificate to be activated';
CertsAutoWait.hidden = true;
CertsAutoWait.flags = {
    help: core_1.Flags.help({ char: 'h' }),
};
