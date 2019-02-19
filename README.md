# Sidechain Anonymous and Pinning

## Introduction
This repo contains code to allow the state of a sidechain to be pinned to a management chain.
That is, the block hash of a sidechain is submitted to a contract on the management chain. 
Doing this means that collusion between sidechain participants to revert the state of the 
sidechain can be detected.


## Masked and Unmasked Participants
For each sidechain, there are masked and unmasked participants. Unmasked Participants have their
addresses listed as being members of a certain sidechain. Being unmasked allows the participant
to vote to add and remove other participants, change the voting period and algorithm, and contest
pins.

Masked Participants are participants which are listed against a sidechain. They are represented
as a salted hash of their address. The participant keeps the salt secret and keeps it off-chain.
If they need to unmask themselves, they present their secret salt. This is combined with their
sending address to create the salted hash. If this matches their masked participant value then
they become an unmasked participant.

## Voting

Voting works in the following way:
 * An Unmasked Participant of a sidechain can submit a proposal for a vote for a certain action
   (VOTE_ADD_UNMASKED_PARTICIPANT, VOTE_REMOVE_UNMASKED_PARTICIPANT,
   VOTE_ADD_MASKED_PARTICIPANT, VOTE_REMOVE_MASKED_PARTICIPANT,
   VOTE_CONTEST_PIN).
 * Any other Unmasked Participant can then vote on the proposal.
 * Once the voting period has expired, any Unmasked Participant can request the vote be actioned.
 
The voting algorithm and voting period is configurable and set on a per-sidechain basis. The 
pin contest period is set on contract deployment. The pin contest period must be greater
than the voting period to allow pins to be posted, a vote proposed, the  voted to close and
be actioned. The act of actioning the vote for contesting a pin will remove the pin.  

## Pinning
Pinning values are put into a map. All participants of a sidechain agree on a sidechain secret.
The sidechain secret seeds a Pseudo Random Function (PRF). A new 256 bit value is
generated each time an uncontested pin is posted. The key in the map is calculated using the
equation:

```
 PRF_Value = PRF.nextValue
 Key = keccak256(Sidechain Identifier, Previous Pin, PRF_Value).
```

 * For the initial key for a sidechain, the Previous Pin is 0x00.
 * The PRF algorithm needs to be agreed between participants. 

Masked and unmasked participants of a sidechain observe the pinning map at the Key value waiting
for the next pin to be posted to that entry in the map. When the pin value is posted, they can then
 determine if they wish to contest the pin. To contest the pin, they submit:

 * Previous Key (and hence the previous pin)
 * PRF_Value
 * Sidechain Id
 
 Given they know the valid PRF Value, they are able to contest the pin, because they must be a member of the
 sidechain. Given a good PRF algorithm, this will not expose future or previous PRF values, and hence will
 not reveal earlier or future pinning values, and hence won't reveal the transaction rate of the sidechain.
 
 Once a key is revealed as belonging to a specific sidechain, then Unmasked Participants can vote on
 whether to reject or keep the pin.
