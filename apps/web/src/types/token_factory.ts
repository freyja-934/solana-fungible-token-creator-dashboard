export type TokenFactory = {
  "version": "0.1.0",
  "name": "token_factory",
  "instructions": [
    {
      "name": "initializePlatform",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "platformConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "treasury",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "initializeToken",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeExemptList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "platformConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "platformTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "InitializeTokenParams"
          }
        }
      ]
    },
    {
      "name": "transferWithFee",
      "accounts": [
        {
          "name": "from",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "fromTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "to",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "toTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeExemptList",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "platformConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "platformTreasuryTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "platformConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "creationFeeLamports",
            "type": "u64"
          },
          {
            "name": "transferFeeBps",
            "type": "u16"
          },
          {
            "name": "feesEnabled",
            "type": "bool"
          },
          {
            "name": "totalCreationFeesCollected",
            "type": "u64"
          },
          {
            "name": "tokensCreated",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "tokenConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "feesEnabled",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "feeConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "staking",
            "type": "publicKey"
          },
          {
            "name": "marketing",
            "type": "publicKey"
          },
          {
            "name": "treasuryBps",
            "type": "u16"
          },
          {
            "name": "stakingBps",
            "type": "u16"
          },
          {
            "name": "marketingBps",
            "type": "u16"
          },
          {
            "name": "totalFeeBps",
            "type": "u16"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "feeExemptList",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "exemptAddresses",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "InitializeTokenParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "decimals",
            "type": "u8"
          },
          {
            "name": "initialSupply",
            "type": "u64"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "staking",
            "type": "publicKey"
          },
          {
            "name": "marketing",
            "type": "publicKey"
          },
          {
            "name": "treasuryBps",
            "type": "u16"
          },
          {
            "name": "stakingBps",
            "type": "u16"
          },
          {
            "name": "marketingBps",
            "type": "u16"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidPlatformTreasury",
      "msg": "Invalid platform treasury account"
    },
    {
      "code": 6001,
      "name": "ArithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6002,
      "name": "FeeExceedsMaximum",
      "msg": "Fee basis points cannot exceed 10% (1000 bps)"
    },
    {
      "code": 6003,
      "name": "InsufficientBalance",
      "msg": "Insufficient balance for transfer"
    }
  ]
};

export const IDL: TokenFactory = {
  "version": "0.1.0",
  "name": "token_factory",
  "instructions": [
    {
      "name": "initializePlatform",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "platformConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "treasury",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "initializeToken",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeExemptList",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "platformConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "platformTreasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "InitializeTokenParams"
          }
        }
      ]
    },
    {
      "name": "transferWithFee",
      "accounts": [
        {
          "name": "from",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "fromTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "to",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "toTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeExemptList",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "platformConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "platformTreasuryTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "platformConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "creationFeeLamports",
            "type": "u64"
          },
          {
            "name": "transferFeeBps",
            "type": "u16"
          },
          {
            "name": "feesEnabled",
            "type": "bool"
          },
          {
            "name": "totalCreationFeesCollected",
            "type": "u64"
          },
          {
            "name": "tokensCreated",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "tokenConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "feesEnabled",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "feeConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "staking",
            "type": "publicKey"
          },
          {
            "name": "marketing",
            "type": "publicKey"
          },
          {
            "name": "treasuryBps",
            "type": "u16"
          },
          {
            "name": "stakingBps",
            "type": "u16"
          },
          {
            "name": "marketingBps",
            "type": "u16"
          },
          {
            "name": "totalFeeBps",
            "type": "u16"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "feeExemptList",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "exemptAddresses",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "InitializeTokenParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "decimals",
            "type": "u8"
          },
          {
            "name": "initialSupply",
            "type": "u64"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "staking",
            "type": "publicKey"
          },
          {
            "name": "marketing",
            "type": "publicKey"
          },
          {
            "name": "treasuryBps",
            "type": "u16"
          },
          {
            "name": "stakingBps",
            "type": "u16"
          },
          {
            "name": "marketingBps",
            "type": "u16"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidPlatformTreasury",
      "msg": "Invalid platform treasury account"
    },
    {
      "code": 6001,
      "name": "ArithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6002,
      "name": "FeeExceedsMaximum",
      "msg": "Fee basis points cannot exceed 10% (1000 bps)"
    },
    {
      "code": 6003,
      "name": "InsufficientBalance",
      "msg": "Insufficient balance for transfer"
    }
  ]
};
