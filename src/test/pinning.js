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
const VotingAlgMajority = artifacts.require("./VotingAlgMajority.sol");

contract('Pinning:', function(accounts) {
    let common = require('../test/common');

    const A_SIDECHAIN_ID = "0x001d3b0000000000030040000000000006400000000000000000000000000002";


    async function addSidechain(pinningInterface) {
        await pinningInterface.addSidechain(A_SIDECHAIN_ID, (await VotingAlgMajority.deployed()).address, common.VOTING_PERIOD);
    }



    it("add pins", async function() {
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

        // The pin should have been removed.
        const retrievedPin1 = await pinningInterface.getPin(calculatedPinKey2);
        assert.equal("0x0100000000000000000000000000000000000000000000000000000000000000", retrievedPin1);
    });


    it("add a pin and then attempt to reject a pin after contest period", async function() {
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

        await common.mineBlocks(parseInt(common.PIN_CONTEST_PERIOD_PLUS_ONE));

        // An error should be thrown because there is an attempt to contest after the contest period.
        let didNotTriggerError = false;
        try {
            await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_CONTEST_PIN,
                calculatedPinKey2,  // Pin being contested
                calculatedPinKey1,  // Previous Pin
                randValue3);        // Psuedo random function value demonstrating that the pins are connected and belong to sidechain 2.
            didNotTriggerError = true;
        } catch(err) {
            assert.equal(err.message, common.REVERT);
            //console.log("ERROR! " + err.message);
        }
        assert.equal(didNotTriggerError, false);

        // Check that pin2 has not been removed.
        const retrievedPin = await pinningInterface.getPin(calculatedPinKey2);
        assert.equal(blockHash2, retrievedPin);
    });

    it("add a pin and then reject pin, but don't finalise result until after contest period", async function() {
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

        await pinningInterface.proposeVote(A_SIDECHAIN_ID, common.VOTE_CONTEST_PIN,
            calculatedPinKey2,  // Pin being contested
            calculatedPinKey1,  // Previous Pin
            randValue3);        // Psuedo random function value demonstrating that the pins are connected and belong to sidechain 2.

        // Note, the contest period must be greater than the voting period.
        await common.mineBlocks(parseInt(common.PIN_CONTEST_PERIOD_PLUS_ONE));

        // The action votes will be ignored because the contest period has finished.
        let actionResult = await pinningInterface.actionVotes(A_SIDECHAIN_ID, calculatedPinKey2);
        const result1 = await common.checkVotingResult(actionResult.logs);
        assert.equal(true, result1, "incorrect result reported in event");

        // The pin should still be there.
        const retrievedPin1 = await pinningInterface.getPin(calculatedPinKey2);
        assert.equal(blockHash2, retrievedPin1);
    });
});