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
 * SidechainAnonPinningV1.sol check that all of the things that can be voted on work.
 *
 */

// var Web3 = require('web3');
// var web3 = new Web3();

const VotingAlgMajority = artifacts.require("./VotingAlgMajority.sol");

contract('Voting: types of voting / things to vote on:', function(accounts) {
    let common = require('./common');

    const A_SIDECHAIN_ID = "0x2";


    async function addSidechain(pinningInterface) {
        await pinningInterface.addSidechain(A_SIDECHAIN_ID, (await VotingAlgMajority.deployed()).address, common.VOTING_PERIOD);
    }


    it("add a  unmasked participant", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        await addSidechain(pinningInterface);

        let newParticipant = accounts[1];
        await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, "1", "2");
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        await pinningInterface.actionVotes(A_SIDECHAIN_ID, newParticipant);
        const result = await common.checkVotingResult(pinningInterface);
        assert.equal(true, result, "incorrect result reported in event");

        let isParticipant = await pinningInterface.isSidechainParticipant.call(A_SIDECHAIN_ID, newParticipant);
        assert.equal(isParticipant, true, "unexpectedly, New Participant: isSidechainParticipant == false");

        let numUnmaskedParticipant = await pinningInterface.getNumberUnmaskedSidechainParticipants(A_SIDECHAIN_ID);
        assert.equal(numUnmaskedParticipant, 2, "unexpectedly, number of unmasked participants != 2");

        let newParticipantStored = await pinningInterface.getUnmaskedSidechainParticipant(A_SIDECHAIN_ID, "1");
        assert.equal(newParticipant, newParticipantStored, "unexpectedly, the stored participant did not match the value supplied.");
    });

    it("add a masked participant", async function() {
        console.log("NOT WORKING YET");

        //
        // let pinningInterface = await await common.getNewAnonPinning();
        // await addSidechain(pinningInterface);
        //
        // let newParticipant = accounts[1];
        // let salt = 0x123456789ABCDEF0123456789ABCDEF0;
        // let maskedParticipant  = web3.utils.keccak256(newParticipant, salt);
        //
        // await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_ADD_MASKED_PARTICIPANT, maskedParticipant, "1", "2");
        // await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        // await pinningInterface.actionVotes(A_SIDECHAIN_ID, maskedParticipant);
        // const result = await common.checkVotingResult(pinningInterface);
        // assert.equal(true, result, "incorrect result reported in event");
        //
        // let isParticipant = await pinningInterface.isSidechainParticipant.call(A_SIDECHAIN_ID, maskedParticipant);
        // assert.equal(isParticipant, false, "unexpectedly, New Participant: isSidechainParticipant != false");
        //
        // let numMaskedParticipant = await pinningInterface.getNumberMaskedSidechainParticipants(A_SIDECHAIN_ID);
        // assert.equal(numUnmaskedParticipant, 1, "unexpectedly, number of masked participants != 1");
        //
        // let maskedParticipantStored = await pinningInterface.getMaskedSidechainParticipant(A_SIDECHAIN_ID, "0");
        // assert.equal(maskedParticipant, maskedParticipantStored, "unexpectedly, the stored masked participant did not match the value supplied.");
    });





});