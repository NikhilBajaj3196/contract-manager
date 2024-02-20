const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

const zero_address = "0x0000000000000000000000000000000000000000";

describe("ContractManager", () => {

    const description = "this is a mock contract";
    let contractManager;
    let mockContract1;
    let mockContract2;
    let user1;
    let user2;
    let deployer;

    async function deployContractManager() {
        const [deployer, user1, user2] = await ethers.getSigners();

        const contractManagerFactory = await ethers.getContractFactory("ContractManager");
        const contractManager = await contractManagerFactory.deploy(deployer.address);

        const mockContractFactory = await ethers.getContractFactory("MockContract");
        const mockContract1 = await mockContractFactory.deploy();
        const mockContract2 = await mockContractFactory.deploy();

        return { contractManager, mockContract1, mockContract2, deployer, user1, user2 };
    }

    beforeEach(async () => {
        ({ contractManager, mockContract1, mockContract2, deployer, user1, user2 } = await loadFixture(deployContractManager));
    });

    describe("addContract", () => {
        it("should revert when called by unauthorized account", async () => {
            const tx = contractManager.connect(user1).addContract(await mockContract1.getAddress(), description);
            await expect(tx).to.be.revertedWithCustomError(contractManager, "AccessControlUnauthorizedAccount");
        });

        it("should revert when zero address is passed", async () => {
            const tx = contractManager.addContract(zero_address, description);
            await expect(tx).to.be.revertedWithCustomError(contractManager, "ZeroAddressNotAllowed");
        });

        it("should revert when adding a non contract address", async () => {
            const tx = contractManager.addContract(user2.address, "this is a fake contract");
            await expect(tx).to.be.revertedWithCustomError(contractManager, "NonContractAddress");
        });

        it("should revert when adding a already existing contract", async () => {
            await contractManager.addContract(await mockContract1.getAddress(), "this is a fake contract");

            const tx = contractManager.addContract(await mockContract1.getAddress(), "this is a fake contract");
            await expect(tx).to.be.revertedWithCustomError(contractManager, "ContractAlreadyExists");
        });

        it("should emit event on success", async () => {
            const tx = await contractManager.addContract(await mockContract1.getAddress(), description);

            await expect(tx).to.emit(contractManager, "ContractAdded").withArgs(await mockContract1.getAddress(), description, true);
            const details = await contractManager.contractDetails(await mockContract1.getAddress());
            expect(details.description).to.equal(description);
            expect(details.exists).to.equal(true);
        });
    });

    describe("updateContractDescription", () => {
        it("should revert when called by unauthorized account", async () => {
            const tx = contractManager.connect(user1).updateContractDescription(await mockContract1.getAddress(), description);
            await expect(tx).to.be.revertedWithCustomError(contractManager, "AccessControlUnauthorizedAccount");
        });

        it("should revert when contract does not exist", async () => {
            const tx = contractManager.updateContractDescription(await mockContract1.getAddress(), description);
            await expect(tx).to.be.revertedWithCustomError(contractManager, "ContractDoesNotExist");
        });

        it("should emit event on success", async () => {
            await contractManager.addContract(await mockContract1.getAddress(), description);
            const updatedDescription = "this is the updated mock contract";

            const tx = await contractManager.updateContractDescription(await mockContract1.getAddress(), updatedDescription);
            await expect(tx).to.emit(contractManager, "ContractDescriptionUpdated").withArgs(await mockContract1.getAddress(), description, updatedDescription);
        });
    });

    describe("removeContract", () => {
        it("should revert when called by unauthorized account", async () => {
            const tx = contractManager.connect(user1).removeContract(await mockContract1.getAddress());
            await expect(tx).to.be.revertedWithCustomError(contractManager, "AccessControlUnauthorizedAccount");
        });

        it("should revert when contract does not exist", async () => {
            const tx = contractManager.removeContract(await mockContract1.getAddress());
            await expect(tx).to.be.revertedWithCustomError(contractManager, "ContractDoesNotExist");
        });

        it("should emit event on success", async () => {
            await contractManager.addContract(await mockContract1.getAddress(), description);

            const tx = contractManager.removeContract(await mockContract1.getAddress());
            await expect(tx).to.emit(contractManager, "ContractRemoved").withArgs(await mockContract1.getAddress(), false);

            const details = await contractManager.contractDetails(await mockContract1.getAddress());
            expect(details.description).to.equal("");
            expect(details.exists).to.equal(false);
        });
    });

    describe("addContractManagerRole", () => {
        it("should revert when called by unauthorized account", async () => {
            const tx = contractManager.connect(user1).addContractManagerRole(user2.address);
            await expect(tx).to.be.revertedWithCustomError(contractManager, "AccessControlUnauthorizedAccount");
        });

        it("should be able to grant role to other users", async () => {
            await expect(contractManager.connect(user2).addContract(await mockContract1.getAddress(), description)).to.be.reverted;

            // deployer having default admin role is granting contract manager role to multiple users
            await contractManager.addContractManagerRole(user1.address);
            await contractManager.addContractManagerRole(user2.address);

            // user1 and user2 should be now able to call the privileged functions
            await contractManager.connect(user1).addContract(await mockContract1.getAddress(), description);
            await contractManager.connect(user2).removeContract(await mockContract1.getAddress());
        });
    });
});