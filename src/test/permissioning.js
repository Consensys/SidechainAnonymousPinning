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
            await pinningInterface.addSidechain(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, common.A_VALID_VOTING_CONTRACT_ADDRESS, common.VOTING_PERIOD, {from: accounts[1]});
            didNotTriggerError = true;
        } catch(err) {
            // Expect that a revert will be called as the transaction is being sent by an account other than the owner.
            //console.log("ERROR! " + err.message);
        }

        assert.equal(didNotTriggerError, false);
    });


    it("proposeVote when account is not an unmasked participant of the Management Pseudo Sidechain", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        let didNotTriggerError = false;
        try {
            const hasS = await pinningInterface.proposeVote.call(common.MANAGEMENT_PSEUDO_SIDECHAIN_ID, common.VOTE_ADD_UNMASKED_PARTICIPANT, accounts[1], "1", "2", {from: accounts[1]});
            didNotTriggerError = true;
        } catch(err) {
            // Expect that a revert will be called as the transaction is being sent by an account other than the owner.
            console.log("ERROR! " + err.message);
        }

        assert.equal(didNotTriggerError, false);
    });


    /*

    it("vote", async function() {
        let pinningInstance = await Pinning.new();
        let pinningAddress = pinningInstance.address;
        let pinningInterface = await AbstractPinning.at(pinningAddress);
        let didNotTriggerError = false;
        try {
            const hasS = await pinningInterface.vote.call(zeroSidechainId, oneSidechainId, true);
            didNotTriggerError = true;
        } catch(err) {
            // Expect that a revert will be called as the transaction is being sent by an account other than the owner.
            //console.log("ERROR! " + err.message);
        }

        assert.equal(didNotTriggerError, false);
    });

    it("actionVotes", async function() {
        let pinningInstance = await Pinning.new();
        let pinningAddress = pinningInstance.address;
        let pinningInterface = await AbstractPinning.at(pinningAddress);
        let didNotTriggerError = false;
        try {
            const hasS = await pinningInterface.actionVotes.call(zeroSidechainId, oneSidechainId);
            didNotTriggerError = true;
        } catch(err) {
            // Expect that a revert will be called as the transaction is being sent by an account other than the owner.
            //console.log("ERROR! " + err.message);
        }

        assert.equal(didNotTriggerError, false);
    });

    it("addPin", async function() {
        let pinningInstance = await Pinning.new();
        let pinningAddress = pinningInstance.address;
        let pinningInterface = await AbstractPinning.at(pinningAddress);
        let didNotTriggerError = false;
        try {
            const hasS = await pinningInterface.addPin.call(zeroSidechainId, oneSidechainId);
            didNotTriggerError = true;
        } catch(err) {
            // Expect that a revert will be called as the transaction is being sent by an account other than the owner.
            //console.log("ERROR! " + err.message);
        }

        assert.equal(didNotTriggerError, false);
    });
*/
});
