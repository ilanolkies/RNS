pragma solidity ^0.4.24;

import "./AbstractRNS.sol";
import "./ResolverInterface.sol";

/** 
    A resolver which extends the basic one to allow storing addresses for multiple chains
 */
contract MultiChainResolver {
    AbstractRNS rns;
    AbstractPublicResolver oldResolver;

    address private constant NULL_ADDRESS = address(0);

    /**
        Map of chain addresses (BTC, ETH, LTC, etc.) in the form of a map indexed by a pair `(node, ticker_hash)`
        where `node` is the domain encoded through namehash and `ticker_hash` is the keccak256 of the chain symbol
        defined in the SLIP-0044 (https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
     */
    mapping(bytes32 => mapping(bytes32 => string)) chainAddresses;
    
    /**
        Map of traditional RSK addresses indexed by the namehash encoded domain
     */
    mapping(bytes32 => address) addresses;
    
    /**
        Map of content hashes indexed by the namehash encoded domain 
     */
    mapping(bytes32 => bytes32) contentHashes;

    event NewChainAddress(bytes32 node, bytes32 chainHash, string newAddress);
    event NewAddress(bytes32 node, address newAddress);
    event NewContent(bytes32 node, bytes32 contentHash);
    
    modifier onlyOwner(bytes32 node) {
        require(rns.owner(node) == msg.sender);
        _;
    }

    /**
        Constructor
        @param _rns address of the RNS Registry
        @param _oldResolver address of the previous resolver, if any
     */
    constructor (AbstractRNS _rns, AbstractPublicResolver _oldResolver) public {
        rns = _rns;
        oldResolver = _oldResolver;
    }

    /**
        Returns, for a given namehash encoded name and chain hash, the string representing an address of said chain
        the name resolves to.
        @param node The namehash encoded name
        @param chainHash The keccak256 hash of the chain symbol defined in the SLIP-0044
        @return A string representing an address
     */
    function chainAddr(bytes32 node, bytes32 chainHash) public view returns (string memory) {
        return chainAddresses[node][chainHash];
    }

    /**
        Maps, for a given namehash encoded name and chain hash, an string which represent an address of said chain
        the name resolves to.
        @param node The namehash encoded name
        @param chainHash The keccak256 hash of the chain symbol defined in the SLIP-0044
        @param newAddress The new address the name resolves to
     */
    function setChainAddr(bytes32 node, bytes32 chainHash, string memory newAddress) public onlyOwner(node) {
        chainAddresses[node][chainHash] = newAddress;

        emit NewChainAddress(node, chainHash, newAddress);
    }

    /**
        Returns a traditional RSK address a name maps to. If no address is found in this resolver, the old one will be 
        queried instead.
        @param node The namehash encoded name
        @return The RSK address the node resolves to
     */
    function addr(bytes32 node) public view returns (address) { 
        address ret = addresses[node];
        
        if ((address(oldResolver) != NULL_ADDRESS) && (ret == NULL_ADDRESS)) {
            ret = oldResolver.addr(node);
        }

        return ret;
    }
    
    /**
        Maps an RSK address to a name.
        @param node The namehash encoded name
        @param newAddress The new address the node will resolve to
     */
    function setAddr(bytes32 node, address newAddress) public onlyOwner(node) {
        addresses[node] = newAddress;

        emit NewAddress(node, newAddress);
    }

    /**
        Returns a content hash a name maps to. If no hash is found in this resolver, the old one will be
        queried instead.
        @param node The namehash encoded name
        @return The content hash mapped to the node
     */
    function content(bytes32 node) public view returns (bytes32) {
        bytes32 contentHash = contentHashes[node];

        if ((address(oldResolver) != NULL_ADDRESS) && (contentHash == 0)) {
            contentHash = oldResolver.content(node);
        }

        return contentHash;
    }
    
    /**
        Maps a content hash to a name.
        @param node The namehash encoded name
        @param newContentHash The new content hash the node will map to
     */
    function setContent(bytes32 node, bytes32 newContentHash) public onlyOwner(node) {
        contentHashes[node] = newContentHash;

        emit NewContent(node, newContentHash);
    }
}