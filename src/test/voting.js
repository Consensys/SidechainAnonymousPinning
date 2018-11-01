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
 * SidechainAnonPinningV1.sol check voting aspects of the contracts
 *
 */

contract('Voting: general tests', function(accounts) {
    let common = require('./common');

    it("finalise vote immediately after voting period", async function() {
        let secondParticipant = accounts[1];
        let pinningInterface = await await common.getNewAnonPinning();

        await pinningInterface.proposeVote(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, secondParticipant, "1", "2");
        await common.mineBlocks(parseInt(common.VOTING_PERIOD));
        await pinningInterface.actionVotes(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, secondParticipant);
        common.checkVotingResult(pinningInterface, true);

        let isParticipant = await pinningInterface.isSidechainParticipant.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, secondParticipant);
        assert.equal(isParticipant, true, "unexpectedly, Second Participant: isSidechainParticipant == false");
    });

    it("finalise vote after voting period", async function() {
        let secondParticipant = accounts[1];
        let pinningInterface = await await common.getNewAnonPinning();

        await pinningInterface.proposeVote(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, secondParticipant, "1", "2");
        await common.mineBlocks(parseInt(common.VOTING_PERIOD_PLUS_ONE));
        await pinningInterface.actionVotes(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, secondParticipant);
        common.checkVotingResult(pinningInterface, true);

        let isParticipant = await pinningInterface.isSidechainParticipant.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, secondParticipant);
        assert.equal(isParticipant, true, "unexpectedly, Second Participant: isSidechainParticipant == false");
    });

    it("finalise vote immediately: expect to fail", async function() {
        let secondParticipant = accounts[1];
        let pinningInterface = await await common.getNewAnonPinning();

        await pinningInterface.proposeVote(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, secondParticipant, "1", "2");
        let didNotTriggerError = false;
        try {
            await pinningInterface.actionVotes(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, secondParticipant);
            didNotTriggerError = true;
        } catch(err) {
            assert.equal(err.message, common.REVERT);
            //console.log("ERROR! " + err.message);
        }
        assert.equal(didNotTriggerError, false);

        let isParticipant = await pinningInterface.isSidechainParticipant.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, secondParticipant);
        assert.equal(isParticipant, false, "unexpectedly, Second Participant: isSidechainParticipant != false");
    });

    it("dont finalise vote", async function() {
        let secondParticipant = accounts[1];
        let pinningInterface = await await common.getNewAnonPinning();

        await pinningInterface.proposeVote(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, secondParticipant, "1", "2");

        let isParticipant = await pinningInterface.isSidechainParticipant.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, secondParticipant);
        assert.equal(isParticipant, false, "unexpectedly, Second Participant: isSidechainParticipant != false");
    });

    it("finalise vote early: expect to fail", async function() {
        let secondParticipant = accounts[1];
        let pinningInterface = await await common.getNewAnonPinning();

        await pinningInterface.proposeVote(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, secondParticipant, "1", "2");
        await common.mineBlocks(parseInt(common.VOTING_PERIOD_MINUS_ONE));
        let didNotTriggerError = false;
        try {
            await pinningInterface.actionVotes(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, secondParticipant);
            didNotTriggerError = true;
        } catch(err) {
            assert.equal(err.message, common.REVERT);
            //console.log("ERROR! " + err.message);
        }
        assert.equal(didNotTriggerError, false);

        let isParticipant = await pinningInterface.isSidechainParticipant.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, secondParticipant);
        assert.equal(isParticipant, false, "unexpectedly, Second Participant: isSidechainParticipant != false");
    });



});