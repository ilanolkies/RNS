const assert = require('assert');

const RNS = artifacts.require('RNS');
const PublicResolver = artifacts.require('PublicResolver');
const MultiChainResolver = artifacts.require('MultiChainResolver');

const namehash = require('eth-ens-namehash').hash;
const { assertThrowsAsync } = require('./utils.js');

contract('MultiChainResolver', function (accounts) {
    const OWNER = accounts[0];
    const NOT_OWNER = accounts[1];
    const TLD = web3.sha3('tld');
    const NODE = namehash('tld');
    const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
    const NULL_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";

    const BTC_HASH = web3.sha3('BTC');
    const BTC_ADDRESS = '1FfmbHfnpaZjKFvyi1okTjJJusN455paPH';

    const LTC_HASH = web3.sha3('LTC');
    const LTC_ADDRESS = '3MidrAnQ9w1YK6pBqMv7cw5bGLDvPRznph';

    const RSK_HASH = web3.sha3('RBTC');
    const RSK_ADDRESS_1 = accounts[2];
    const RSK_ADDRESS_2 = accounts[4];

    const CONTENT_HASH_1 = web3.sha3('CONTENT1');
    const CONTENT_HASH_2 = web3.sha3('CONTENT2');

    let rns, resolver, multiresolver;

    beforeEach(async function () {
        rns = await RNS.new({ gas: 6800000, from: OWNER });
        resolver = await PublicResolver.new(rns.address, { gas: 6800000, from: OWNER });
        multiresolver = await MultiChainResolver.new(rns.address, resolver.address, { gas: 6800000, from: OWNER });

        await rns.setSubnodeOwner(0, TLD, OWNER);
    });

    describe("Multi-chain methods", async function () {
        it("throws when setter is called by a non-owner", async function () {
            await assertThrowsAsync(async () => {
                await multiresolver.setChainAddr(NODE, BTC_HASH, BTC_ADDRESS, { from: NOT_OWNER });
            });
        });

        it("sets the address for multiple chains", async function () {
            await multiresolver.setChainAddr(NODE, BTC_HASH, BTC_ADDRESS);
            await multiresolver.setChainAddr(NODE, LTC_HASH, LTC_ADDRESS);
            await multiresolver.setChainAddr(NODE, RSK_HASH, RSK_ADDRESS_1);
    
            let addr;

            addr = await multiresolver.chainAddr(NODE, BTC_HASH);
            assert.equal(addr, BTC_ADDRESS);

            addr = await multiresolver.chainAddr(NODE, LTC_HASH);
            assert.equal(addr, LTC_ADDRESS);

            addr = await multiresolver.chainAddr(NODE, RSK_HASH);
            assert.equal(addr, RSK_ADDRESS_1);
        });
    });

    describe("Regular address methods", async function () {
        it("throws when setter is called by a non-owner", async function () {
            await assertThrowsAsync(async () => {
                await multiresolver.setAddr(NODE, RSK_ADDRESS_1, { from: NOT_OWNER });
            });
        });

        it("sets the address through the traditional interface", async function () {
            await multiresolver.setAddr(NODE, RSK_ADDRESS_1);
    
            let addr = await multiresolver.addr(NODE);
            assert.equal(addr, RSK_ADDRESS_1);
        });
    
        it("fallbacks to the old resolver when no address is mapped", async function () {
            await resolver.setAddr(NODE, RSK_ADDRESS_1);
            
            let addr = await multiresolver.addr(NODE);
            assert.equal(addr, RSK_ADDRESS_1);
        });

        it("returns null address if no address is mapped and there is no old resolver", async function () {
            multiresolver = await MultiChainResolver.new(rns.address, 0, { gas: 6800000, from: OWNER });

            let addr = await multiresolver.addr(NODE);
            assert.equal(addr, NULL_ADDRESS);
        });

        it("doesn't fallback to the old resolver when an address is mapped", async function () {
            await resolver.setAddr(NODE, RSK_ADDRESS_1);
            await multiresolver.setAddr(NODE, RSK_ADDRESS_2);
            
            let addr = await multiresolver.addr(NODE);
            assert.equal(addr, RSK_ADDRESS_2);
        });
    });

    describe("Exchanging regular and multichain methods", async function () {
        it("sets the rsk address through the regular setter and retrieving it through the multichain getter yields empty", async function () {
            await multiresolver.setAddr(NODE, RSK_ADDRESS_1);

            let addr = await multiresolver.chainAddr(NODE, RSK_HASH);
            assert.equal(addr, '');
        });

        it("sets the rsk address through the multichain setter and retrieving it through the regular getter yields a null address", async function () {
            await multiresolver.setChainAddr(NODE, RSK_HASH, RSK_ADDRESS_1);

            let addr = await multiresolver.addr(NODE);
            assert.equal(addr, NULL_ADDRESS);
        });
    });

    describe("Content hash", async function () {
        it("throws when setter is called by a non-owner", async function () {
            await assertThrowsAsync(async () => {
                await multiresolver.setContent(NODE, CONTENT_HASH_1, { from: NOT_OWNER });
            });
        });

        it("sets the hash correctly", async function () {
            await multiresolver.setContent(NODE, CONTENT_HASH_1);
    
            let content = await multiresolver.content(NODE);
            assert.equal(content, CONTENT_HASH_1);
        });
    
        it("fallbacks to the old resolver when no hash is mapped", async function () {
            await resolver.setContent(NODE, CONTENT_HASH_1);
            
            let content = await multiresolver.content(NODE);
            assert.equal(content, CONTENT_HASH_1);
        });

        it("returns null if no hash is mapped and there is no old resolver", async function () {
            multiresolver = await MultiChainResolver.new(rns.address, 0, { gas: 6800000, from: OWNER });

            let content = await multiresolver.content(NODE);
            assert.equal(content, NULL_HASH);
        });

        it("doesn't fallback to the old resolver when a hash is mapped", async function () {
            await resolver.setContent(NODE, CONTENT_HASH_1);
            await multiresolver.setContent(NODE, CONTENT_HASH_2);
            
            let content = await multiresolver.content(NODE);
            assert.equal(content, CONTENT_HASH_2);
        });
    });
});