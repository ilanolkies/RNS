const BaseContext = require('./BaseContext.js');

let ERC20Context = function (tokenContract, registrar, accounts) {
    BaseContext.call(this, tokenContract, registrar, accounts);
}
ERC20Context.prototype.newBid = async function (sealedBid, deposit, account) {
    if (!account)
        account = this.accounts[0];

    await this.tokenContract.approve(this.registrar.address, deposit, {from: account});
    await this.registrar.newBid(sealedBid, deposit, { from: account });        
}
ERC20Context.prototype.payRent = async function (hash, deposit, account) {
    if (!account)
        account = this.accounts[0];
    
    await this.tokenContract.approve(this.registrar.address, deposit, {from: account});
    await this.registrar.payRent(hash, { from: account });
}

ERC20Context.prototype.register = async function (hash, value, account) {
    if (!account)
        account = this.accounts[0];

    await this.tokenContract.approve(this.registrar.address, value, {from: account});
    await this.registrar.register(hash, { from: account });
}
ERC20Context.prototype.renew = async function (hash, value, account) {
    if (!account)
        account = this.accounts[0];

    await this.tokenContract.approve(this.registrar.address, value, {from: account});
    await this.registrar.renew(hash, { from: account });
}

module.exports = ERC20Context;