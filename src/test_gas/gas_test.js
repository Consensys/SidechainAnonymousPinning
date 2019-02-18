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
 * Tests which analyse gas usage of the SidechainAnonPinning contract.
 *
 * The following is the gas usage shown when the tests are run:
 *
 gas: contract deploy: 2506889
 add sidechain: 133280
 Propose VOTE_ADD_UNMASKED_PARTICIPANT1: 151011
 Action  VOTE_ADD_UNMASKED_PARTICIPANT1: 64090
 Propose VOTE_ADD_UNMASKED_PARTICIPANT2: 151011
 Vote    VOTE_ADD_UNMASKED_PARTICIPANT2: 54432
 Action  VOTE_ADD_UNMASKED_PARTICIPANT2: 67641
 Num Unmasked Participants: 3
 Propose VOTE_ADD_MASKED_PARTICIPANT: 121639
 Action  VOTE_ADD_MASKED_PARTICIPANT: 72624
 Num Masked Participants: 1
 Propose VOTE_REMOVE_UNMASKED_PARTICIPANT: 136645
 Vote    VOTE_REMOVE_UNMASKED_PARTICIPANT: 54432
 Action  VOTE_REMOVE_UNMASKED_PARTICIPANT: 47126
 Num Unmasked Participants: 3
 Propose VOTE_REMOVE_MASKED_PARTICIPANT: 122238
 Action  VOTE_REMOVE_MASKED_PARTICIPANT: 38873
 Pin: 64997
 Pin: 64933
 Pin: 64997
 Propose VOTE_CONTEST_PIN: 156463
 Action VOTE_CONTEST_PIN: 38873

 */
const VotingAlgMajority = artifacts.require("./VotingAlgMajority.sol");
const SidechainAnonPinningV1 = artifacts.require("./SidechainAnonPinningV1.sol");


