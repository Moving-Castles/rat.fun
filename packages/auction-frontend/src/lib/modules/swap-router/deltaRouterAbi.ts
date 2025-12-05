export const deltaRouterAbi = [
  {
    "type": "function",
    "name": "execute",
    "inputs": [
      {
        "name": "inputs",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "error",
    "name": "ContractLocked",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DeltaNotNegative",
    "inputs": [
      {
        "name": "currency",
        "type": "address",
        "internalType": "Currency"
      }
    ]
  },
  {
    "type": "error",
    "name": "DeltaNotPositive",
    "inputs": [
      {
        "name": "currency",
        "type": "address",
        "internalType": "Currency"
      }
    ]
  },
  {
    "type": "error",
    "name": "InputLengthMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InsufficientBalance",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidBips",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidEthSender",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidHopSlippageLength",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidPath",
    "inputs": [
      {
        "name": "pathLength",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "NotPoolManager",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnsupportedAction",
    "inputs": [
      {
        "name": "action",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "V4TooLittleReceived",
    "inputs": [
      {
        "name": "minAmountOutReceived",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "amountReceived",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "V4TooLittleReceivedPerHop",
    "inputs": [
      {
        "name": "hopIndex",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxPrice",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "price",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "V4TooMuchRequested",
    "inputs": [
      {
        "name": "maxAmountInRequested",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "amountRequested",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "V4TooMuchRequestedPerHop",
    "inputs": [
      {
        "name": "hopIndex",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "maxPrice",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "price",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  }
] as const