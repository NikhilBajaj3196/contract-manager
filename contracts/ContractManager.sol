// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {AccessControlEnumerable} from "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";

contract ContractManager is AccessControlEnumerable {
    /**
     * @notice Thrown if the input address is a zero address where it is not allowed.
     */
    error ZeroAddressNotAllowed();

    /**
     * @notice Thrown if the input address is a non-contract address.
     */
    error NonContractAddress();

    /**
     * @notice Thrown if the contract address already exists in storage.
     */
    error ContractAlreadyExists();

    /**
     * @notice Thrown if the contract address does not exist in storage.
     */
    error ContractDoesNotExist();

    /**
     * @notice Event emitted when a contract address is added in storage.
     */
    event ContractAdded(
        address indexed contractAddress,
        string description,
        bool exists
    );

    /**
     * @notice Event emitted when the description of a contract address is updated.
     */
    event ContractDescriptionUpdated(
        address indexed contractAddress,
        string oldDescription,
        string updatedDescription
    );

    /**
     * @notice Event emitted when a contract address is removed from storage.
     */
    event ContractRemoved(address indexed contractAddress, bool exists);

    /**
     * @notice Role identifier for a contract manager.
     */
    bytes32 internal constant CONTRACT_MANAGER = keccak256("CONTRACT_MANAGER");

    /**
     * @notice Stores information for a contract.
     */
    struct ContractInfo {
        // Description of the contract
        string description;
        // Boolean indicating whether the contract exists
        bool exists;
    }

    /**
     * @notice Maps contract addresses to their respective ContractInfo.
     */
    mapping(address => ContractInfo) public contractDetails;

    /**
     * @dev Constructor function to initialize the contract.
     * @param contractManager The address for the contract manager role.
     */
    constructor(address contractManager) {
        // Grants the default admin role to the contract deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // Grants the CONTRACT_MANAGER role to the `contractManager` address
        _grantRole(CONTRACT_MANAGER, contractManager);
    }

    /**
     * @notice Adds a new contract address with its description.
     * @dev Used to add new contract, only callable by authorized accounts.
     * @param contractAddress The address of the contract to add.
     * @param description The description associated with the contract address.
     * @custom:error ZeroAddressNotAllowed is thrown if the contractAddress is zero address.
     * @custom:error NonContractAddress is thrown if the input address is non contract address.
     * @custom:error ContractAlreadyExists is thrown if the contractAddress already exists.
     * @custom:event ContractAdded emits on success.
     */
    function addContract(
        address contractAddress,
        string calldata description
    ) external {
        _checkRole(CONTRACT_MANAGER, msg.sender);

        ensureNonzeroAddress(contractAddress);
        enforceHasContractCode(contractAddress);

        if (contractDetails[contractAddress].exists) {
            revert ContractAlreadyExists();
        }

        contractDetails[contractAddress] = ContractInfo(description, true);
        emit ContractAdded(contractAddress, description, true);
    }

    /**
     * @notice Updates the description of an existing contract address.
     * @dev Used to update the description of an existing contract, only callable by authorized accounts.
     * @param contractAddress The address of the contract whose description is to be updated.
     * @param updatedDescription The updated description associated with the contract address.
     * @custom:error ContractDoesNotExist is thrown if the contractAddress does not exist.
     * @custom:event ContractDescriptionUpdated emits on success.
     */
    function updateContractDescription(
        address contractAddress,
        string calldata updatedDescription
    ) external {
        _checkRole(CONTRACT_MANAGER, msg.sender);

        if (!contractDetails[contractAddress].exists) {
            revert ContractDoesNotExist();
        }

        string memory oldDescription = contractDetails[contractAddress]
            .description;
        contractDetails[contractAddress].description = updatedDescription;

        emit ContractDescriptionUpdated(
            contractAddress,
            oldDescription,
            updatedDescription
        );
    }

    /**
     * @notice Removes an existing contract address and its description.
     * @dev Used to remove an existing contract from storage, only callable by authorized accounts.
     * @param contractAddress The address of the contract to remove.
     * @custom:error ContractDoesNotExist is thrown if the contract address does not exist.
     * @custom:event ContractRemoved emits on success.
     */
    function removeContract(address contractAddress) external {
        _checkRole(CONTRACT_MANAGER, msg.sender);

        if (!contractDetails[contractAddress].exists) {
            revert ContractDoesNotExist();
        }

        delete contractDetails[contractAddress];
        emit ContractRemoved(contractAddress, false);
    }

    /**
     * @notice Gives access to other accounts.
     * @dev Provides an contract manager role to specified account, only callable by default admin.
     * @param contractManager The account address to be added for a contract manager role.
     */
    function addContractManagerRole(address contractManager) external {
        _checkRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(CONTRACT_MANAGER, contractManager);
    }

    // ---------------------Private functions---------------------------- //

    /**
     * @dev Checks if the provided address is nonzero, reverts otherwise.
     * @param address_ The address to check.
     * @custom:error ZeroAddressNotAllowed is thrown if the provided address is a zero address.
     */
    function ensureNonzeroAddress(address address_) private pure {
        if (address_ == address(0)) {
            revert ZeroAddressNotAllowed();
        }
    }

    /**
     * @dev Ensure that the given address has contract code deployed.
     * @param contract_ The address to check for contract code.
     * @custom:error NonContractAddress is thrown if input address is non contract address.
     */
    function enforceHasContractCode(address contract_) private view {
        uint256 contractSize;
        assembly {
            contractSize := extcodesize(contract_)
        }
        if (contractSize == 0) {
            revert NonContractAddress();
        }
    }
}
