/*
 * Copyright 2018 ConsenSys AG.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

/**
 * SidechainAnonPinningV1.sol unitinialised tests. Check that the contract operates
 * correctly when there are no sidechains in the contract - except for the management pseudo-sidechain.
 *
 */

contract('Pinning: Empty Tests', function(accounts) {
    let common = require('./common');

    const NON_EXISTANT_SIDECHAIN = "0x2";

    it("getSidechainExists for management pseudo-sidechain", async function() {
        let pinningInterface = await await common.getDeployedAnonPinning();
        const exists = await pinningInterface.getSidechainExists.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID);

        assert.equal(exists, true);
    });

    it("getVotingPeriod for management pseudo-sidechain", async function() {
        let pinningInterface = await await common.getDeployedAnonPinning();
        const votingPeriod = await pinningInterface.getVotingPeriod.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID);
        assert.equal(votingPeriod, common.VOTING_PERIOD);
    });

    it("isSidechainParticipant for management pseudo-sidechain: valid participant", async function() {
        let pinningInterface = await await common.getDeployedAnonPinning();
        const isParticipant = await pinningInterface.isSidechainParticipant.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, accounts[0]);
        assert.equal(isParticipant, true);
    });

    it("isSidechainParticipant for management pseudo-sidechain: non-participant", async function() {
        let pinningInterface = await await common.getDeployedAnonPinning();
        const isParticipant = await pinningInterface.isSidechainParticipant.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, accounts[1]);
        assert.equal(isParticipant, false);
    });

    it("getUnmaskedSidechainParticipantsSize for management pseudo-sidechain", async function() {
        let pinningInterface = await await common.getDeployedAnonPinning();
        const numParticipants = await pinningInterface.getUnmaskedSidechainParticipantsSize.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID);
        assert.equal(numParticipants, "1");
    });

    it("getUnmaskedSidechainParticipant for management pseudo-sidechain: valid participant", async function() {
        let pinningInterface = await await common.getDeployedAnonPinning();
        const participant = await pinningInterface.getUnmaskedSidechainParticipant.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, 0);
        assert.equal(participant, accounts[0]);
    });

    it("getMaskedSidechainParticipantsSize for management pseudo-sidechain", async function() {
        let pinningInterface = await await common.getDeployedAnonPinning();
        const numUnmaskedParticipants = await pinningInterface.getMaskedSidechainParticipantsSize.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID);
        assert.equal(numUnmaskedParticipants, "0");
    });



    it("getSidechainExists for non-existent sidechain", async function() {
        let pinningInterface = await await common.getDeployedAnonPinning();
        const exists = await pinningInterface.getSidechainExists.call(NON_EXISTANT_SIDECHAIN);

        assert.equal(exists, false);
    });

    it("getVotingPeriod for non-existent sidechain", async function() {
        let pinningInterface = await await common.getDeployedAnonPinning();
        const votingPeriod = await pinningInterface.getVotingPeriod.call(NON_EXISTANT_SIDECHAIN);
        assert.equal(votingPeriod, "0");
    });

    it("isSidechainParticipant for non-existent sidechain", async function() {
        let pinningInterface = await await common.getDeployedAnonPinning();
        const isParticipant = await pinningInterface.isSidechainParticipant.call(NON_EXISTANT_SIDECHAIN, accounts[0]);
        assert.equal(isParticipant, false);
    });

    it("getUnmaskedSidechainParticipantsSize for non-existent sidechain", async function() {
        let pinningInterface = await await common.getDeployedAnonPinning();
        const numUnMaskedParticipants = await pinningInterface.getUnmaskedSidechainParticipantsSize.call(NON_EXISTANT_SIDECHAIN);
        assert.equal(numUnMaskedParticipants, "0");
    });

    it("getUnmaskedSidechainParticipant for non-existent sidechain", async function() {
        console.log("TODO not working");
        //let pinningInterface = await await common.getDeployedAnonPinning();
        //const unmaskedParticipant = await pinningInterface.getUnmaskedSidechainParticipant.call(NON_EXISTANT_SIDECHAIN, 0);
        //assert.equal(unmaskedParticipant, "0");
    });

    it("getMaskedSidechainParticipantsSize for non-existent sidechain", async function() {
        let pinningInterface = await await common.getDeployedAnonPinning();
        const numMaskedParticipants = await pinningInterface.getMaskedSidechainParticipantsSize.call(NON_EXISTANT_SIDECHAIN);
        assert.equal(numMaskedParticipants, "0");
    });

    it("getMaskedSidechainParticipant for non-existent sidechain", async function() {
        console.log("TODO not working");
        //let pinningInterface = await await common.getDeployedAnonPinning();
        //const maskedParticipant = await pinningInterface.getMaskedSidechainParticipant.call(NON_EXISTANT_SIDECHAIN, 0);
        //assert.equal(maskedParticipant, "0");
    });

    it("getPin for non-existent sidechain", async function() {
        let pinningInterface = await await common.getDeployedAnonPinning();
        const pin = await pinningInterface.getPin.call(NON_EXISTANT_SIDECHAIN);
        assert.equal(pin, "0x0000000000000000000000000000000000000000000000000000000000000000");
    });
});
