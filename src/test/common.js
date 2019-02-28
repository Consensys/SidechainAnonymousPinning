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


const MANAGEMENT_PSEUDO_SIDECHAIN_ID = "0";

// Note that these values need to match what is set in the 1_initial_migration.js file.
const VOTING_PERIOD = "3";
const VOTING_PERIOD_PLUS_ONE = "4";
const VOTING_PERIOD_MINUS_ONE = "2";

// Note that these values need to match what is set in the 1_initial_migration.js file.
const PIN_CONTEST_PERIOD = "6";
const PIN_CONTEST_PERIOD_PLUS_ONE = "7";


const VOTE_NONE = "0";
const VOTE_ADD_MASKED_PARTICIPANT = "1";
const VOTE_REMOVE_MASKED_PARTICIPANT = "2";
const VOTE_ADD_UNMASKED_PARTICIPANT = "3";
const VOTE_REMOVE_UNMASKED_PARTICIPANT = "4";
const VOTE_CONTEST_PIN = "5";

const REVERT = "Returned error: VM Exception while processing transaction: revert";

const mineOneBlock = async function() {
    // Mine one or more blocks.
    await web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [],
        id: 0,
    }, function(err, result) {
        // dummy call back
    })
};


const mineBlocks = async function(n) {
    for (let i = 0; i < n; i++) {
        await mineOneBlock()
    }
};








function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


module.exports = {
    MANAGEMENT_PSEUDO_SIDECHAIN_ID: MANAGEMENT_PSEUDO_SIDECHAIN_ID,


    VOTE_NONE: VOTE_NONE,

    VOTE_ADD_MASKED_PARTICIPANT: VOTE_ADD_MASKED_PARTICIPANT,
    VOTE_REMOVE_MASKED_PARTICIPANT: VOTE_REMOVE_MASKED_PARTICIPANT,
    VOTE_ADD_UNMASKED_PARTICIPANT: VOTE_ADD_UNMASKED_PARTICIPANT,
    VOTE_REMOVE_UNMASKED_PARTICIPANT: VOTE_REMOVE_UNMASKED_PARTICIPANT,
    VOTE_CONTEST_PIN: VOTE_CONTEST_PIN,

    VOTING_PERIOD: VOTING_PERIOD,
    VOTING_PERIOD_PLUS_ONE: VOTING_PERIOD_PLUS_ONE,
    VOTING_PERIOD_MINUS_ONE: VOTING_PERIOD_MINUS_ONE,
    PIN_CONTEST_PERIOD: PIN_CONTEST_PERIOD,
    PIN_CONTEST_PERIOD_PLUS_ONE: PIN_CONTEST_PERIOD_PLUS_ONE,
    getValidVotingContractAddress: async function() {
        return (await VotingAlgMajority.deployed()).address;
    },

    REVERT: REVERT,

    getNewAnonPinning: async function() {
        let instance = await SidechainAnonPinningV1.new((await VotingAlgMajority.deployed()).address, VOTING_PERIOD, PIN_CONTEST_PERIOD);
        let instanceAddress = instance.address;
        return await SidechainAnonPinningInterface.at(instanceAddress);
    },
    getDeployedAnonPinning: async function() {
        let instance = await SidechainAnonPinningV1.deployed();
        let instanceAddress = instance.address;
        return await SidechainAnonPinningInterface.at(instanceAddress);
    },
    // Initialise the PRF. If no entropy is supplied, then zero is automatically used.
    prfInit: async function(seed) {
        // var Web3 = require('web3');
        // var web3 = new Web3();
        //console.log("prfInit");
        let val = seed + "1";
        let prfInternalState = web3.utils.keccak256(val);
        val = seed + "2";
        let prfInternalCounter = web3.utils.keccak256(val);
        // console.log(" Out: state: " + prfInternalState);
        // console.log(" Out: count: " + prfInternalCounter);
        return [prfInternalState, prfInternalCounter];
    },
    // Initialise the PRF. If no entropy is supplied, then zero is automatically used.
    prfNextValue: async function(prfInternalState, prfInternalCounter) {
        // var Web3 = require('web3');
        // var web3 = new Web3();
        //console.log("prfNextValue");
        //console.log(" In: state: " + prfInternalState);
        //console.log(" In: count: " + prfInternalCounter);
        prfInternalCounter++;
        let val = prfInternalState + prfInternalCounter;
        //console.log(" Combined : " + val);
        prfInternalState = web3.utils.keccak256(val);
        let prfValue = web3.utils.keccak256(prfInternalState);
        //console.log(" Out: state: " + prfInternalState);
        //console.log(" Out: count: " + prfInternalCounter);
        //console.log(" Out: value: " + prfValue);
        return [prfInternalState, prfInternalCounter, prfValue];
    },

    mineOneBlock: mineOneBlock,

    mineBlocks: mineBlocks,

    checkVotingResult: function(logs) {
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, "VoteResult");
        return logs[0].args._result;
    },



    dumpAllDump1Events: async function(anInterface) {
        console.log("ContractAddress                                 Event           BlkNum DomainHash                 val1             val2                val3");
        await anInterface.Dump1({}, {fromBlock: 0, toBlock: "latest"}).get(function(error, result){
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
                        result[i].args.a + " \t" +
                        result[i].args.b + " \t" +
                        result[i].args.c + " \t"
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
    }



};

