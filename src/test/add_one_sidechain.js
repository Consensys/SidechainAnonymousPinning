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
 * SidechainAnonPinningV1.sol add a single sidechain, and check the set-up of the
 * sidechain entry is correct.
 *
 */

contract('Add One Sidechain', function(accounts) {
    let common = require('./common');

    const twoSidechainId = "0x2";
    const oneSidechainId = "0x1";


    it("addSidechain", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        await pinningInterface.addSidechain(twoSidechainId, common.A_VALID_VOTING_CONTRACT_ADDRESS, common.VOTING_PERIOD);
    });

    it("getSidechainExists for valid sidechain", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        await pinningInterface.addSidechain(twoSidechainId, common.A_VALID_VOTING_CONTRACT_ADDRESS, common.VOTING_PERIOD);

        const hasD1 = await pinningInterface.getSidechainExists.call(twoSidechainId);
        assert.equal(hasD1, true, "Found sidechain 0");
    });


    it("getSidechainExists for invalid sidechain", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        await pinningInterface.addSidechain(twoSidechainId, common.A_VALID_VOTING_CONTRACT_ADDRESS, common.VOTING_PERIOD);

        const hasD2 = await pinningInterface.getSidechainExists.call(oneSidechainId);
        assert.equal(hasD2, false, "Unexpectedly found sidechain 1, which shouldn't exist");
    });

    it("getVotingPeriod", async function() {
        let votingPeriodTen = 10;
        let votingPeriodEleven = 11;
        let pinningInterface = await await common.getNewAnonPinning();
        await pinningInterface.addSidechain(twoSidechainId, common.A_VALID_VOTING_CONTRACT_ADDRESS, votingPeriodTen);
        await pinningInterface.addSidechain(oneSidechainId, common.A_VALID_VOTING_CONTRACT_ADDRESS, votingPeriodEleven);

        const actualVotingPeriod = await pinningInterface.getVotingPeriod.call(twoSidechainId);
        assert.equal(actualVotingPeriod, votingPeriodTen, "twoChainId returned unexpected voting period");

        const actualVotingPeriod1 = await pinningInterface.getVotingPeriod.call(oneSidechainId);
        assert.equal(actualVotingPeriod1, votingPeriodEleven, "oneChainId returned unexpected voting period");
    });

    it("isSidechainParticipant", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        await pinningInterface.addSidechain(twoSidechainId, common.A_VALID_VOTING_CONTRACT_ADDRESS, common.VOTING_PERIOD);

        const isPartBad = await pinningInterface.isSidechainParticipant.call(twoSidechainId, accounts[1]);
        assert.equal(isPartBad, false, "unexpectedly, account which should not be part of the sidechain is");

        const isPartGood = await pinningInterface.isSidechainParticipant.call(twoSidechainId, accounts[0]);
        assert.equal(isPartGood, true, "account which should be part of the sidechain is");
    });

    it("getNumberUnmaskedSidechainParticipants", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        await pinningInterface.addSidechain(twoSidechainId, common.A_VALID_VOTING_CONTRACT_ADDRESS, common.VOTING_PERIOD);

        const numUnmasked = await pinningInterface.getNumberUnmaskedSidechainParticipants.call(twoSidechainId);
        assert.equal(numUnmasked, 1, "unexpected number of unmasked participants");
    });

    it("getNumberMaskedSidechainParticipants", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        await pinningInterface.addSidechain(twoSidechainId, common.A_VALID_VOTING_CONTRACT_ADDRESS, common.VOTING_PERIOD);

        const numMasked = await pinningInterface.getNumberMaskedSidechainParticipants.call(twoSidechainId);
        assert.equal(numMasked, 0, "unexpected number of unmasked participants");
    });


});