contract('Pinning Gas Tests:', function(accounts) {
    let common = require('../test/common');

    const A_SIDECHAIN_ID = "0x001d3b0000000000030040000000000006400000000000000000000000000002";

    async function tests(pinningInterface) {

        let result = await pinningInterface.addSidechain(A_SIDECHAIN_ID, (await VotingAlgMajority.deployed()).address, common.VOTING_PERIOD);
        console.log("add sidechain: " + result.receipt.gasUsed);

        let newParticipant1 = accounts[1];
        result = await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant1, "1", "2");
        console.log("Propose VOTE_ADD_UNMASKED_PARTICIPANT1: " + result.receipt.gasUsed);
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        result = await pinningInterface.actionVotes(A_SIDECHAIN_ID, newParticipant1);
        console.log("Action  VOTE_ADD_UNMASKED_PARTICIPANT1: " + result.receipt.gasUsed);

        result = await common.checkVotingResult(pinningInterface);
        assert.equal(true, result, "incorrect result reported in event");
        let isParticipant = await pinningInterface.isSidechainParticipant.call(A_SIDECHAIN_ID, newParticipant1);
        assert.equal(isParticipant, true, "unexpectedly, New Participant: isSidechainParticipant == false");


        let newParticipant2 = accounts[2];
        result = await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant2, "1", "2");
        console.log("Propose VOTE_ADD_UNMASKED_PARTICIPANT2: " + result.receipt.gasUsed);
        result = await pinningInterface.vote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant2, true, {from: newParticipant1});
        console.log("Vote    VOTE_ADD_UNMASKED_PARTICIPANT2: " + result.receipt.gasUsed);
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        result = await pinningInterface.actionVotes(A_SIDECHAIN_ID, newParticipant2);
        console.log("Action  VOTE_ADD_UNMASKED_PARTICIPANT2: " + result.receipt.gasUsed);

        result = await common.checkVotingResult(pinningInterface);
        assert.equal(true, result, "incorrect result reported in event");
        isParticipant = await pinningInterface.isSidechainParticipant.call(A_SIDECHAIN_ID, newParticipant2);
        assert.equal(isParticipant, true, "unexpectedly, New Participant: isSidechainParticipant == false");
        let numUnmaskedParticipants = await pinningInterface.getUnmaskedSidechainParticipantsSize.call(A_SIDECHAIN_ID);
        console.log("Num Unmasked Participants: " + numUnmaskedParticipants);


        var Web3 = require('web3');
        var web3 = new Web3();
        let newParticipant3 = accounts[3];
        let salt1 = "0000000000000000000000000000000000000000000000000000000000000001";
        let salt = "0x" + salt1;
        let maskedParticipant3  = web3.utils.keccak256(newParticipant3, salt1);

        result = await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_ADD_MASKED_PARTICIPANT, maskedParticipant3, "0", "0");
        console.log("Propose VOTE_ADD_MASKED_PARTICIPANT: " + result.receipt.gasUsed);
        await pinningInterface.vote(A_SIDECHAIN_ID, common.VOTE_ADD_MASKED_PARTICIPANT, maskedParticipant3, true, {from: newParticipant1});
        await pinningInterface.vote(A_SIDECHAIN_ID, common.VOTE_ADD_MASKED_PARTICIPANT, maskedParticipant3, true, {from: newParticipant2});
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        result = await pinningInterface.actionVotes(A_SIDECHAIN_ID, maskedParticipant3);
        console.log("Action  VOTE_ADD_MASKED_PARTICIPANT: " + result.receipt.gasUsed);
        let numMaskedParticipants = await pinningInterface.getMaskedSidechainParticipantsSize.call(A_SIDECHAIN_ID);
        console.log("Num Masked Participants: " + numMaskedParticipants);

        const EXPECTED_OFFSET = "0";
        let maskedParticipantStored = await pinningInterface.getMaskedSidechainParticipant.call(A_SIDECHAIN_ID, EXPECTED_OFFSET);
        let maskedParticipantStoredHex = web3.utils.toHex(maskedParticipantStored);
        assert.equal(maskedParticipant3, maskedParticipantStoredHex, "unexpectedly, the stored masked participant did not match the value supplied.");
        // I don't know why, but this is throwing a revert.
        // result = await pinningInterface.unmask(A_SIDECHAIN_ID, EXPECTED_OFFSET, salt, {from: newParticipant3});
        // console.log("Unmask: " + result.receipt.gasUsed);



        // Remove the unmasked participant.
        let participantToRemove = newParticipant2;
        const EXPECTED_OFFSET_PARTICIPANT2 = "2";
        result = await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_REMOVE_UNMASKED_PARTICIPANT, participantToRemove, EXPECTED_OFFSET_PARTICIPANT2, "0");
        console.log("Propose VOTE_REMOVE_UNMASKED_PARTICIPANT: " + result.receipt.gasUsed);
        result = await pinningInterface.vote(A_SIDECHAIN_ID, common.VOTE_REMOVE_UNMASKED_PARTICIPANT, participantToRemove, true, {from: newParticipant1});
        console.log("Vote    VOTE_REMOVE_UNMASKED_PARTICIPANT: " + result.receipt.gasUsed);
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        result = await pinningInterface.actionVotes(A_SIDECHAIN_ID, participantToRemove);
        console.log("Action  VOTE_REMOVE_UNMASKED_PARTICIPANT: " + result.receipt.gasUsed);

        isParticipant = await pinningInterface.isSidechainParticipant.call(A_SIDECHAIN_ID, participantToRemove);
        assert.equal(isParticipant, false, "unexpectedly, Removed Participant: isSidechainParticipant == true");
        numUnmaskedParticipants = await pinningInterface.getUnmaskedSidechainParticipantsSize.call(A_SIDECHAIN_ID);
        console.log("Num Unmasked Participants: " + numUnmaskedParticipants);

        // Remove the masked participant.
        const EXPECTED_OFFSET_MASKED = "0";
        result = await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_REMOVE_MASKED_PARTICIPANT, maskedParticipant3, EXPECTED_OFFSET_MASKED, "0");
        console.log("Propose VOTE_REMOVE_MASKED_PARTICIPANT: " + result.receipt.gasUsed);
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        result = await pinningInterface.actionVotes(A_SIDECHAIN_ID, maskedParticipant3);
        console.log("Action  VOTE_REMOVE_MASKED_PARTICIPANT: " + result.receipt.gasUsed);


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

        result = await pinningInterface.addPin(calculatedPinKey0, blockHash0);
        console.log("Pin: " + result.receipt.gasUsed);
        result = await pinningInterface.addPin(calculatedPinKey1, blockHash1);
        console.log("Pin: " + result.receipt.gasUsed);
        result = await pinningInterface.addPin(calculatedPinKey2, blockHash2);
        console.log("Pin: " + result.receipt.gasUsed);

        const retrievedPin = await pinningInterface.getPin(calculatedPinKey2);
        assert.equal(blockHash2, retrievedPin);

        const retrievedPinNonExistent = await pinningInterface.getPin(calculatedPinKey3);
        assert.equal("0x0000000000000000000000000000000000000000000000000000000000000000", retrievedPinNonExistent);


        result = await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_CONTEST_PIN,
            calculatedPinKey2,  // Pin being contested
            calculatedPinKey1,  // Previous Pin
            randValue3);        // Psuedo random function value demonstrating that the pins are connected and belong to sidechain 2.
        console.log("Propose VOTE_CONTEST_PIN: " + result.receipt.gasUsed);
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        result = await pinningInterface.actionVotes(A_SIDECHAIN_ID, calculatedPinKey2);
        console.log("Action VOTE_CONTEST_PIN: " + result.receipt.gasUsed);
        // const result1 = await common.checkVotingResult(pinningInterface);
        // assert.equal(true, result1, "incorrect result reported in event");
    }


    async function addSidechain(pinningInterface) {
        await pinningInterface.addSidechain(A_SIDECHAIN_ID, (await VotingAlgMajority.deployed()).address, common.VOTING_PERIOD);
    }

    async function addMaskedParticipant(pinningInterface, participant, salt) {
        var Web3 = require('web3');
        var web3 = new Web3();

//        let maskedParticipant  = web3.utils.keccak256("0x000000000000000000000000" + participant.substring(2) + salt);
        let maskedParticipant  = web3.utils.keccak256(participant + salt);

        await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_ADD_MASKED_PARTICIPANT, maskedParticipant, "0", "0");
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        await pinningInterface.actionVotes(A_SIDECHAIN_ID, maskedParticipant);
        const result = await common.checkVotingResult(pinningInterface);
        assert.equal(true, result, "incorrect result reported in event");

        return maskedParticipant;
    }


    it("unmask", async function() {
        var Web3 = require('web3');
        var web3 = new Web3();

        let pinningInterface = await await common.getNewAnonPinning();
        await addSidechain(pinningInterface);

        let newParticipant = accounts[1];
        let salt1 = "0000000000000000000000000000000000000000000000000000000000000001";
        let salt = "0x" + salt1;
        let maskedParticipant  = await addMaskedParticipant(pinningInterface, newParticipant, salt1);

        // Check that the masked participant exists and the unmasked participant does not exist.
        let isParticipant = await pinningInterface.isSidechainParticipant.call(A_SIDECHAIN_ID, newParticipant);
        assert.equal(isParticipant, false, "unexpectedly, New masked participant: isSidechainParticipant != false");

        const EXPECTED_OFFSET = "0";
        let maskedParticipantStored = await pinningInterface.getMaskedSidechainParticipant.call(A_SIDECHAIN_ID, EXPECTED_OFFSET);
        let maskedParticipantStoredHex = web3.utils.toHex(maskedParticipantStored);
        assert.equal(maskedParticipant, maskedParticipantStoredHex, "unexpectedly, the stored masked participant did not match the value supplied.");


        result = await pinningInterface.unmask(A_SIDECHAIN_ID, EXPECTED_OFFSET, salt, {from: newParticipant});
        console.log("Unmask: " + result.receipt.gasUsed);

        // Check that the masked participant doesn't exist and the unmasked participant does exist.
        isParticipant = await pinningInterface.isSidechainParticipant.call(A_SIDECHAIN_ID, newParticipant);
        assert.equal(isParticipant, true, "unexpectedly, unmasked participant doesnt exist: isSidechainParticipant == false");

        maskedParticipantStored = await pinningInterface.getMaskedSidechainParticipant.call(A_SIDECHAIN_ID, EXPECTED_OFFSET);
        maskedParticipantStoredHex = web3.utils.toHex(maskedParticipantStored);
        assert.equal("0x0", maskedParticipantStoredHex, "unexpectedly, the stored masked participant not zeroized.");
    });



    it("Pinning V1", async function() {
        let pinInstance = await SidechainAnonPinningV1.new((await VotingAlgMajority.deployed()).address, common.VOTING_PERIOD, common.PIN_CONTEST_PERIOD);
        let receipt = await web3.eth.getTransactionReceipt(pinInstance.transactionHash);
        console.log("gas: contract deploy: " + receipt.gasUsed);

        let pinningInterface = await common.getNewAnonPinning();
        await tests(pinningInterface);
    });



});