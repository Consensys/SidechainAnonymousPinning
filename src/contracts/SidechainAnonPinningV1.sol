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
    uint256 public constant MANAGEMENT_PSEUDO_SIDECHAIN_ID = 0;


    // Indications that a vote is underway.
    // VOTE_NONE indicates no vote is underway. Also matches the deleted value for integers.
    enum VoteType {
        VOTE_NONE,                          // 0: MUST be the first value so it is the zero / deleted value.
        VOTE_ADD_MASKED_PARTICIPANT,        // 1
        VOTE_REMOVE_MASKED_PARTICIPANT,     // 2
        VOTE_ADD_UNMASKED_PARTICIPANT,      // 3
        VOTE_REMOVE_UNMASKED_PARTICIPANT,   // 4
        VOTE_CONTEST_PIN                    // 5
    }

    struct Votes {
        // The type of vote being voted on.
        VoteType voteType;
        // The block number when voting will cease.
        uint endOfVotingBlockNumber;
        // TODO
        uint256 additionalInfo1;
        uint256 additionalInfo2;

        // Have map as well as array to ensure constant time / constant cost look-up,
        // independent of number of participants.
        mapping(address=>bool) hasVoted;
        // The number of participants who voted for the proposal.
        uint64 numVotedFor;
        // The number of participants who voted against the proposal.
        uint64 numVotedAgainst;
    }

    struct SidechainRecord {
        // The algorithm for assessing the votes.
        address votingAlgorithmContract;
        // Voting period in blocks. This is the period in which participants can vote. Must be greater than 0.
        uint64 votingPeriod;

        // The number of unmasked participants.
        // Note that this value could be less than the size of the unmasked array as some of the participants
        // may have been removed.
        uint64 numUnmaskedParticipants;
        // Array of participants who can vote.
        // Note that this array could contain empty values, indicating that the participant has been removed.
        address[] unmasked;
        // Have map as well as array to ensure constant time / constant cost look-up, independent of number of participants.
        mapping(address=>bool) inUnmasked;

        // Array of masked participant. These participants can not vote.
        // Note that this array could contain empty values, indicating that the masked participant has been removed
        // or has been unmasked.
        uint256[] masked;
        // Have map as well as array to ensure constant time / constant cost look-up, independent of number of participants.
        mapping(uint256=>bool) inMasked;

        // Votes for adding and removing participants, for changing voting algorithm and voting period.
        mapping(uint256=>Votes) votes;
    }

    mapping(uint256=>SidechainRecord) private sidechains;


    bytes32 private constant EMPTY_PIN = 0x00;

    struct Pins {
        // The block hash which is being pinned.
        bytes32 pin;
        // The block number after which the pin can not be challenged.
        uint256 contextBlockNumber;
    }
    mapping(uint256=>Pins) private pinningMap;




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

    constructor (address _votingAlg, uint32 _votingPeriod) public {
        addSidechainInternal(MANAGEMENT_PSEUDO_SIDECHAIN_ID, _votingAlg, _votingPeriod);
    }


    function addSidechain(uint256 _sidechainId, address _votingAlgorithmContract, uint64 _votingPeriod) external onlySidechainParticipant(MANAGEMENT_PSEUDO_SIDECHAIN_ID) {
        addSidechainInternal(_sidechainId, _votingAlgorithmContract, _votingPeriod);
    }

    function addSidechainInternal(uint256 _sidechainId, address _votingAlgorithmContract, uint64 _votingPeriod) private {
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
        sidechains[_sidechainId].numUnmaskedParticipants++;
    }


    function unmask(uint256 _sidechainId, uint256 _index, uint256 _salt) external {
        uint256 maskedParticipantActual = sidechains[_sidechainId].masked[_index];
        uint256 maskedParticipantCalculated = uint256(keccak256(msg.sender, _salt));
        // An account can only unmask itself.
        require(maskedParticipantActual == maskedParticipantCalculated);
        emit AddingSidechainUnmaskedParticipant(_sidechainId, msg.sender);
        sidechains[_sidechainId].unmasked.push(msg.sender);
        sidechains[_sidechainId].inUnmasked[msg.sender] = true;

        delete sidechains[_sidechainId].masked[_index];
        delete sidechains[_sidechainId].inMasked[maskedParticipantActual];
    }


    function proposeVote(uint256 _sidechainId, uint16 _action, uint256 _voteTarget, uint256 _additionalInfo1, uint256 _additionalInfo2) external onlySidechainParticipant(_sidechainId) {
        // This will throw an error if the action is not a valid VoteType.
        VoteType action = VoteType(_action);

        // Can't start a vote if a vote is already underway.
        require(sidechains[_sidechainId].votes[_voteTarget].voteType == VoteType.VOTE_NONE);

        // If the action is to add a masked participant, then they shouldn't be a participant already.
        if (action == VoteType.VOTE_ADD_MASKED_PARTICIPANT) {
            require(sidechains[_sidechainId].inMasked[_voteTarget] == false);
        }
        // If the action is to remove a masked participant, then they should be a participant already.
        // Additionally, they must supply the offset into the masked array of the participant to be removed.
        if (action == VoteType.VOTE_REMOVE_MASKED_PARTICIPANT) {
            require(sidechains[_sidechainId].inMasked[_voteTarget] == true);
            require(sidechains[_sidechainId].masked[_additionalInfo1] == _voteTarget);
        }
        // If the action is to add an unmasked participant, then they shouldn't be a participant already.
        if (action == VoteType.VOTE_ADD_UNMASKED_PARTICIPANT) {
            require(sidechains[_sidechainId].inUnmasked[address(_voteTarget)] == false);
        }
        // If the action is to remove an unmasked participant, then they should be a participant
        // already and they can not be the sender. That is, the sender can not vote to remove
        // themselves.
        // Additionally, they must supply the offset into the unmasked array of the participant to be removed.
        if (action == VoteType.VOTE_REMOVE_UNMASKED_PARTICIPANT) {
            address voteTargetAddr = address(_voteTarget);
            require(sidechains[_sidechainId].inUnmasked[voteTargetAddr] == true);
            require(voteTargetAddr != msg.sender);
            require(sidechains[_sidechainId].unmasked[_additionalInfo1] == voteTargetAddr);
        }

        if (action == VoteType.VOTE_CONTEST_PIN) {
            uint256 pinKey = _voteTarget;
            uint256 previousPinKey = _additionalInfo1;
            uint256 prfValue = _additionalInfo2;

            // The current pin key must have a pin entry.
            require(pinningMap[pinKey].pin != EMPTY_PIN);
            // The current pin key must still be able to be contested.
            require(pinningMap[pinKey].contextBlockNumber > block.number);


            bytes32 prevPin = pinningMap[previousPinKey].pin;
            // The previous pin key must have a pin entry.
            require(prevPin != EMPTY_PIN);

            // Check that the calculation is correct, proving the transaction sender knows the
            // PRF value, and hence should be a member of the sidechain.
            uint256 calculatedPinKey = uint256(keccak256(_sidechainId, prevPin, prfValue));
            require(calculatedPinKey == pinKey);
    }


        // Set-up the vote.
        sidechains[_sidechainId].votes[_voteTarget].voteType = action;
        sidechains[_sidechainId].votes[_voteTarget].endOfVotingBlockNumber = block.number + sidechains[_sidechainId].votingPeriod;
        sidechains[_sidechainId].votes[_voteTarget].additionalInfo1 = _additionalInfo1;
        sidechains[_sidechainId].votes[_voteTarget].additionalInfo2 = _additionalInfo2;

        // The proposer is deemed to be voting for the proposal.
        voteNoChecks(_sidechainId, _action, _voteTarget, true);
    }


    function vote(uint256 _sidechainId, uint16 _action, uint256 _voteTarget, bool _voteFor) external onlySidechainParticipant(_sidechainId) {
        // This will throw an error if the action is not a valid VoteType.
        VoteType action = VoteType(_action);

        // The type of vote must match what is currently being voted on.
        // Note that this will catch the case when someone is voting when there is no active vote.
        require(sidechains[_sidechainId].votes[_voteTarget].voteType == action);
        // Ensure the account has not voted yet.
        require(sidechains[_sidechainId].votes[_voteTarget].hasVoted[msg.sender] == false);

        // Check voting period has not expired.
        require(sidechains[_sidechainId].votes[_voteTarget].endOfVotingBlockNumber >= block.number);

        voteNoChecks(_sidechainId, _action, _voteTarget, _voteFor);
    }


    // Documented in interface.
    function actionVotes(uint256 _sidechainId, uint256 _voteTarget) external onlySidechainParticipant(_sidechainId) {
        // If no vote is underway, then there is nothing to action.
        VoteType action = sidechains[_sidechainId].votes[_voteTarget].voteType;
        require(action != VoteType.VOTE_NONE);
        // Can only action vote after voting period has ended.
        require(sidechains[_sidechainId].votes[_voteTarget].endOfVotingBlockNumber < block.number);

//        emit Dump(sidechains[_sidechainId].numUnmaskedParticipants, sidechains[_sidechainId].votes[_voteTarget].numVotedFor,
//            sidechains[_sidechainId].votes[_voteTarget].numVotedAgainst
//        );


        VotingAlgInterface voteAlg = VotingAlgInterface(sidechains[_sidechainId].votingAlgorithmContract);
        bool result = voteAlg.assess(
                sidechains[_sidechainId].numUnmaskedParticipants,
                sidechains[_sidechainId].votes[_voteTarget].numVotedFor,
                sidechains[_sidechainId].votes[_voteTarget].numVotedAgainst);
        emit VoteResult(_sidechainId, uint16(action), _voteTarget, result);

        if (result) {
            // The vote has been decided in the affimative.
            uint256 additionalInfo1 = sidechains[_sidechainId].votes[_voteTarget].additionalInfo1;
//            emit Dump(additionalInfo1, 0, 33);
            address participantAddr = address(_voteTarget);
            if (action == VoteType.VOTE_ADD_UNMASKED_PARTICIPANT) {
                sidechains[_sidechainId].unmasked.push(participantAddr);
                sidechains[_sidechainId].inUnmasked[participantAddr] = true;
                sidechains[_sidechainId].numUnmaskedParticipants++;
            }
            else if (action == VoteType.VOTE_ADD_MASKED_PARTICIPANT) {
                sidechains[_sidechainId].masked.push(_voteTarget);
                sidechains[_sidechainId].inMasked[_voteTarget] = true;
            }
            else if (action == VoteType.VOTE_REMOVE_UNMASKED_PARTICIPANT) {
                delete sidechains[_sidechainId].unmasked[additionalInfo1];
                delete sidechains[_sidechainId].inUnmasked[participantAddr];
                sidechains[_sidechainId].numUnmaskedParticipants--;
            }
            else if (action == VoteType.VOTE_REMOVE_MASKED_PARTICIPANT) {
                delete sidechains[_sidechainId].masked[additionalInfo1];
                delete sidechains[_sidechainId].inMasked[_voteTarget];
            }
            else if (action == VoteType.VOTE_CONTEST_PIN) {
                uint256 pinKey = _voteTarget;
                delete pinningMap[pinKey].pin;
                delete pinningMap[pinKey].contextBlockNumber;
            }
        }


        // The vote is over. Now delete the voting arrays and indicate there is no vote underway.
        // Remove all values from the map: Maps can't be deleted in Solidity.
//        for (uint i = 0; i < sidechains[_sidechainId].votes[_participant].addressVoted.length; i++) {
//            delete sidechains[_sidechainId].votes[_participant].hasVoted[msg.sender];
//        }
        // This will recursively delete everything in the structure, except for the map, which was
        // deleted in the for loop above.
        delete sidechains[_sidechainId].votes[_voteTarget];
    }


    // Documented in interface.
    function addPin(uint256 _pinKey, bytes32 _pin) external {
        // Can not add a pin if there is one already.
        require(pinningMap[_pinKey].pin == EMPTY_PIN);

        pinningMap[_pinKey] = Pins(
            _pin, block.number  + 5     //TODO The block contest time should be voted on.
        );
    }


    // Documented in interface.
    function getPin(uint256 _pinKey) external view returns (bytes32) {
        return pinningMap[_pinKey].pin;
    }







    /**
    * This function is used to indicate that an entity has voted. It has been created so that
    * calls to proposeVote do not have to incur all of the value checking in the vote call.
    *
    * TODO: Compare gas usage of keeping this integrated with the value checking.
    */
    function voteNoChecks(uint256 _sidechainId, uint16 _action, uint256 _voteTarget, bool _voteFor) private {
        // Indicate msg.sender has voted.
        emit ParticipantVoted(_sidechainId, msg.sender, _action, _voteTarget, _voteFor);
        sidechains[_sidechainId].votes[_voteTarget].hasVoted[msg.sender] = true;

        if (_voteFor) {
            sidechains[_sidechainId].votes[_voteTarget].numVotedFor++;
        } else {
            sidechains[_sidechainId].votes[_voteTarget].numVotedAgainst++;
        }
    }



    function getSidechainExists(uint256 _sidechainId) external view returns (bool) {
        return sidechains[_sidechainId].votingPeriod != 0;
    }


    function getVotingPeriod(uint256 _sidechainId) external view returns (uint64) {
        return sidechains[_sidechainId].votingPeriod;
    }


    function isSidechainParticipant(uint256 _sidechainId, address _participant) external view returns(bool) {
        return sidechains[_sidechainId].inUnmasked[_participant];
    }


    function getUnmaskedSidechainParticipantsSize(uint256 _sidechainId) external view returns(uint256) {
        return sidechains[_sidechainId].unmasked.length;
    }


    function getUnmaskedSidechainParticipant(uint256 _sidechainId, uint256 _index) external view returns(address) {
        return sidechains[_sidechainId].unmasked[_index];
    }


    function getMaskedSidechainParticipantsSize(uint256 _sidechainId) external view returns(uint256) {
        return sidechains[_sidechainId].masked.length;
    }


    function getMaskedSidechainParticipant(uint256 _sidechainId, uint256 _index) external view returns(uint256) {
        return sidechains[_sidechainId].masked[_index];
    }



}