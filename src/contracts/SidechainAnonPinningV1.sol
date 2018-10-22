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
contract SidechainManagement is SidechainManagementInterface is Ownable{

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
    }

    struct SidechainRecord {
        // Voting period in blocks. This is the period in which participants can vote. Must be greater than 0.
        uint32 public votingPeriod;

        // Voting viewing period in blocks. This is the period between when the voting has completed and when
        // the vote can be actioned. Once the vote is actioned, all information about who voted and how they voted
        // is removed from the ledger.
        uint32 public voteViewingPeriod;

        // The algorithm for assessing the votes.
        address public votingAlgorithmContract;


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

    mapping(bytes32=>SidechainRecord) private sidechains;


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
    modifier onlySidechainParticipant(bytes32 _sidechainId) {
        require(sidechains[_sidechainId].inUnmasked[msg.sender]);
        _;
    }



    // Documented in interface.
    function addSidechain(bytes32 _sidechainId, uint64 _votingPeriod, address _votingAlgorithmContract) public onlyOwner {
        // The sidechain can not exist prior to creation.
        require(sidechains[_sidechainId].votingPeriod != 0);
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


    // Documented in interface.
    function getSidechainExists(bytes32 _sidechainId) public view returns (bool) {
        return sidechains[_sidechainId].votingPeriod != 0;
    }


    // Documented in interface.
    function getVotingPeriod(bytes32 _sidechainId) public view returns (uint) {
        return sidechains[_sidechainId].votingPeriod;
    }


    // Documented in interface.
    function isSidechainParticipant(bytes32 _sidechainId, address _participant) public view returns(bool) {
        return sidechains[_sidechainId].inUnmasked[_participant];
    }


    // Documented in interface.
    function getNumberUnmaskedSidechainParticipants(bytes32 _sidechainId) public view returns(uint) {
        return sidechains[_sidechainId].unmasked.length;
    }


    // Documented in interface.
    function getUnmaskedSidechainParticipant(bytes32 _sidechainId, uint256 _index) public view returns(address) {
        return sidechains[_sidechainId].unmasked[_index];
    }


    // Documented in interface.
    function getNumberMaskedSidechainParticipants(bytes32 _sidechainId) public view returns(uint) {
        return sidechains[_sidechainId].masked.length;
    }


    // Documented in interface.
    function getMaskedSidechainParticipant(bytes32 _sidechainId, uint256 _index) public view returns(bytes32) {
        return sidechains[_sidechainId].masked[_index];
    }


    // Documented in interface.
    function unmask(bytes32 _sidechainId, uint256 _index, bytes32 _salt) public {
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


    // Documented in interface.
    function proposeVote(bytes32 _sidechainId, bytes32 _participant, uint16 _action) public onlySidechainParticipant(_sidechainId) {
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
            new bool[](0)
            // Note: maps don't need to be initialised.
        );
    }


    // Documented in interface.
    function vote(bytes32 _sidechainId, bytes32 _participant, uint16 _action, bool _voteFor) public onlySidechainParticipant(_sidechainId) {
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
    function actionVotes(bytes32 _sidechainId, bytes32 _participant) public onlySidechainParticipant(_sidechainId) {
        // If no vote is underway, then there is nothing to action.
        VoteType action = sidechains[_sidechainId].votes[_participant].voteType;
        require(action != VoteType.VOTE_NONE);
        // Can only action vote after voting period has ended.
        require(sidechains[_sidechainId].votes[_participant].endOfVotingBlockNumber > block.number);

        AbstractVotingAlg voteAlg = AbstractVotingAlg(sidechains[_sidechainId].votes[_participant].votingAlgorithmContract);
        bool result = voteAlg.assess(sidechains[_sidechainId].votes[_participant].addressVoted, sidechains[_sidechainId].votes[_participant].addressVotedFor);

        emit VoteResult(_sidechainId, _participant, uint16(action), result);

        if (result) {
            // The vote has been voted up.
            if (action == VoteType.VOTE_ADD_MASKED_PARTICIPANT) {
                sidechains[_sidechainId].masked.push(_participant);
                sidechains[_sidechainId].inMasked[_participant] = true;
            }
// TODO process other types of votes.





        }


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
    function addPin(bytes32 _pinKey, bytes32 _pin) public {
        // Can not add a pin if there is one already.
        require(pinningMap[_pinKey].pin == EMPTY_PIN);

        pinningMap[_pinKey] = Pins(
            _pin, block.number, new address[](0)
        );
    }


    // Documented in interface.
    function getPin(bytes32 _pinKey) public view returns (bytes32) {
        return pinningMap[_pinKey].pin;
    }


    // Documented in interface.
    function contestPin(bytes32 _sidechainId, bytes32 _previousPinKey, bytes32 _pinKey, bytes32 _drbgValue) public onlySidechainParticipant(_sidechainId) {
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
    function contestPin(bytes32 _sidechainId, bytes32 _pinKey) public onlySidechainParticipant(_sidechainId) {
        // The current pin key must have a pin entry.
        require(pinningMap[_pinKey].pin != EMPTY_PIN);
        // The current pin key must still be able to be contested.
        require(pinningMap[_pinKey].blocknumber > block.number);

        // To use this lighter weight API, at least one entity needs to have voted.
        require(pinningMap[_pinKey].votedToRejectPin.length != 0);

        // Don't allow anyone to vote twice!
        require(pinningMap[_pinKey].hasVotedToRejectPin[msg.sender] == false);

        // msg sender has voted to reject the pin.
        pinningMap[_pinKey].votedToRejectPin.push(msg.sender);
    }


    // Documented in interface.
    function contestPinRequestVote(bytes32 _sidechainId, bytes32 _pinKey) public onlySidechainParticipant(_sidechainId) {
        // The current pin key must have a pin entry.
        require(pinningMap[_pinKey].pin != EMPTY_PIN);
        // The current pin key must still be able to be contested.
        require(pinningMap[_pinKey].blocknumber > block.number);

        // TODO Pass the votes, and the number of unmasked participants who could have voted, to a voting contract

    }


    event AddedSidechain(bytes32 _sidechainId);
    event AddingSidechainMaskedParticipant(bytes32 _sidechainId, bytes32 _participant);
    event AddingSidechainUnmaskedParticipant(bytes32 _sidechainId, address _participant);

    event VoteResult(bytes32 _sidechainId, bytes32 _participant, uint16 _action, bool _result);
}