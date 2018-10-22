var Migrations = artifacts.require("./Migrations.sol");
var Pinning = artifacts.require("./SidechainAnonPinningV1.sol");



module.exports = function(deployer) {
    deployer.deploy(Migrations);
    deployer.deploy(Pinning);
};
