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

import "./SidechainAnonPinningInterface.sol";
import "./VotingAlgInterface.sol";


/**
 * Contract to manage multiple sidechains.
 *
 * For each sidechain, there are masked and unmasked participants. Unmasked participants have their
 * addresses listed as being members of a certain sidechain. Being unmasked allows the participant
 * to vote to add and remove other participants, change the voting period and algorithm, and contest
 * pins.
 *
 * Masked participants are participant which are listed against a sidechain. They are represented
 * as a salted hash of their address. The participant keeps the salt secret and keeps it off-chain.
 * If they need to unmask themselves, they present their secret salt. This is combined with their
 * sending address to create the salted hash. If this matches their masked participant value then
 * they become an unmasked participant.
 *
 * TODO discuss voting.
 *
 * Pinning values are put into a map. All participants of a sidechain agree on a sidechain secret.
 * The sidechain secret seeds a Deterministic Random Bit Generator (DRBG). A new 256 bit value is
 * generated each time an uncontested pin is posted. The key in the map is calculated using the
 * equation:
 *
 * DRBG_Value = DRBG.nextValue
 * Key = keccak256(Sidechain Identifier, Previous Pin, DRBG_Value).
 *
 * For the initial key for a sidechain, the Previous Pin is 0x00.
 *
 * Masked and unmasked participants of a sidechain observe the pinning map at the Key value waiting
 * for the next pin to be posted to that entry in the map. When the pin value is posted, they can then
 * determine if they wish to contest the pin. To contest the pin, they submit:
 *
 * Previous Key (and hence the previous pin)
 * DRBG_Value
 * Sidechain Id
 *
 * Given they know the valid DRBG Value, they are able to contest the pin, because they must be a member of the
 * sidechain. Given a good DRBG algorithm, this will not expose future or previous DRBG values, and hence will
 * not reveal earlier or future pinning values, and hence won't reveal the transaction rate of the sidechain.
 *
 * Once a key is reveals as belonging to a specific channel, then only unmasked participants can vote on
 * whether to reject or keep the pin.
 *
 *
 */
