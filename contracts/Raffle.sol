////////////////
/// LICENSE ///
//////////////
// SPDX-License-Identifier: MIT

/////////////////
/// COMPILER ///
///////////////
pragma solidity ^0.8.8;

////////////////
/// IMPORTS ///
//////////////
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";

///////////////
/// ERRORS ///
/////////////
error Raffle__notPaidEnoughToEnter();
error Raffle__RaffleNotOpen();
error Raffle__UpkeepNotNeeded(uint256 currentRaffleState, uint256 currentPlayersLength, uint256 currentBalance);
error Raffle__PaymentToWinnerFailed();

/**
 * @title Raffle
 * @param _vrfCoordinatorAddress
 * @param _gasLane
 * @param _subscriptionId
 * @param _callbackGasLimit
 * @param _entranceFee
 * @param _interval
 * @dev This Contract Allows Players to Enter into Raffle/Lottery to win it.
 * @author theirrationalone
 */

//////////////////
/// CONTRACTS ///
////////////////
contract Raffle is VRFConsumerBaseV2, KeeperCompatible {
    ///////////////////////////
    /// TYPES DECLARATIONS ///
    /////////////////////////
    enum RaffleState {
        OPEN,
        CALCULATING
    }

    ////////////////////////
    /// STATE VARIABLES ///
    //////////////////////
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    RaffleState private s_raffleState;
    uint256 private immutable i_interval;
    uint256 private s_lastTimestamp;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    address private s_recentWinner;

    VRFCoordinatorV2Interface private immutable i_vrfCoordinatorV2;

    ///////////////
    /// EVENTS ///
    /////////////
    event RaffleEnter(address indexed player);
    event RandomWinnerRequest(uint256 indexed requestId);
    event WinnerPicked(address indexed recentWinner);

    //////////////////////////
    /// SPECIAL FUNCTIONS ///
    ////////////////////////
    constructor(
        address _vrfCoordinatorV2Address,
        uint256 _entranceFee,
        uint256 _interval,
        bytes32 _gasLane,
        uint64 _subscriptionId,
        uint32 _callbackGasLimit
    ) VRFConsumerBaseV2(_vrfCoordinatorV2Address) {
        i_vrfCoordinatorV2 = VRFCoordinatorV2Interface(_vrfCoordinatorV2Address);
        i_entranceFee = _entranceFee;
        i_interval = _interval;
        i_gasLane = _gasLane;
        i_subscriptionId = _subscriptionId;
        i_callbackGasLimit = _callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        s_lastTimestamp = block.timestamp;
    }

    /////////////////////////////
    /// MUTATIONAL FUNCTIONS ///
    ///////////////////////////
    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle__notPaidEnoughToEnter();
        }

        if (s_raffleState != RaffleState.OPEN) {
            revert Raffle__RaffleNotOpen();
        }

        s_players.push(payable(msg.sender));

        emit RaffleEnter(msg.sender);
    }

    function checkUpkeep(
        bytes memory /* checkData */
    ) public override returns (bool upkeepNeeded, bytes memory /* upkeepData */) {
        bool isOpen = (s_raffleState == RaffleState.OPEN);
        bool isTimePassed = ((block.timestamp - s_lastTimestamp) > i_interval);
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance = (address(this).balance > 0);

        upkeepNeeded = (isOpen && isTimePassed && hasPlayers && hasBalance);
    }

    function performUpkeep(bytes memory /**performData */) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");

        if (!upkeepNeeded) {
            revert Raffle__UpkeepNotNeeded(uint256(s_raffleState), s_players.length, address(this).balance);
        }

        s_raffleState = RaffleState.CALCULATING;

        uint256 requestId = i_vrfCoordinatorV2.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        emit RandomWinnerRequest(requestId);
    }

    function fulfillRandomWords(uint256 /* requestId */, uint256[] memory randomWords) internal override {
        uint256 winnerIndex = randomWords[0] % s_players.length;

        address payable recentWinner = s_players[winnerIndex];

        s_recentWinner = recentWinner;

        s_players = new address payable[](0);
        s_lastTimestamp = block.timestamp;
        s_raffleState = RaffleState.OPEN;

        (bool isSuccess, ) = s_recentWinner.call{value: address(this).balance}("");

        if (!isSuccess) {
            revert Raffle__PaymentToWinnerFailed();
        }

        emit WinnerPicked(s_recentWinner);
    }

    /////////////////////////
    /// HELPER FUNCTIONS ///
    ///////////////////////
    function getVRFCoordinatorAddress() public view returns (VRFCoordinatorV2Interface) {
        return i_vrfCoordinatorV2;
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getNumWords() public pure returns (uint32) {
        return NUM_WORDS;
    }

    function getRequestConfirmations() public pure returns (uint16) {
        return REQUEST_CONFIRMATIONS;
    }

    function getCallbackGasLimit() public view returns (uint32) {
        return i_callbackGasLimit;
    }

    function getSubscriptionId() public view returns (uint64) {
        return i_subscriptionId;
    }

    function getGasLane() public view returns (bytes32) {
        return i_gasLane;
    }

    function getLastTimestamp() public view returns (uint256) {
        return s_lastTimestamp;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function getRaffleState() public view returns (uint256) {
        return uint256(s_raffleState);
    }

    function getPlayersLength() public view returns (uint256) {
        return s_players.length;
    }

    function getPlayer(uint256 _playerIdx) public view returns (address) {
        return s_players[_playerIdx];
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }
}
