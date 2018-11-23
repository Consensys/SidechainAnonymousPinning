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
 * SidechainAnonPinningV1.sol check the voting algorithm: majority
 *
 */
const VotingAlgMajority = artifacts.require("./VotingAlgMajority.sol");

contract('Voting: majority voting tests:', function(accounts) {
    let common = require('./common');

    const A_SIDECHAIN_ID = "0x2";


    async function addSidechain(pinningInterface) {
        await pinningInterface.addSidechain(A_SIDECHAIN_ID, (await VotingAlgMajority.deployed()).address, common.VOTING_PERIOD);
    }

    async function addSecondParticipant(pinningInterface) {
        let newParticipant = accounts[1];
        await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, "1", "2");
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        await pinningInterface.actionVotes(A_SIDECHAIN_ID, newParticipant);
        let isParticipant = await pinningInterface.isSidechainParticipant.call(A_SIDECHAIN_ID, newParticipant);
        assert.equal(isParticipant, true, "unexpectedly, New Participant: isSidechainParticipant == false");
    }
    async function addThirdParticipant(pinningInterface) {
        let newParticipant = accounts[2];
        await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, "1", "2");
        await pinningInterface.vote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, true, {from: accounts[1]});
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        await pinningInterface.actionVotes(A_SIDECHAIN_ID, newParticipant);
        let isParticipant = await pinningInterface.isSidechainParticipant.call(A_SIDECHAIN_ID, newParticipant);
        assert.equal(isParticipant, true, "unexpectedly, New Participant: isSidechainParticipant == false");
    }
    async function addFourthParticipant(pinningInterface) {
        let newParticipant = accounts[3];
        await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, "1", "2");
        await pinningInterface.vote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, true, {from: accounts[1]});
        await pinningInterface.vote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, true, {from: accounts[2]});
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        await pinningInterface.actionVotes(A_SIDECHAIN_ID, newParticipant);
        let isParticipant = await pinningInterface.isSidechainParticipant.call(A_SIDECHAIN_ID, newParticipant);
        assert.equal(isParticipant, true, "unexpectedly, New Participant: isSidechainParticipant == false");
    }
    async function addFifthParticipant(pinningInterface) {
        let newParticipant = accounts[4];
        await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, "1", "2");
        await pinningInterface.vote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, true, {from: accounts[1]});
        await pinningInterface.vote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, true, {from: accounts[2]});
        await pinningInterface.vote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, true, {from: accounts[3]});
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        await pinningInterface.actionVotes(A_SIDECHAIN_ID, newParticipant);
        let isParticipant = await pinningInterface.isSidechainParticipant.call(A_SIDECHAIN_ID, newParticipant);
        assert.equal(isParticipant, true, "unexpectedly, New Participant: isSidechainParticipant == false");
    }

 /*   it("one participant", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        await addSidechain(pinningInterface);
        await addSecondParticipant(pinningInterface);
    });

    it("two participants: unanimous vote yes", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        await addSidechain(pinningInterface);
        await addSecondParticipant(pinningInterface);
        await addThirdParticipant(pinningInterface);
    });

    it("two participants: only one votes yes", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        await addSidechain(pinningInterface);
        await addSecondParticipant(pinningInterface);

        let newParticipant = accounts[2];
        await pinningInterface.proposeVote(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, "1", "2");
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        await pinningInterface.actionVotes(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, newParticipant);
        let isParticipant = await pinningInterface.isSidechainParticipant.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, newParticipant);
        assert.equal(isParticipant, false, "Majority did not vote yes. Unexpectedly, New Participant: isSidechainParticipant != false");
    });

    it("two participants: one votes yes, one votes no", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        await addSidechain(pinningInterface);
        await addSecondParticipant(pinningInterface);

        let newParticipant = accounts[2];
        await pinningInterface.proposeVote(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, "1", "2");
        await pinningInterface.vote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, false, {from: accounts[1]});
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        await pinningInterface.actionVotes(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, newParticipant);
        let isParticipant = await pinningInterface.isSidechainParticipant.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, newParticipant);
        assert.equal(isParticipant, false, "Majority did not vote yes. Unexpectedly, New Participant: isSidechainParticipant != false");
    });

    it("three participants: unanimous vote yes", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        await addSidechain(pinningInterface);
        await addSecondParticipant(pinningInterface);
        await addThirdParticipant(pinningInterface);
    });

    it("three participants: only one vote yes", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        await addSidechain(pinningInterface);
        await addSecondParticipant(pinningInterface);
        await addThirdParticipant(pinningInterface);

        let newParticipant = accounts[3];
        await pinningInterface.proposeVote(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, "1", "2");
        await pinningInterface.vote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, true, {from: accounts[1]});
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        await pinningInterface.actionVotes(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, newParticipant);
        let isParticipant = await pinningInterface.isSidechainParticipant.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, newParticipant);
        assert.equal(isParticipant, false, "Majority did not vote yes. Unexpectedly, New Participant: isSidechainParticipant != false");
    });

    it("three participants: one votes yes, one votes no", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        await addSidechain(pinningInterface);
        await addSecondParticipant(pinningInterface);
        await addThirdParticipant(pinningInterface);

        let newParticipant = accounts[3];
        await pinningInterface.proposeVote(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, "1", "2");
        await pinningInterface.vote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, false, {from: accounts[1]});
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        await pinningInterface.actionVotes(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, newParticipant);
        let isParticipant = await pinningInterface.isSidechainParticipant.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, newParticipant);
        assert.equal(isParticipant, false, "Majority did not vote yes. Unexpectedly, New Participant: isSidechainParticipant != false");
    });

    it("three participants: one votes yes, two vote no", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        await addSidechain(pinningInterface);
        await addSecondParticipant(pinningInterface);
        await addThirdParticipant(pinningInterface);

        let newParticipant = accounts[3];
        await pinningInterface.proposeVote(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, "1", "2");
        await pinningInterface.vote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, false, {from: accounts[1]});
        await pinningInterface.vote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, false, {from: accounts[2]});
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        await pinningInterface.actionVotes(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, newParticipant);
        let isParticipant = await pinningInterface.isSidechainParticipant.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, newParticipant);
        assert.equal(isParticipant, false, "Majority did not vote yes. Unexpectedly, New Participant: isSidechainParticipant != false");
    });

    it("three participants: two vote yes", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        await addSidechain(pinningInterface);
        await addSecondParticipant(pinningInterface);
        await addThirdParticipant(pinningInterface);

        let newParticipant = accounts[3];
        await pinningInterface.proposeVote(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, "1", "2");
        await pinningInterface.vote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, true, {from: accounts[1]});
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        await pinningInterface.actionVotes(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, newParticipant);
        let isParticipant = await pinningInterface.isSidechainParticipant.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, newParticipant);
        assert.equal(isParticipant, true, "Majority voted yes. Unexpectedly, New Participant: isSidechainParticipant == false");
    });

    it("three participants: two vote yes, one votes no", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        await addSidechain(pinningInterface);
        await addSecondParticipant(pinningInterface);
        await addThirdParticipant(pinningInterface);

        let newParticipant = accounts[3];
        await pinningInterface.proposeVote(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, "1", "2");
        await pinningInterface.vote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, true, {from: accounts[1]});
        await pinningInterface.vote(A_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, newParticipant, false, {from: accounts[2]});
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        await pinningInterface.actionVotes(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, newParticipant);
        let isParticipant = await pinningInterface.isSidechainParticipant.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, newParticipant);
        assert.equal(isParticipant, true, "Majority voted yes. Unexpectedly, New Participant: isSidechainParticipant == false");
    });
*/

});