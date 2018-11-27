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
 * SidechainAnonPinningV1.sol check that unmasking a masked participant works.
 *
 */

var Web3 = require('web3');
var web3 = new Web3();

const VotingAlgMajority = artifacts.require("./VotingAlgMajority.sol");

contract('Unmasking masked participants:', function(accounts) {
    let common = require('./common');

    const A_SIDECHAIN_ID = "0x2";


    async function addSidechain(pinningInterface) {
        await pinningInterface.addSidechain(A_SIDECHAIN_ID, (await VotingAlgMajority.deployed()).address, common.VOTING_PERIOD);
    }

    async function addMaskedParticipant(pinningInterface, participant, salt) {
        let maskedParticipant  = web3.utils.keccak256(participant, salt);

        await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_ADD_MASKED_PARTICIPANT, maskedParticipant, "0", "0");
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        await pinningInterface.actionVotes(A_SIDECHAIN_ID, maskedParticipant);
        const result = await common.checkVotingResult(pinningInterface);
        assert.equal(true, result, "incorrect result reported in event");

        return maskedParticipant;
    }


    it("unmask", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        await addSidechain(pinningInterface);

        let newParticipant = accounts[1];
        let salt = "0x123456789ABCDEF0123456789ABCDEF0";
        let maskedParticipant  = await addMaskedParticipant(pinningInterface, newParticipant, salt);

        // Check that the masked participant exists and the unmasked participant does not exist.
        let isParticipant = await pinningInterface.isSidechainParticipant.call(A_SIDECHAIN_ID, newParticipant);
        assert.equal(isParticipant, false, "unexpectedly, New masked participant: isSidechainParticipant != false");

        const EXPECTED_OFFSET = "0";
        let maskedParticipantStored = await pinningInterface.getMaskedSidechainParticipant.call(A_SIDECHAIN_ID, EXPECTED_OFFSET);
        let maskedParticipantStoredHex = web3.utils.toHex(maskedParticipantStored);
        assert.equal(maskedParticipant, maskedParticipantStoredHex, "unexpectedly, the stored masked participant did not match the value supplied.");


        let val = await pinningInterface.unmaskTemp(newParticipant, salt);
        let val1 = web3.utils.toHex(val);
        console.log("val: " + val1);
        console.log("mas: " + maskedParticipant);



        await pinningInterface.unmask(A_SIDECHAIN_ID, EXPECTED_OFFSET, salt, {from: newParticipant});

        // Check that the masked participant doesn't exist and the unmasked participant does exist.
        isParticipant = await pinningInterface.isSidechainParticipant.call(A_SIDECHAIN_ID, newParticipant);
        assert.equal(isParticipant, true, "unexpectedly, unmasked participant doesnt exist: isSidechainParticipant == false");

        maskedParticipantStored = await pinningInterface.getMaskedSidechainParticipant.call(A_SIDECHAIN_ID, EXPECTED_OFFSET);
        maskedParticipantStoredHex = web3.utils.toHex(maskedParticipantStored);
        assert.equal("0x0000000000000000000000000000000000000000", maskedParticipantStoredHex, "unexpectedly, the stored masked participant not zeroized.");
    });

});