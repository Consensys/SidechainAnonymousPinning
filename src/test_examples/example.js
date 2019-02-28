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
 * Example to how lots of the functionality.
 *
 */

// var Web3 = require('web3');
// var web3 = new Web3();

const VotingAlgMajority = artifacts.require("./VotingAlgMajority.sol");

contract('Examples:', function(accounts) {
    let common = require('../test/common');

    const A_SIDECHAIN_ID = "0x001d3b0000000000030040000000000006400000000000000000000000000002";


    async function addSidechain(pinningInterface) {
        await pinningInterface.addSidechain(A_SIDECHAIN_ID, (await VotingAlgMajority.deployed()).address, common.VOTING_PERIOD);
    }

    it("add a masked participant", async function() {
        let pinningInterface = await common.getNewAnonPinning();
        await addSidechain(pinningInterface);

        let newParticipant = accounts[1];
        let salt = "0x123456789ABCDEF0123456789ABCDEF0";
        let maskedParticipant  = web3.utils.keccak256(newParticipant, salt);

        await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_ADD_MASKED_PARTICIPANT, maskedParticipant, "0", "0");
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        let actionResult = await pinningInterface.actionVotes(A_SIDECHAIN_ID, maskedParticipant);
        const result = await common.checkVotingResult(actionResult.logs);
        assert.equal(true, result, "incorrect result reported in event");

        let numMaskedParticipant = await pinningInterface.getMaskedSidechainParticipantsSize.call(A_SIDECHAIN_ID);
        assert.equal(numMaskedParticipant, 1, "unexpectedly, number of masked participants != 1");

        let maskedParticipantStored = await pinningInterface.getMaskedSidechainParticipant.call(A_SIDECHAIN_ID, "0");
        let maskedParticipantStoredHex = web3.utils.toHex(maskedParticipantStored);
        assert.equal(maskedParticipant, maskedParticipantStoredHex, "unexpectedly, the stored masked participant did not match the value supplied.");
    });



    it("add an unmasked participant", async function() {
        let pinningInterface = await common.getNewAnonPinning();
        await addSidechain(pinningInterface);

        let newParticipant = accounts[1];
        await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, "0", "0");
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        let actionResult = await pinningInterface.actionVotes(A_SIDECHAIN_ID, newParticipant);
        const result = await common.checkVotingResult(actionResult.logs);
        assert.equal(true, result, "incorrect result reported in event");

        let isParticipant = await pinningInterface.isSidechainParticipant.call(A_SIDECHAIN_ID, newParticipant);
        assert.equal(isParticipant, true, "unexpectedly, New Participant: isSidechainParticipant == false");

        let numUnmaskedParticipant = await pinningInterface.getUnmaskedSidechainParticipantsSize.call(A_SIDECHAIN_ID);
        assert.equal(numUnmaskedParticipant, 2, "unexpectedly, number of unmasked participants != 2");

        let newParticipantStored = await pinningInterface.getUnmaskedSidechainParticipant.call(A_SIDECHAIN_ID, "1");
        assert.equal(newParticipant, newParticipantStored, "unexpectedly, the stored participant did not match the value supplied.");
    });


    it("remove an unmasked participant", async function() {
        let pinningInterface = await common.getNewAnonPinning();
        await addSidechain(pinningInterface);

        // Add the participant
        let newParticipant = accounts[1];
        await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, "0", "0");
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        let actionResult = await pinningInterface.actionVotes(A_SIDECHAIN_ID, newParticipant);
        const result1 = await common.checkVotingResult(actionResult.logs);
        assert.equal(true, result1, "incorrect result reported in event");

        let isParticipant = await pinningInterface.isSidechainParticipant.call(A_SIDECHAIN_ID, newParticipant);
        assert.equal(isParticipant, true, "unexpectedly, New Participant: isSidechainParticipant == false");

        const EXPECTED_OFFSET = "1";
        let newParticipantStored = await pinningInterface.getUnmaskedSidechainParticipant.call(A_SIDECHAIN_ID, EXPECTED_OFFSET);
        assert.equal(newParticipant, newParticipantStored, "unexpectedly, the stored participant did not match the value supplied.");


        // Remove the participant
        let participantToRemove = newParticipant;
        await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_REMOVE_UNMASKED_PARTICIPANT, participantToRemove, EXPECTED_OFFSET, "0");
        // NOTE that with just two unmasked participants, the unmasked participant being
        // removed has to agree to being removed.
        await pinningInterface.vote(A_SIDECHAIN_ID, common.VOTE_REMOVE_UNMASKED_PARTICIPANT, participantToRemove, true, {from: accounts[1]});
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        actionResult = await pinningInterface.actionVotes(A_SIDECHAIN_ID, participantToRemove);
        const result2 = await common.checkVotingResult(actionResult.logs);
        assert.equal(true, result2, "incorrect result reported in event");

        isParticipant = await pinningInterface.isSidechainParticipant.call(A_SIDECHAIN_ID, participantToRemove);
        assert.equal(isParticipant, false, "unexpectedly, New Participant: isSidechainParticipant != false");

        let numUnmaskedParticipant = await pinningInterface.getUnmaskedSidechainParticipantsSize.call(A_SIDECHAIN_ID);
        assert.equal(numUnmaskedParticipant, 2, "unexpectedly, unmasked participants array size != 2");

        newParticipantStored = await pinningInterface.getUnmaskedSidechainParticipant.call(A_SIDECHAIN_ID, EXPECTED_OFFSET);
        assert.equal("0x0000000000000000000000000000000000000000", newParticipantStored, "unexpectedly, the stored participant was not zeroized.");
    });

    it("remove a masked participant", async function() {
        let pinningInterface = await common.getNewAnonPinning();
        await addSidechain(pinningInterface);

        let newParticipant = accounts[1];
        let salt = "0x123456789ABCDEF0123456789ABCDEF0";
        let maskedParticipant  = web3.utils.keccak256(newParticipant, salt);

        // Add the participant.
        await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_ADD_MASKED_PARTICIPANT, maskedParticipant, "0", "0");
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        let actionResult = await pinningInterface.actionVotes(A_SIDECHAIN_ID, maskedParticipant);
        const result1 = await common.checkVotingResult(actionResult.logs);
        assert.equal(true, result1, "incorrect result reported in event");

        const EXPECTED_OFFSET = "0";
        let maskedParticipantStored = await pinningInterface.getMaskedSidechainParticipant.call(A_SIDECHAIN_ID, EXPECTED_OFFSET);
        let maskedParticipantStoredHex = web3.utils.toHex(maskedParticipantStored);
        assert.equal(maskedParticipant, maskedParticipantStoredHex, "unexpectedly, the stored masked participant did not match the value supplied.");

        // Remove the participant.
        await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_REMOVE_MASKED_PARTICIPANT, maskedParticipant, EXPECTED_OFFSET, "0");
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        actionResult = await pinningInterface.actionVotes(A_SIDECHAIN_ID, maskedParticipant);
        const result2 = await common.checkVotingResult(actionResult.logs);
        assert.equal(true, result2, "incorrect result reported in event");

        maskedParticipantStored = await pinningInterface.getMaskedSidechainParticipant.call(A_SIDECHAIN_ID, EXPECTED_OFFSET);
        maskedParticipantStoredHex = web3.utils.toHex(maskedParticipantStored);
        assert.equal(0, maskedParticipantStoredHex, "unexpectedly, the stored masked participant was not zeroized.");
    });


    it("add a pin and then reject a pin", async function() {
        let pinningInterface = await common.getNewAnonPinning();
        await addSidechain(pinningInterface);

        let seed = 0; // This value should be randomly generated and sent to all nodes.
        let prfResult = await common.prfInit(seed);
        //console.log("prfResult: " + prfResult);
        prfResult = await common.prfNextValue(prfResult[0], prfResult[1]);
        let randValue1 = prfResult[2];
        prfResult = await common.prfNextValue(prfResult[0], prfResult[1]);
        let randValue2 = prfResult[2];
        prfResult = await common.prfNextValue(prfResult[0], prfResult[1]);
        let randValue3 = prfResult[2];
        prfResult = await common.prfNextValue(prfResult[0], prfResult[1]);
        let randValue4 = prfResult[2];
        // console.log("RandValue1: " + randValue1);
        // console.log("RandValue2: " + randValue2);
        // console.log("RandValue3: " + randValue3);
        // console.log("RandValue3: " + randValue4);

        let initialPin = "0x0000000000000000000000000000000000000000000000000000000000000000";
        let blockHash0 = "0x00000000000000000000000000000000000000000000000000000000001a3450";
        let blockHash1 = "0x00000000000000000000000000000000000000000000000000000000001a3451";
        let blockHash2 = "0x00000000000000000000000000000000000000000000000000000000001a3452";


        let val = A_SIDECHAIN_ID + initialPin.substring(2) +randValue1.substring(2);
        //console.log("val: " + val);
        let calculatedPinKey0 = web3.utils.keccak256(val);
        //console.log("Pin0: " + calculatedPinKey0);

        val = A_SIDECHAIN_ID + blockHash0.substring(2) +randValue2.substring(2);
        //console.log("val: " + val);
        let calculatedPinKey1 = web3.utils.keccak256(val);
        //console.log("Pin1: " + calculatedPinKey1);

        val = A_SIDECHAIN_ID + blockHash1.substring(2) + randValue3.substring(2);
        //console.log("val: " + val);
        let calculatedPinKey2 = web3.utils.keccak256(val);
        //console.log("Pin2: " + calculatedPinKey2);

        val = A_SIDECHAIN_ID + blockHash2.substring(2) + randValue4.substring(2);
        //console.log("val: " + val);
        let calculatedPinKey3 = web3.utils.keccak256(val);
        //console.log("Pin3: " + calculatedPinKey3);



        await pinningInterface.addPin(calculatedPinKey0, blockHash0);
        await pinningInterface.addPin(calculatedPinKey1, blockHash1);
        await pinningInterface.addPin(calculatedPinKey2, blockHash2);

        const retrievedPin = await pinningInterface.getPin(calculatedPinKey2);
        assert.equal(blockHash2, retrievedPin);

        const retrievedPinNonExistent = await pinningInterface.getPin(calculatedPinKey3);
        assert.equal("0x0000000000000000000000000000000000000000000000000000000000000000", retrievedPinNonExistent);


        await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_CONTEST_PIN,
            calculatedPinKey2,  // Pin being contested
            calculatedPinKey1,  // Previous Pin
            randValue3);        // Psuedo random function value demonstrating that the pins are connected and belong to sidechain 2.
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        let actionResult = await pinningInterface.actionVotes(A_SIDECHAIN_ID, calculatedPinKey2);
        const result1 = await common.checkVotingResult(actionResult.logs);
        assert.equal(true, result1, "incorrect result reported in event");
    });


});