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
 * This file contains code which is common to many of the test files.
 */

const SidechainAnonPinningV1 = artifacts.require("./SidechainAnonPinningV1.sol");

// All tests of the public API must be tested via the interface. This ensures all functions
// which are assumed to be part of the public API actually are in the interface.
const SidechainAnonPinningInterface = artifacts.require("./SidechainAnonPinningInterface.sol");

const VotingAlgMajority = artifacts.require("./VotingAlgMajority.sol");


const MANAGEMENT_SIDECHAIN_DUMMY_ID = "0";
const A_VALID_VOTING_PERIOD = "1"; // A voting period which can be used in tests that need to specify a voting period.
const A_VALID_VOTING_CONTRACT_ADDRESS = "0x123";//VotingAlgMajority.deployed().address;

// Note that these values need to match what is set in the 1_initial_migration.js file.
const VOTING_PERIOD = "3";
const VOTE_VIEWING_PERIOD = "2";



const VOTE_NONE = "0";
const VOTE_ADD_MASKED_PARTICIPANT = "1";
const VOTE_REMOVE_MASKED_PARTICIPANT = "2";
const VOTE_ADD_UNMASKED_PARTICIPANT = "3";
const VOTE_REMOVE_UNMASKED_PARTICIPANT = "4";
const VOTE_CHALLENGE_PIN = "5";


const mineOneBlock = async function() {
    // Mine one or more blocks.
    await web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [],
        id: 0,
    })
};


const mineBlocks = async function(n) {
    for (let i = 0; i < n; i++) {
        await mineOneBlock()
    }
}





function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


module.exports = {
    MANAGEMENT_SIDECHAIN_DUMMY_ID: MANAGEMENT_SIDECHAIN_DUMMY_ID,


    VOTE_NONE: VOTE_NONE,

    VOTE_ADD_MASKED_PARTICIPANT: VOTE_ADD_MASKED_PARTICIPANT,
    VOTE_REMOVE_MASKED_PARTICIPANT: VOTE_REMOVE_MASKED_PARTICIPANT,
    VOTE_ADD_UNMASKED_PARTICIPANT: VOTE_ADD_UNMASKED_PARTICIPANT,
    VOTE_REMOVE_UNMASKED_PARTICIPANT: VOTE_REMOVE_UNMASKED_PARTICIPANT,
    VOTE_CHALLENGE_PIN: VOTE_CHALLENGE_PIN,

    VOTING_PERIOD: VOTING_PERIOD,
    VOTE_VIEWING_PERIOD: VOTE_VIEWING_PERIOD,
    A_VALID_VOTING_CONTRACT_ADDRESS: A_VALID_VOTING_CONTRACT_ADDRESS,

    getNewAnonPinning: async function() {
        let instance = await SidechainAnonPinningV1.new(VotingAlgMajority.deployed().address, VOTING_PERIOD, VOTE_VIEWING_PERIOD);
        let instanceAddress = instance.address;
        return await SidechainAnonPinningInterface.at(instanceAddress);
    },
    getDeployedAnonPinning: async function() {
        let instance = await SidechainAnonPinningV1.deployed();
        let instanceAddress = instance.address;
        return await SidechainAnonPinningInterface.at(instanceAddress);
    },

    mineOneBlock: mineOneBlock,

    mineBlocks: mineBlocks,

    dumpAllDomainAddUpdateEvents: async function(eraInterface) {
        console.log("ContractAddress                                 Event           BlkNum DomainHash                 AuthorityAddress             OrgAddress                OwnerAddress");
        await eraInterface.DomainAddUpdate({}, {fromBlock: 0, toBlock: "latest"}).get(function(error, result){
            if (error) {
                console.log(error);
                throw error;

            }
            if (result.length === 0) {
                console.log("No events recorded");
            } else {
                var i;
                for (i = 0; i < result.length; i++) {
                    console.log(
                        result[i].address + " \t" +
                        result[i].event + " \t" +
                        result[i].blockNumber + " \t" +
                        result[i].args._domainHash + " \t" +
                        result[i].args._domainAuthority + " \t" +
                        result[i].args._orgInfo + " \t" +
                        result[i].args._owner + " \t"
                        //+
//                        result[i].blockHash + "    " +
//                        result[i].logIndex + " " +
//                        result[i].transactionHash + "  " +
//                        result[i].transactionIndex
                    );

                }
            }
        });
        // If this sleep isn't here, the Ethereum Client is shutdown before the code above finished executing.
        await sleep(100);
    },

    // Pass in a contract instance and expected value to retrieve the number of emitted events and run an assertion.
    assertDomainAddUpdateEventNum: async function(eraInterface, expectedNumEvents) {
        eraInterface.DomainAddUpdate({}, {fromBlock: 0, toBlock: "latest"}).get(function(error, result){
            if (error) {
                console.log(error);
                throw error;

            }
            assert.equal(expectedNumEvents, result.length);
        });
        // If this sleep isn't here, the Ethereum Client is shutdown before the code above finished executing.
        await sleep(100);
    }




};

