var Migrations = artifacts.require("./Migrations.sol");
var Pinning = artifacts.require("./SidechainAnonPinningV1.sol");
var VotingAlgMajority = artifacts.require("./VotingAlgMajority.sol");
var VotingAlgMajorityWhoVoted = artifacts.require("./VotingAlgMajorityWhoVoted.sol");



module.exports = function(deployer) {
    deployer.deploy(Migrations);

    deployer.deploy(VotingAlgMajority);
    deployer.deploy(VotingAlgMajorityWhoVoted).then(() => {
        return deployer.deploy(Pinning, 1, VotingAlgMajority.address);
    });
};