contract SidechainAnonPinningV1 is SidechainAnonPinningInterface {
    uint256 public constant MANAGEMENT_DUMMY_SIDECHAIN_ID = 0;


    // Indications that a vote is underway.
    // VOTE_NONE indicates no vote is underway. Also matches the deleted value for integers.
    enum VoteType {
        VOTE_NONE,                          // 0: MUST be the first value so it is the zero / deleted value.
        VOTE_ADD_MASKED_PARTICIPANT,        // 1
        VOTE_REMOVE_MASKED_PARTICIPANT,     // 2
        VOTE_ADD_UNMASKED_PARTICIPANT,      // 3
        VOTE_REMOVE_UNMASKED_PARTICIPANT,   // 4
        VOTE_CHANGE_VOTING_ALG,             // 5
        VOTE_CHANGE_VOTING_PERIOD,          // 6
        VOTE_CHANGE_PIN_VOTING_ALG,         // 7
        VOTE_CHANGE_PIN_VOTING_PERIOD      // 8
//        VOTE_CHANGE_LAST_VALUE              // Define the last value to more efficiently check for value voting values.
    }

    // For non-participant related votes, the participant is set as 0x00.
    bytes32 private constant VOTE_PARTICIPANT_NONE = 0x0;


    struct Votes {
        VoteType voteType;
        uint endOfVotingBlockNumber;
        address votingAlgorithmContract;
        address[] addressVoted; // Address of user who has voted.
        bool[] addressVotedFor; // True if the address voted for the action.
        // Have map as well as array to ensure constant time / constant cost look-up, independent of number of participants.
        mapping(address=>bool) hasVoted;
        uint256 additionalInfo;
    }

    struct SidechainRecord {
        // Voting period in blocks. This is the period in which participants can vote. Must be greater than 0.
        uint64 votingPeriod;

        // Voting viewing period in blocks. This is the period between when the voting has completed and when
        // the vote can be actioned. Once the vote is actioned, all information about who voted and how they voted
        // is removed from the ledger.
        uint64 voteViewingPeriod;

        // The algorithm for assessing the votes.
        address votingAlgorithmContract;


        address[] unmasked;
        // Have map as well as array to ensure constant time / constant cost look-up, independent of number of participants.
        mapping(address=>bool) inUnmasked;
        bytes32[] masked;
        // Have map as well as array to ensure constant time / constant cost look-up, independent of number of participants.
        mapping(bytes32=>bool) inMasked;

        // Votes for adding and removing participants, for changing voting algorithm and voting period.
        mapping(bytes32=>Votes) votes;

        // Voting period in blocks to be used for pinning disputes. A zero indicates there is no voting available.
        uint64 minPinPeriod;
    }

    mapping(uint256=>SidechainRecord) private sidechains;


    bytes32 private constant EMPTY_PIN = 0x00;

    struct Pins {
        bytes32 pin;
        uint256 blocknumber;
        address[] votedToRejectPin;
        mapping(address=>bool) hasVotedToRejectPin;
    }
    mapping(bytes32=>Pins) private pinningMap;




    /**
     * Function modifier to ensure only unmasked sidechain participants can call the function.
     *
     * @param _sidechainId The 256 bit identifier of the Sidechain.
     * @dev Throws if the message sender isn't a participant in the sidechain, or if the sidechain doesn't exist.
     */
    modifier onlySidechainParticipant(uint256 _sidechainId) {
        require(sidechains[_sidechainId].inUnmasked[msg.sender]);
        _;
    }

    constructor (uint64 _votingPeriod, address _votingAlgorithmContract) {
        addSidechainInternal(MANAGEMENT_DUMMY_SIDECHAIN_ID, _votingPeriod, _votingAlgorithmContract);
    }


    function addSidechain(uint256 _sidechainId, uint64 _votingPeriod, address _votingAlgorithmContract) external onlySidechainParticipant(MANAGEMENT_DUMMY_SIDECHAIN_ID) {
        addSidechainInternal(_sidechainId, _votingPeriod, _votingAlgorithmContract);
    }

    function addSidechainInternal(uint256 _sidechainId, uint64 _votingPeriod, address _votingAlgorithmContract) private {
        // The sidechain can not exist prior to creation.
        require(sidechains[_sidechainId].votingPeriod == 0);
        // The voting period must be greater than 0.
        require(_votingPeriod != 0);
        emit AddedSidechain(_sidechainId);

        // Create the entry in the map by assigning values to the structure.
        sidechains[_sidechainId].votingPeriod = _votingPeriod;
        sidechains[_sidechainId].votingAlgorithmContract = _votingAlgorithmContract;

        // The creator of the sidechain is always an unmasked participant. Anyone who analysed the
        // transaction history would be able determine this account as the one which instigated the
        // transaction.
        sidechains[_sidechainId].unmasked.push(msg.sender);
        sidechains[_sidechainId].inUnmasked[msg.sender] = true;
    }



    function unmask(uint256 _sidechainId, uint256 _index, uint256 _salt) external {
        bytes32 maskedParticipantActual = sidechains[_sidechainId].masked[_index];
        bytes32 maskedParticipantCalculated = keccak256(msg.sender, _salt);
        // An account can only unmask itself.
        require(maskedParticipantActual == maskedParticipantCalculated);
        emit AddingSidechainUnmaskedParticipant(_sidechainId, msg.sender);
        sidechains[_sidechainId].unmasked.push(msg.sender);
        sidechains[_sidechainId].inUnmasked[msg.sender] = true;
        delete sidechains[_sidechainId].masked[_index];
        delete sidechains[_sidechainId].inMasked[maskedParticipantActual];
    }


    function proposeVote(uint256 _sidechainId, bytes32 _participant, uint16 _action, uint256 _additionalInfo) external onlySidechainParticipant(_sidechainId) {
        // This will throw an error if the action is not a valid VoteType.
        VoteType action = VoteType(_action);

        // Can't start a vote if a vote is already underway.
        require(sidechains[_sidechainId].votes[_participant].voteType == VoteType.VOTE_NONE);

        // If the action is to add a masked participant, then they shouldn't be a participant already.
        if (action == VoteType.VOTE_ADD_MASKED_PARTICIPANT) {
            require(sidechains[_sidechainId].inMasked[_participant] == false);
        }
        // If the action is to remove a masked participant, then they should be a participant already.
        if (action == VoteType.VOTE_REMOVE_MASKED_PARTICIPANT) {
            require(sidechains[_sidechainId].inMasked[_participant] == true);
        }
        // If the action is to add an unmasked participant, then they shouldn't be a participant already.
        if (action == VoteType.VOTE_ADD_UNMASKED_PARTICIPANT) {
            require(sidechains[_sidechainId].inUnmasked[address(_participant)] == false);
        }
        // If the action is to remove an unmasked participant, then they should be a participant already.
        if (action == VoteType.VOTE_REMOVE_UNMASKED_PARTICIPANT) {
            require(sidechains[_sidechainId].inUnmasked[address(_participant)] == true);
        }
        // For non-participant related votes, the participant must be zero.
        if (action == VoteType.VOTE_CHANGE_VOTING_ALG || action == VoteType.VOTE_CHANGE_VOTING_PERIOD) {
            require(_participant == VOTE_PARTICIPANT_NONE);
        }



        // The vote proposer is recorded as the entity which submitted this transaction.
        sidechains[_sidechainId].votes[_participant] = Votes(
            action,
            block.number + sidechains[_sidechainId].votingPeriod,
            sidechains[_sidechainId].votingAlgorithmContract,
            new address[](0),
            new bool[](0),
            _additionalInfo
            // Note: maps don't need to be initialised.
        );
    }


    // Documented in interface.
    function vote(uint256 _sidechainId, bytes32 _participant, uint16 _action, bool _voteFor) external onlySidechainParticipant(_sidechainId) {
        // This will throw an error if the action is not a valid VoteType.
        VoteType action = VoteType(_action);

        // The type of vote must match what is currently being voted on.
        // Note that this will catch the case when someone is voting when there is no active vote.
        require(sidechains[_sidechainId].votes[_participant].voteType == action);
        // Ensure the account has not voted yet.
        require(sidechains[_sidechainId].votes[_participant].hasVoted[msg.sender] == false);

        // TODO check voting period has not expired.

        // Indicate msg.sender has voted.
        sidechains[_sidechainId].votes[_participant].addressVoted.push(msg.sender);
        sidechains[_sidechainId].votes[_participant].addressVotedFor.push(_voteFor);
        sidechains[_sidechainId].votes[_participant].hasVoted[msg.sender] = true;
    }


    // Documented in interface.
    function actionVotes(uint256 _sidechainId, bytes32 _participant) external onlySidechainParticipant(_sidechainId) {
        // If no vote is underway, then there is nothing to action.
        VoteType action = sidechains[_sidechainId].votes[_participant].voteType;
        require(action != VoteType.VOTE_NONE);
        // Can only action vote after voting period has ended.
        require(sidechains[_sidechainId].votes[_participant].endOfVotingBlockNumber > block.number);

        VotingAlgInterface voteAlg = VotingAlgInterface(sidechains[_sidechainId].votes[_participant].votingAlgorithmContract);
//TODO        bool result = voteAlg.assess(sidechains[_sidechainId].votes[_participant].addressVoted, sidechains[_sidechainId].votes[_participant].addressVotedFor);

//        emit VoteResult(_sidechainId, _participant, uint16(action), result);

//        if (result) {
//            // The vote has been voted up.
//            if (action == VoteType.VOTE_ADD_MASKED_PARTICIPANT) {
//                sidechains[_sidechainId].masked.push(_participant);
//                sidechains[_sidechainId].inMasked[_participant] = true;
//            }
// TODO process other types of votes.





       // }


        // The vote is over. Now delete the voting arrays and indicate there is no vote underway.
        // Remove all values from the map: Maps can't be deleted in Solidity.
        for (uint i = 0; i < sidechains[_sidechainId].votes[_participant].addressVoted.length; i++) {
            delete sidechains[_sidechainId].votes[_participant].hasVoted[msg.sender];
        }
        // This will recursively delete everything in the structure, except for the map, which was
        // deleted in the for loop above.
        delete sidechains[_sidechainId].votes[_participant];
    }

    // TODO How to determine active items being voted on.
    // TODO How to determine how vote is progressing.



    // Documented in interface.
    function addPin(bytes32 _pinKey, bytes32 _pin) external {
        // Can not add a pin if there is one already.
        require(pinningMap[_pinKey].pin == EMPTY_PIN);

        pinningMap[_pinKey] = Pins(
            _pin, block.number, new address[](0)
        );
    }


    // Documented in interface.
    function getPin(bytes32 _pinKey) external view returns (bytes32) {
        return pinningMap[_pinKey].pin;
    }


    // Documented in interface.
    function contestPin(uint256 _sidechainId, bytes32 _previousPinKey, bytes32 _pinKey, uint256 _drbgValue) external onlySidechainParticipant(_sidechainId) {
        // The current pin key must have a pin entry.
        require(pinningMap[_pinKey].pin != EMPTY_PIN);
        // The current pin key must still be able to be contested.
        require(pinningMap[_pinKey].blocknumber > block.number);


        bytes32 prevPin = pinningMap[_previousPinKey].pin;
        // The previous pin key must have a pin entry.
        require(prevPin != EMPTY_PIN);

        // Check that the calculation is correct, proving the transaction sender knows the
        // DRBG value, and hence should be a member of the sidechain.
        bytes32 calculatedPinKey = keccak256(_sidechainId, prevPin, _drbgValue);
        require(calculatedPinKey == _pinKey);

        // Don't allow anyone to vote twice!
        require(pinningMap[_pinKey].hasVotedToRejectPin[msg.sender] == false);

        // msg sender has voted to reject the pin.
        pinningMap[_pinKey].votedToRejectPin.push(msg.sender);
    }




    // Documented in interface.
/*    function contestPinRequestVote(bytes32 _sidechainId, bytes32 _pinKey) external onlySidechainParticipant(_sidechainId) {
        // The current pin key must have a pin entry.
        require(pinningMap[_pinKey].pin != EMPTY_PIN);
        // The current pin key must still be able to be contested.
        require(pinningMap[_pinKey].blocknumber > block.number);

        // TODO Pass the votes, and the number of unmasked participants who could have voted, to a voting contract

    }
*/


    function getSidechainExists(uint256 _sidechainId) external view returns (bool) {
        return sidechains[_sidechainId].votingPeriod != 0;
    }


    function getVotingPeriod(uint256 _sidechainId) external view returns (uint64) {
        return sidechains[_sidechainId].votingPeriod;
    }


    function isSidechainParticipant(uint256 _sidechainId, address _participant) external view returns(bool) {
        return sidechains[_sidechainId].inUnmasked[_participant];
    }


    function getNumberUnmaskedSidechainParticipants(uint256 _sidechainId) external view returns(uint256) {
        return sidechains[_sidechainId].unmasked.length;
    }


    function getUnmaskedSidechainParticipant(uint256 _sidechainId, uint256 _index) external view returns(address) {
        return sidechains[_sidechainId].unmasked[_index];
    }


    function getNumberMaskedSidechainParticipants(uint256 _sidechainId) external view returns(uint256) {
        return sidechains[_sidechainId].masked.length;
    }


    function getMaskedSidechainParticipant(uint256 _sidechainId, uint256 _index) external view returns(bytes32) {
        return sidechains[_sidechainId].masked[_index];
    }



}