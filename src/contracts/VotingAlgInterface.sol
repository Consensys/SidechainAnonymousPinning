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
pragma solidity ^0.4.23;

import "./Ownable.sol";

contract AbstractVotingAlg is Ownable {
    /**
     * Asses a vote.
     *
     * @param addressesVoted Array of addresses which voted.
     * @param votedFor Array of bools indicating whether the addresses in the addressesVoted
     *  array voted for or against the proposal.
     * @return true if the result of the vote true. That is, given the voting algorithm
     *  the result of the vote is for what was being voted on.
     */
    function assess(address[] addressesVoted, bool[] votedFor) public returns (bool);
}