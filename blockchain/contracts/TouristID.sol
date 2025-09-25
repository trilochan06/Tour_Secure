// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title TouristID (Soulbound) — non-transferable Digital Tourist ID
/// @notice On-chain stores only: validity, status, kycHash (bytes32). All PII stays off-chain.
contract TouristID is ERC721, ERC721URIStorage, AccessControl, Pausable {
    // Roles
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant REVOKER_ROLE = keccak256("REVOKER_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    bytes32 public constant PAUSER_ROLE  = keccak256("PAUSER_ROLE");

    error TransferDisabled();

    struct Info {
        bytes32 kycHash;       // keccak256 hash of KYC bundle (off-chain)
        uint64  validUntil;    // unix seconds
        bool    active;        // revoked/expired -> inactive
        bool    emergencyFlag; // set by authority upon SOS / missing case
    }

    uint256 private _nextId;
    mapping(uint256 => Info) private _info;

    event TouristIssued(uint256 indexed tokenId, address indexed to, uint64 validUntil, bytes32 kycHash, string uri);
    event TouristRevoked(uint256 indexed tokenId);
    event TouristURIUpdated(uint256 indexed tokenId, string newURI);
    event EmergencyFlagUpdated(uint256 indexed tokenId, bool flagged);

    constructor(address admin) ERC721("TouristID", "TSID") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, admin);
        _grantRole(REVOKER_ROLE, admin);
        _grantRole(UPDATER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    // -------- Core lifecycle --------
    function issue(
        address to,
        string memory uri,
        bytes32 kycHash,
        uint64 validUntil
    ) external onlyRole(ISSUER_ROLE) whenNotPaused returns (uint256 tokenId) {
        require(to != address(0), "to=0");
        require(validUntil > block.timestamp, "expiry in past");
        tokenId = ++_nextId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _info[tokenId] = Info({kycHash: kycHash, validUntil: validUntil, active: true, emergencyFlag: false});
        emit TouristIssued(tokenId, to, validUntil, kycHash, uri);
    }

    function revoke(uint256 tokenId) external onlyRole(REVOKER_ROLE) whenNotPaused {
        _requireOwned(tokenId);
        _info[tokenId].active = false;
        emit TouristRevoked(tokenId);
    }

    function updateURI(uint256 tokenId, string memory newURI) external onlyRole(UPDATER_ROLE) whenNotPaused {
        _requireOwned(tokenId);
        _setTokenURI(tokenId, newURI);
        emit TouristURIUpdated(tokenId, newURI);
    }

    function setEmergencyFlag(uint256 tokenId, bool flagged) external onlyRole(UPDATER_ROLE) whenNotPaused {
        _requireOwned(tokenId);
        _info[tokenId].emergencyFlag = flagged;
        emit EmergencyFlagUpdated(tokenId, flagged);
    }

    /// Optional: allow admin to burn and remove stored info
    function adminBurn(uint256 tokenId) external onlyRole(REVOKER_ROLE) whenNotPaused {
        _requireOwned(tokenId);
        delete _info[tokenId];
        _burn(tokenId);
    }

    // -------- Views --------
    function info(uint256 tokenId) external view returns (Info memory) {
        _requireOwned(tokenId);
        return _info[tokenId];
    }

    function isValid(uint256 tokenId) public view returns (bool) {
        _requireOwned(tokenId);
        Info memory i = _info[tokenId];
        return i.active && block.timestamp <= i.validUntil;
    }

    // -------- Admin controls --------
    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    // -------- Soulbound enforcement --------
    // Don't override public approve/transfer functions in OZ v5 (they're not virtual).
    // Block any movement by rejecting in the internal transfer hook.
    function _update(address to, uint256 tokenId, address auth)
        internal
        virtual
        override(ERC721)
        returns (address)
    {
        address from = super._update(to, tokenId, auth);
        // Allow only mints (from=0) and burns (to=0). Any other movement is a transfer -> disabled
        if (from != address(0) && to != address(0)) revert TransferDisabled();
        return from;
    }

    // -------- ERC721 / URIStorage glue --------
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, AccessControl, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
