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
 * correctly when there are no sidechains in the contract or any other set-up.
 *
 */

contract('Pinning: Empty Tests', function(accounts) {
    let common = require('./common');

    const twoSidechainId = "0x2";

    it("getSidechainExists for management sidechain", async function() {
        let pinningInterface = await await common.getDeployedAnonPinning();
        const exists = await pinningInterface.getSidechainExists.call(common.MANAGEMENT_SIDECHAIN_DUMMY_ID);

        assert.equal(exists, true);
    });


    it("getSidechainExists for non-existent sidechain", async function() {
        let pinningInterface = await await common.getDeployedAnonPinning();
        const exists = await pinningInterface.getSidechainExists.call(twoSidechainId);

        assert.equal(exists, false);
    });

    /*
    it("getVotingPeriod", async function() {
        let pinningInstance = await Pinning.new();
        let pinningAddress = pinningInstance.address;
        let pinningInterface = await AbstractPinning.at(pinningAddress);
        let didNotTriggerError = false;
        try {
            const hasS = await pinningInterface.getVotingPeriod.call(zeroSidechainId);
            didNotTriggerError = true;
        } catch(err) {
            // Expect that a revert will be called as the transaction is being sent by an account other than the owner.
            //console.log("ERROR! " + err.message);
        }

        assert.equal(didNotTriggerError, false);
    });

    it("isSidechainParticipant", async function() {
        let pinningInstance = await Pinning.new();
        let pinningAddress = pinningInstance.address;
        let pinningInterface = await AbstractPinning.at(pinningAddress);
        let didNotTriggerError = false;
        try {
            const hasS = await pinningInterface.isSidechainParticipant.call(zeroSidechainId, testOrgInfoAddress1);
            didNotTriggerError = true;
        } catch(err) {
            // Expect that a revert will be called as the transaction is being sent by an account other than the owner.
            //console.log("ERROR! " + err.message);
        }

        assert.equal(didNotTriggerError, false);
    });


    it("getNumberUnmaskedSidechainParticipants", async function() {
        let pinningInstance = await Pinning.new();
        let pinningAddress = pinningInstance.address;
        let pinningInterface = await AbstractPinning.at(pinningAddress);
        let didNotTriggerError = false;
        try {
            const hasS = await pinningInterface.getNumberUnmaskedSidechainParticipants.call(zeroSidechainId, testOrgInfoAddress1);
            didNotTriggerError = true;
        } catch(err) {
            // Expect that a revert will be called as the transaction is being sent by an account other than the owner.
            //console.log("ERROR! " + err.message);
        }

        assert.equal(didNotTriggerError, false);
    });

    it("getUnmaskedSidechainParticipant", async function() {
        let pinningInstance = await Pinning.new();
        let pinningAddress = pinningInstance.address;
        let pinningInterface = await AbstractPinning.at(pinningAddress);
        let didNotTriggerError = false;
        try {
            const hasS = await pinningInterface.getUnmaskedSidechainParticipant.call(zeroSidechainId, 1);
            didNotTriggerError = true;
        } catch(err) {
            // Expect that a revert will be called as the transaction is being sent by an account other than the owner.
            //console.log("ERROR! " + err.message);
        }

        assert.equal(didNotTriggerError, false);
    });

    it("getNumberMaskedSidechainParticipants", async function() {
        let pinningInstance = await Pinning.new();
        let pinningAddress = pinningInstance.address;
        let pinningInterface = await AbstractPinning.at(pinningAddress);
        let didNotTriggerError = false;
        try {
            const hasS = await pinningInterface.getNumberMaskedSidechainParticipants.call(zeroSidechainId);
            didNotTriggerError = true;
        } catch(err) {
            // Expect that a revert will be called as the transaction is being sent by an account other than the owner.
            //console.log("ERROR! " + err.message);
        }

        assert.equal(didNotTriggerError, false);
    });

    it("getMaskedSidechainParticipant", async function() {
        let pinningInstance = await Pinning.new();
        let pinningAddress = pinningInstance.address;
        let pinningInterface = await AbstractPinning.at(pinningAddress);
        let didNotTriggerError = false;
        try {
            const hasS = await pinningInterface.getMaskedSidechainParticipant.call(zeroSidechainId, 1);
            didNotTriggerError = true;
        } catch(err) {
            // Expect that a revert will be called as the transaction is being sent by an account other than the owner.
            //console.log("ERROR! " + err.message);
        }

        assert.equal(didNotTriggerError, false);
    });

    it("unmask", async function() {
        let pinningInstance = await Pinning.new();
        let pinningAddress = pinningInstance.address;
        let pinningInterface = await AbstractPinning.at(pinningAddress);
        let didNotTriggerError = false;
        try {
            const hasS = await pinningInterface.unmask.call(zeroSidechainId, 1, oneSidechainId);
            didNotTriggerError = true;
        } catch(err) {
            // Expect that a revert will be called as the transaction is being sent by an account other than the owner.
            //console.log("ERROR! " + err.message);
        }

        assert.equal(didNotTriggerError, false);
    });

    it("proposeVote", async function() {
        let pinningInstance = await Pinning.new();
        let pinningAddress = pinningInstance.address;
        let pinningInterface = await AbstractPinning.at(pinningAddress);
        let didNotTriggerError = false;
        try {
            const hasS = await pinningInterface.proposeVote.call(zeroSidechainId, oneSidechainId, 1);
            didNotTriggerError = true;
        } catch(err) {
            // Expect that a revert will be called as the transaction is being sent by an account other than the owner.
            //console.log("ERROR! " + err.message);
        }

        assert.equal(didNotTriggerError, false);
    });

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

    it("getPin", async function() {
        let pinningInstance = await Pinning.new();
        let pinningAddress = pinningInstance.address;
        let pinningInterface = await AbstractPinning.at(pinningAddress);
        let didNotTriggerError = false;
        try {
            const hasS = await pinningInterface.getPin.call(zeroSidechainId);
            didNotTriggerError = true;
        } catch(err) {
            // Expect that a revert will be called as the transaction is being sent by an account other than the owner.
            //console.log("ERROR! " + err.message);
        }

        assert.equal(didNotTriggerError, false);
    });

    */
});
