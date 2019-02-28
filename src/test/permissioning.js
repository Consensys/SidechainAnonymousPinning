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

contract('Permissioning Check', function(accounts) {
    let common = require('./common');

    it("addSidechain when account is not an unmasked participant of the Management Pseudo Sidechain", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        let didNotTriggerError = false;
        try {
            await pinningInterface.addSidechain(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, await common.getValidVotingContractAddress(), common.VOTING_PERIOD, {from: accounts[1]});
            didNotTriggerError = true;
        } catch(err) {
            assert.equal(err.message, common.REVERT);
            //console.log("ERROR! " + err.message);
        }
        assert.equal(didNotTriggerError, false);
    });


    it("proposeVote when account is not an unmasked participant of the Management Pseudo Sidechain", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        let didNotTriggerError = false;
        try {
            await pinningInterface.proposeVote(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, accounts[1], "1", "2", {from: accounts[1]});
            didNotTriggerError = true;
        } catch(err) {
            assert.equal(err.message, common.REVERT);
            //console.log("ERROR! " + err.message);
        }
        assert.equal(didNotTriggerError, false);
    });

    it("vote when account is not an unmasked participant of the Management Pseudo Sidechain", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        let didNotTriggerError = false;
        try {
            await pinningInterface.vote(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, accounts[1], true, {from: accounts[1]});
            didNotTriggerError = true;
        } catch(err) {
            assert.equal(err.message, common.REVERT);
            //console.log("ERROR! " + err.message);
        }
        assert.equal(didNotTriggerError, false);
    });

    it("actionVotes when account is not an unmasked participant of the Management Pseudo Sidechain", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        let didNotTriggerError = false;
        try {
            await pinningInterface.actionVotes(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, accounts[1], {from: accounts[1]});
            didNotTriggerError = true;
        } catch(err) {
            assert.equal(err.message, common.REVERT);
            //console.log("ERROR! " + err.message);
        }
        assert.equal(didNotTriggerError, false);
    });
});
