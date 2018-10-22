/**
 * SidechainAnonPinningV1.sol single side chain tests.
 *
 */
const Pinning = artifacts.require("./SidechainAnonPinningV1.sol");

// All tests of the public API must be tested via the interface. This ensures all functions
// which are assumed to be part of the public API actually are in the interface.
const AbstractPinning = artifacts.require("./SidechainAnonPinningInterface.sol");

contract('Pinning: Single Tests', function(accounts) {
    const zeroSidechainId = "0x0";
    const oneSidechainId = "0x1";

    const testAuthAddress1 = "0x0000000000000000000000000000000000000001";
    const testAuthAddress2 = "0x2";
    const testOrgInfoAddress1 = "0x0000000000000000000000000000000000000011";
    const testOrgInfoAddress2 = "0x12";


    const testDomainHash1 = "0x101";
    const testDomainHash2 = "0x102";

    it("add one sidechain", async function() {
        const domainOwner = accounts[4];

        let pinningInstance = await Pinning.new();
        let pinningAddress = pinningInstance.address;
        let pinningInterface = await AbstractPinning.at(pinningAddress);
        const resultAddDomain = await pinningInterface.addSidechain(zeroSidechainId, 1, testOrgInfoAddress1);

        const hasD1 = await eraInterface.getSidechainExists.call(zeroSidechainId);
        assert.equal(hasD1, true, "Has Sidechain");
        const hasD2 = await eraInterface.getSidechainExists.call(oneSidechainId);
        assert.equal(hasD2, false, "Has domain two");

        const domainOwnerD1 = await eraInterface.getVotingPeriod.call(zeroSidechainId);
        assert.equal(domainOwnerD1, 1, "Domain owner");

        const authAddr1 = await eraInterface.isSidechainParticipant.call(zeroSidechainId, testAuthAddress1);
        assert.equal(authAddr1, false, "Authority address");

        const orgInfoAddr1 = await eraInterface.getNumberUnmaskedSidechainParticipants.call(zeroSidechainId);
        assert.equal(orgInfoAddr1, 0, "Org Info address");
        //console.log("OrgInfo Address: ", orgInfoAddr1);


        //TODO The test below is not passing. It is not detecting the event.
//        assertDomainAddedEventNum(this.eraInstance, 1);
    });

});