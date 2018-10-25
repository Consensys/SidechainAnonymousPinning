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
 * This file contains tests around the management sidechain ID.
 *
 */

contract('Management Sidechain ID', function(accounts) {
    let common = require('./common');

    const twoSidechainId = "0x2";

    it("getSidechainExists for management sidechain", async function() {
        let pinningInterface = await await common.getDeployedAnonPinning();
        const exists = await pinningInterface.getSidechainExists.call(common.MANAGEMENT_SIDECHAIN_DUMMY_ID);

        assert.equal(exists, true);
    });


    it("attempting to recreate management sidechain id fails", async function() {
        let pinningInterface = await await common.getDeployedAnonPinning();
        let didNotTriggerError = false;
        try {
            await pinningInterface.addSidechain(common.MANAGEMENT_SIDECHAIN_DUMMY_ID, common.A_VALID_VOTING_PERIOD, "0x0123");
            didNotTriggerError = true;
        } catch(err) {
            // Expect that a revert will be called as the transaction is being sent by an account other than the owner.
            //console.log("ERROR! " + err.message);
        }

        assert.equal(didNotTriggerError, false);
    });


    it("check that the account which deployed the contract can call addSidechain", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        await pinningInterface.addSidechain(twoSidechainId, common.A_VALID_VOTING_PERIOD, common.A_VALID_VOTING_CONTRACT_ADDRESS);
    });

    it("check that accounts other than the one which deployed the contract can not call addSidechain", async function() {
        let pinningInterface = await await common.getNewAnonPinning();
        let didNotTriggerError = false;
        try {
            await pinningInterface.addSidechain(twoSidechainId, common.A_VALID_VOTING_PERIOD, common.A_VALID_VOTING_CONTRACT_ADDRESS, {from: accounts[1]});
            didNotTriggerError = true;
        } catch(err) {
            // Expect that a revert will be called as the transaction is being sent by an account other than the owner.
            //console.log("ERROR! " + err.message);
        }

        assert.equal(didNotTriggerError, false);
    });

});
