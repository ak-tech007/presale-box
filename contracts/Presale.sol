// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8); 
}

contract Presale is Ownable {
    IERC20 public tether;
    IERC20 public presaleToken;
    address public fundReceiver;

    uint256 public totalRaisedETH;   
    uint256 public totalRaisedTether;


    address[] public participants;
    mapping(address => uint256) public tokensOwed;

    event Participated(address indexed participant, uint256 amount, bool isETH);

    constructor(address _tether, address _presaleToken, address _fundReceiver) Ownable(msg.sender) {
        tether = IERC20(_tether);
        presaleToken = IERC20(_presaleToken);
        fundReceiver = _fundReceiver;
    }


    function participate(bool _tetherOrEth, uint256 _amount) external payable {
        if (_tetherOrEth) {
            _participateWithTether(_amount);
        } else {
            _participateWithETH(msg.value);
        }
    }

    function _participateWithTether(uint256 _amount) internal {
        require(tether.transferFrom(msg.sender, address(this), _amount), "Tether transfer failed");
        require(tether.transfer(fundReceiver, _amount), "Tether transfer to fund receiver failed");
        totalRaisedTether += _amount;
        _addParticipantAndOwedTokens(msg.sender, 0, _amount, true);
    }

    function _participateWithETH(uint256 _amount) internal {
        require(msg.value > 0, "Must send ETH");
        totalRaisedETH += _amount;
        (bool sent, ) = payable(fundReceiver).call{value: _amount}("");
        require(sent, "Failed to send ETH");
        _addParticipantAndOwedTokens(msg.sender, _amount, 0, false);
    }

    receive() external payable {
        _participateWithETH(msg.value);
    }

    function handleTetherTransfer(address _user, uint256 _amount) external {
        require(tether.transfer(fundReceiver, _amount), "Tether transfer to fund receiver failed");
        totalRaisedTether += _amount;
        _addParticipantAndOwedTokens(_user, 0, _amount, true);
    }

    function _addParticipantAndOwedTokens(address _participant, uint256 _ethAmount, uint256 _tetherAmount, bool _isTether) internal {
        participants.push(_participant);
        uint256 tokensToReceive = calculateTokens(_ethAmount, _tetherAmount, _isTether);
        tokensOwed[_participant] += tokensToReceive;
        emit Participated(_participant, _isTether ? _tetherAmount : _ethAmount, _isTether);
    }

    function calculateTokens(uint256 _ethAmount, uint256 _tetherAmount, bool _isTether) internal view returns (uint256) {
        uint256 tokenPriceInEth = 0.000000626 ether;
        uint256 tokenPriceInTether = 1443;
        uint256 tokenDecimals = presaleToken.decimals();

        return _isTether
            ? (_tetherAmount / tokenPriceInTether) * (10 ** tokenDecimals)
            : (_ethAmount / tokenPriceInEth) * (10 ** tokenDecimals);
    }

    function finishPresale() external onlyOwner {
        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            uint256 amountOwed = tokensOwed[participant];
            require(presaleToken.transfer(participant, amountOwed), "Token transfer failed");
            tokensOwed[participant] = 0;  
        }
    }

    function changeFundReceiver(address _fundReceiver) external onlyOwner {
        fundReceiver = _fundReceiver;
    }


    function getParticipantsCount() external view returns (uint256) {
        return participants.length;
    }
}
