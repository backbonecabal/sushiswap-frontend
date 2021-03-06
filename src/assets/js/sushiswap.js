import { Decimal } from "decimal.js-light";
import Web3 from "web3";
import * as BigInt from "big-integer";

Decimal.config({ precision: 36 });
Decimal.config({ toExpNeg: -1000 });
Decimal.config({ toExpPos: 1000 });

// Add ability to serialize BigInt as JSON
JSON.stringifyBigInt = function(obj) {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "bigint") {
      return value.toString() + "n";
    } else {
      return value;
    }
  });
};

JSON.parseBigInt = function(str) {
  return JSON.parse(str, (key, value) => {
    if (typeof value === "string" && /^\d+n$/.test(value)) {
      return BigInt(value.slice(0, -1));
    }
    return value;
  });
};

String.prototype.addTopicZeroes = function() {
  return "0x000000000000000000000000" + this.substr(2);
};

const objAssign = function(to, from) {
  if (window.Vue) {
    console.log("Vue Project Needs to be Initialized.");
    // for (let i in from) {
    //   Vue.set(to, i, from[i]);
    // }
  } else {
    Object.assign(to, from);
  }
};

// Returns a string where the value is divided by 10^divisor and cut off to decimalPlaces decimal places
// Pass in sep to change the decimal point. No rounding done at the moment.
BigInt.prototype.print = function(divisor, decimalPlaces) {
  let powDivisor = new Decimal(10).toPower(divisor.toString());
  //Scale the number down by divisor
  let x = new Decimal(this.toString());
  x = x.dividedBy(powDivisor);
  //console.log(x.toString(), x.decimalPlaces(), x.precision(), decimalPlaces, x.decimalPlaces() - x.precision() >= decimalPlaces - 4)
  if (x.decimalPlaces() - x.precision() > decimalPlaces - 4) {
    return x.toSignificantDigits(4).toFixed();
  } else {
    return x.toFixed(decimalPlaces);
  }
};

BigInt.prototype.toDec = function(divisor) {
  return new Decimal(this.toString()).dividedBy(
    new Decimal(10).toPower(divisor.toString())
  );
};

Decimal.prototype.toInt = function(decimals) {
  return BigInt(this.times(new Decimal("10").pow(decimals)).todp(0));
};

const bigIntMax = (...args) => args.reduce((m, e) => (e > m ? e : m));
const bigIntMin = (...args) => args.reduce((m, e) => (e < m ? e : m));

const rpcToObj = function(rpc_obj, obj) {
  if (!obj) {
    obj = {};
  }
  for (let i in rpc_obj) {
    if (isNaN(i)) {
      // Not always correct, but overall useful
      obj[i] =
        isNaN(rpc_obj[i]) ||
        i.indexOf("name") != -1 ||
        i.indexOf("symbol") != -1 ||
        (typeof rpc_obj[i] == "string" && rpc_obj[i].startsWith("0x"))
          ? rpc_obj[i]
          : BigInt(rpc_obj[i]);
    }
  }
  return obj;
};

// Makes calling contracts easier, by adding the contracts to every instance of Web3.
// Changing the network is automatically dealt with.
// New way of using: web3.contract_name.method_name(parameters).call() or .send()
function addContract(name, abi, addresses) {
  Object.defineProperty(Web3.prototype, name, {
    get: function() {
      let web3 = this;
      return new Proxy(
        {},
        {
          get: function(target, method) {
            if (method == "address") {
              return addresses[web3.currentProvider.chainId];
            }

            return function(...params) {
              let contract = new web3.eth.Contract(
                abi,
                addresses[web3.currentProvider.chainId]
              );
              return contract.methods[method](...params);
            };
          },
        }
      );
    },
  });
}

// ABIs
const abis = {
  erc20: [
    {
      constant: true,
      inputs: [],
      name: "name",
      outputs: [{ name: "", type: "string" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ name: "", type: "bool" }],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "totalSupply",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
      ],
      name: "transferFrom",
      outputs: [{ name: "", type: "bool" }],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "decimals",
      outputs: [{ name: "", type: "uint8" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        { name: "spender", type: "address" },
        { name: "addedValue", type: "uint256" },
      ],
      name: "increaseAllowance",
      outputs: [{ name: "", type: "bool" }],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: false,
      inputs: [{ name: "value", type: "uint256" }],
      name: "burn",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [{ name: "owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "symbol",
      outputs: [{ name: "", type: "string" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        { name: "spender", type: "address" },
        { name: "subtractedValue", type: "uint256" },
      ],
      name: "decreaseAllowance",
      outputs: [{ name: "", type: "bool" }],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: false,
      inputs: [
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ name: "", type: "bool" }],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
      ],
      name: "allowance",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "from", type: "address" },
        { indexed: true, name: "to", type: "address" },
        { indexed: false, name: "value", type: "uint256" },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: "owner", type: "address" },
        { indexed: true, name: "spender", type: "address" },
        { indexed: false, name: "value", type: "uint256" },
      ],
      name: "Approval",
      type: "event",
    },
  ],
  sushi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Approval",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "delegator",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "fromDelegate",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "toDelegate",
          type: "address",
        },
      ],
      name: "DelegateChanged",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "delegate",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "previousBalance",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "newBalance",
          type: "uint256",
        },
      ],
      name: "DelegateVotesChanged",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "previousOwner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "OwnershipTransferred",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "from",
          type: "address",
        },
        { indexed: true, internalType: "address", name: "to", type: "address" },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      inputs: [],
      name: "DELEGATION_TYPEHASH",
      outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "DOMAIN_TYPEHASH",
      outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "owner", type: "address" },
        { internalType: "address", name: "spender", type: "address" },
      ],
      name: "allowance",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "", type: "address" },
        { internalType: "uint32", name: "", type: "uint32" },
      ],
      name: "checkpoints",
      outputs: [
        { internalType: "uint32", name: "fromBlock", type: "uint32" },
        { internalType: "uint256", name: "votes", type: "uint256" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "decimals",
      outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "subtractedValue", type: "uint256" },
      ],
      name: "decreaseAllowance",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "delegatee", type: "address" }],
      name: "delegate",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "delegatee", type: "address" },
        { internalType: "uint256", name: "nonce", type: "uint256" },
        { internalType: "uint256", name: "expiry", type: "uint256" },
        { internalType: "uint8", name: "v", type: "uint8" },
        { internalType: "bytes32", name: "r", type: "bytes32" },
        { internalType: "bytes32", name: "s", type: "bytes32" },
      ],
      name: "delegateBySig",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "delegator", type: "address" }],
      name: "delegates",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "account", type: "address" }],
      name: "getCurrentVotes",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "account", type: "address" },
        { internalType: "uint256", name: "blockNumber", type: "uint256" },
      ],
      name: "getPriorVotes",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "addedValue", type: "uint256" },
      ],
      name: "increaseAllowance",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "_to", type: "address" },
        { internalType: "uint256", name: "_amount", type: "uint256" },
      ],
      name: "mint",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "name",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "", type: "address" }],
      name: "nonces",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "", type: "address" }],
      name: "numCheckpoints",
      outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "renounceOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalSupply",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "recipient", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "sender", type: "address" },
        { internalType: "address", name: "recipient", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "transferFrom",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
      name: "transferOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
  chef: [
    {
      inputs: [
        {
          internalType: "contract SushiToken",
          name: "_sushi",
          type: "address",
        },
        { internalType: "address", name: "_devaddr", type: "address" },
        { internalType: "uint256", name: "_sushiPerBlock", type: "uint256" },
        { internalType: "uint256", name: "_startBlock", type: "uint256" },
        { internalType: "uint256", name: "_bonusEndBlock", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "pid",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "Deposit",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "pid",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "EmergencyWithdraw",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "previousOwner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "OwnershipTransferred",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "pid",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "Withdraw",
      type: "event",
    },
    {
      inputs: [],
      name: "BONUS_MULTIPLIER",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "_allocPoint", type: "uint256" },
        { internalType: "contract IERC20", name: "_lpToken", type: "address" },
        { internalType: "bool", name: "_withUpdate", type: "bool" },
      ],
      name: "add",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "bonusEndBlock",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "_pid", type: "uint256" },
        { internalType: "uint256", name: "_amount", type: "uint256" },
      ],
      name: "deposit",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "_devaddr", type: "address" }],
      name: "dev",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "devaddr",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "_pid", type: "uint256" }],
      name: "emergencyWithdraw",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "_from", type: "uint256" },
        { internalType: "uint256", name: "_to", type: "uint256" },
      ],
      name: "getMultiplier",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "massUpdatePools",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "_pid", type: "uint256" }],
      name: "migrate",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "migrator",
      outputs: [
        { internalType: "contract IMigratorChef", name: "", type: "address" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "_pid", type: "uint256" },
        { internalType: "address", name: "_user", type: "address" },
      ],
      name: "pendingSushi",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      name: "poolInfo",
      outputs: [
        { internalType: "contract IERC20", name: "lpToken", type: "address" },
        { internalType: "uint256", name: "allocPoint", type: "uint256" },
        { internalType: "uint256", name: "lastRewardBlock", type: "uint256" },
        { internalType: "uint256", name: "accSushiPerShare", type: "uint256" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "poolLength",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "renounceOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "_pid", type: "uint256" },
        { internalType: "uint256", name: "_allocPoint", type: "uint256" },
        { internalType: "bool", name: "_withUpdate", type: "bool" },
      ],
      name: "set",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "contract IMigratorChef",
          name: "_migrator",
          type: "address",
        },
      ],
      name: "setMigrator",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "startBlock",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "sushi",
      outputs: [
        { internalType: "contract SushiToken", name: "", type: "address" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "sushiPerBlock",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalAllocPoint",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
      name: "transferOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "_pid", type: "uint256" }],
      name: "updatePool",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "", type: "uint256" },
        { internalType: "address", name: "", type: "address" },
      ],
      name: "userInfo",
      outputs: [
        { internalType: "uint256", name: "amount", type: "uint256" },
        { internalType: "uint256", name: "rewardDebt", type: "uint256" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "_pid", type: "uint256" },
        { internalType: "uint256", name: "_amount", type: "uint256" },
      ],
      name: "withdraw",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
  factory: [
    {
      inputs: [
        { internalType: "address", name: "_feeToSetter", type: "address" },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "token0",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "token1",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "pair",
          type: "address",
        },
        { indexed: false, internalType: "uint256", name: "", type: "uint256" },
      ],
      name: "PairCreated",
      type: "event",
    },
    {
      inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      name: "allPairs",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "allPairsLength",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "tokenA", type: "address" },
        { internalType: "address", name: "tokenB", type: "address" },
      ],
      name: "createPair",
      outputs: [{ internalType: "address", name: "pair", type: "address" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "feeTo",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "feeToSetter",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "", type: "address" },
        { internalType: "address", name: "", type: "address" },
      ],
      name: "getPair",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "migrator",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "pairCodeHash",
      outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
      stateMutability: "pure",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "_feeTo", type: "address" }],
      name: "setFeeTo",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "_feeToSetter", type: "address" },
      ],
      name: "setFeeToSetter",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "_migrator", type: "address" }],
      name: "setMigrator",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
  pair: [
    { inputs: [], stateMutability: "nonpayable", type: "constructor" },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Approval",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "sender",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount0",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount1",
          type: "uint256",
        },
        { indexed: true, internalType: "address", name: "to", type: "address" },
      ],
      name: "Burn",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "sender",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount0",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount1",
          type: "uint256",
        },
      ],
      name: "Mint",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "sender",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount0In",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount1In",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount0Out",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount1Out",
          type: "uint256",
        },
        { indexed: true, internalType: "address", name: "to", type: "address" },
      ],
      name: "Swap",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint112",
          name: "reserve0",
          type: "uint112",
        },
        {
          indexed: false,
          internalType: "uint112",
          name: "reserve1",
          type: "uint112",
        },
      ],
      name: "Sync",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "from",
          type: "address",
        },
        { indexed: true, internalType: "address", name: "to", type: "address" },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      inputs: [],
      name: "DOMAIN_SEPARATOR",
      outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "MINIMUM_LIQUIDITY",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "PERMIT_TYPEHASH",
      outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "", type: "address" },
        { internalType: "address", name: "", type: "address" },
      ],
      name: "allowance",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "", type: "address" }],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "to", type: "address" }],
      name: "burn",
      outputs: [
        { internalType: "uint256", name: "amount0", type: "uint256" },
        { internalType: "uint256", name: "amount1", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "decimals",
      outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "factory",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getReserves",
      outputs: [
        { internalType: "uint112", name: "_reserve0", type: "uint112" },
        { internalType: "uint112", name: "_reserve1", type: "uint112" },
        { internalType: "uint32", name: "_blockTimestampLast", type: "uint32" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "_token0", type: "address" },
        { internalType: "address", name: "_token1", type: "address" },
      ],
      name: "initialize",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "kLast",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "to", type: "address" }],
      name: "mint",
      outputs: [
        { internalType: "uint256", name: "liquidity", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "name",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "", type: "address" }],
      name: "nonces",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "owner", type: "address" },
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
        { internalType: "uint8", name: "v", type: "uint8" },
        { internalType: "bytes32", name: "r", type: "bytes32" },
        { internalType: "bytes32", name: "s", type: "bytes32" },
      ],
      name: "permit",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "price0CumulativeLast",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "price1CumulativeLast",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "to", type: "address" }],
      name: "skim",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amount0Out", type: "uint256" },
        { internalType: "uint256", name: "amount1Out", type: "uint256" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "bytes", name: "data", type: "bytes" },
      ],
      name: "swap",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "sync",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "token0",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "token1",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalSupply",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "from", type: "address" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
      ],
      name: "transferFrom",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
  router: [
    {
      inputs: [
        { internalType: "address", name: "_factory", type: "address" },
        { internalType: "address", name: "_WETH", type: "address" },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [],
      name: "WETH",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "tokenA", type: "address" },
        { internalType: "address", name: "tokenB", type: "address" },
        { internalType: "uint256", name: "amountADesired", type: "uint256" },
        { internalType: "uint256", name: "amountBDesired", type: "uint256" },
        { internalType: "uint256", name: "amountAMin", type: "uint256" },
        { internalType: "uint256", name: "amountBMin", type: "uint256" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
      ],
      name: "addLiquidity",
      outputs: [
        { internalType: "uint256", name: "amountA", type: "uint256" },
        { internalType: "uint256", name: "amountB", type: "uint256" },
        { internalType: "uint256", name: "liquidity", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "token", type: "address" },
        {
          internalType: "uint256",
          name: "amountTokenDesired",
          type: "uint256",
        },
        { internalType: "uint256", name: "amountTokenMin", type: "uint256" },
        { internalType: "uint256", name: "amountETHMin", type: "uint256" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
      ],
      name: "addLiquidityETH",
      outputs: [
        { internalType: "uint256", name: "amountToken", type: "uint256" },
        { internalType: "uint256", name: "amountETH", type: "uint256" },
        { internalType: "uint256", name: "liquidity", type: "uint256" },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [],
      name: "factory",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountOut", type: "uint256" },
        { internalType: "uint256", name: "reserveIn", type: "uint256" },
        { internalType: "uint256", name: "reserveOut", type: "uint256" },
      ],
      name: "getAmountIn",
      outputs: [{ internalType: "uint256", name: "amountIn", type: "uint256" }],
      stateMutability: "pure",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountIn", type: "uint256" },
        { internalType: "uint256", name: "reserveIn", type: "uint256" },
        { internalType: "uint256", name: "reserveOut", type: "uint256" },
      ],
      name: "getAmountOut",
      outputs: [
        { internalType: "uint256", name: "amountOut", type: "uint256" },
      ],
      stateMutability: "pure",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountOut", type: "uint256" },
        { internalType: "address[]", name: "path", type: "address[]" },
      ],
      name: "getAmountsIn",
      outputs: [
        { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountIn", type: "uint256" },
        { internalType: "address[]", name: "path", type: "address[]" },
      ],
      name: "getAmountsOut",
      outputs: [
        { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountA", type: "uint256" },
        { internalType: "uint256", name: "reserveA", type: "uint256" },
        { internalType: "uint256", name: "reserveB", type: "uint256" },
      ],
      name: "quote",
      outputs: [{ internalType: "uint256", name: "amountB", type: "uint256" }],
      stateMutability: "pure",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "tokenA", type: "address" },
        { internalType: "address", name: "tokenB", type: "address" },
        { internalType: "uint256", name: "liquidity", type: "uint256" },
        { internalType: "uint256", name: "amountAMin", type: "uint256" },
        { internalType: "uint256", name: "amountBMin", type: "uint256" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
      ],
      name: "removeLiquidity",
      outputs: [
        { internalType: "uint256", name: "amountA", type: "uint256" },
        { internalType: "uint256", name: "amountB", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "token", type: "address" },
        { internalType: "uint256", name: "liquidity", type: "uint256" },
        { internalType: "uint256", name: "amountTokenMin", type: "uint256" },
        { internalType: "uint256", name: "amountETHMin", type: "uint256" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
      ],
      name: "removeLiquidityETH",
      outputs: [
        { internalType: "uint256", name: "amountToken", type: "uint256" },
        { internalType: "uint256", name: "amountETH", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "token", type: "address" },
        { internalType: "uint256", name: "liquidity", type: "uint256" },
        { internalType: "uint256", name: "amountTokenMin", type: "uint256" },
        { internalType: "uint256", name: "amountETHMin", type: "uint256" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
      ],
      name: "removeLiquidityETHSupportingFeeOnTransferTokens",
      outputs: [
        { internalType: "uint256", name: "amountETH", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "token", type: "address" },
        { internalType: "uint256", name: "liquidity", type: "uint256" },
        { internalType: "uint256", name: "amountTokenMin", type: "uint256" },
        { internalType: "uint256", name: "amountETHMin", type: "uint256" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
        { internalType: "bool", name: "approveMax", type: "bool" },
        { internalType: "uint8", name: "v", type: "uint8" },
        { internalType: "bytes32", name: "r", type: "bytes32" },
        { internalType: "bytes32", name: "s", type: "bytes32" },
      ],
      name: "removeLiquidityETHWithPermit",
      outputs: [
        { internalType: "uint256", name: "amountToken", type: "uint256" },
        { internalType: "uint256", name: "amountETH", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "token", type: "address" },
        { internalType: "uint256", name: "liquidity", type: "uint256" },
        { internalType: "uint256", name: "amountTokenMin", type: "uint256" },
        { internalType: "uint256", name: "amountETHMin", type: "uint256" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
        { internalType: "bool", name: "approveMax", type: "bool" },
        { internalType: "uint8", name: "v", type: "uint8" },
        { internalType: "bytes32", name: "r", type: "bytes32" },
        { internalType: "bytes32", name: "s", type: "bytes32" },
      ],
      name: "removeLiquidityETHWithPermitSupportingFeeOnTransferTokens",
      outputs: [
        { internalType: "uint256", name: "amountETH", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "tokenA", type: "address" },
        { internalType: "address", name: "tokenB", type: "address" },
        { internalType: "uint256", name: "liquidity", type: "uint256" },
        { internalType: "uint256", name: "amountAMin", type: "uint256" },
        { internalType: "uint256", name: "amountBMin", type: "uint256" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
        { internalType: "bool", name: "approveMax", type: "bool" },
        { internalType: "uint8", name: "v", type: "uint8" },
        { internalType: "bytes32", name: "r", type: "bytes32" },
        { internalType: "bytes32", name: "s", type: "bytes32" },
      ],
      name: "removeLiquidityWithPermit",
      outputs: [
        { internalType: "uint256", name: "amountA", type: "uint256" },
        { internalType: "uint256", name: "amountB", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountOut", type: "uint256" },
        { internalType: "address[]", name: "path", type: "address[]" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
      ],
      name: "swapETHForExactTokens",
      outputs: [
        { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountOutMin", type: "uint256" },
        { internalType: "address[]", name: "path", type: "address[]" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
      ],
      name: "swapExactETHForTokens",
      outputs: [
        { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountOutMin", type: "uint256" },
        { internalType: "address[]", name: "path", type: "address[]" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
      ],
      name: "swapExactETHForTokensSupportingFeeOnTransferTokens",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountIn", type: "uint256" },
        { internalType: "uint256", name: "amountOutMin", type: "uint256" },
        { internalType: "address[]", name: "path", type: "address[]" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
      ],
      name: "swapExactTokensForETH",
      outputs: [
        { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountIn", type: "uint256" },
        { internalType: "uint256", name: "amountOutMin", type: "uint256" },
        { internalType: "address[]", name: "path", type: "address[]" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
      ],
      name: "swapExactTokensForETHSupportingFeeOnTransferTokens",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountIn", type: "uint256" },
        { internalType: "uint256", name: "amountOutMin", type: "uint256" },
        { internalType: "address[]", name: "path", type: "address[]" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
      ],
      name: "swapExactTokensForTokens",
      outputs: [
        { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountIn", type: "uint256" },
        { internalType: "uint256", name: "amountOutMin", type: "uint256" },
        { internalType: "address[]", name: "path", type: "address[]" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
      ],
      name: "swapExactTokensForTokensSupportingFeeOnTransferTokens",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountOut", type: "uint256" },
        { internalType: "uint256", name: "amountInMax", type: "uint256" },
        { internalType: "address[]", name: "path", type: "address[]" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
      ],
      name: "swapTokensForExactETH",
      outputs: [
        { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountOut", type: "uint256" },
        { internalType: "uint256", name: "amountInMax", type: "uint256" },
        { internalType: "address[]", name: "path", type: "address[]" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
      ],
      name: "swapTokensForExactTokens",
      outputs: [
        { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    { stateMutability: "payable", type: "receive" },
  ],
  bar: [
    {
      inputs: [
        { internalType: "contract IERC20", name: "_sushi", type: "address" },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Approval",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "from",
          type: "address",
        },
        { indexed: true, internalType: "address", name: "to", type: "address" },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      inputs: [
        { internalType: "address", name: "owner", type: "address" },
        { internalType: "address", name: "spender", type: "address" },
      ],
      name: "allowance",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "decimals",
      outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "subtractedValue", type: "uint256" },
      ],
      name: "decreaseAllowance",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "_amount", type: "uint256" }],
      name: "enter",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "addedValue", type: "uint256" },
      ],
      name: "increaseAllowance",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "_share", type: "uint256" }],
      name: "leave",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "name",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "sushi",
      outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalSupply",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "recipient", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "sender", type: "address" },
        { internalType: "address", name: "recipient", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "transferFrom",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
  maker: [
    {
      inputs: [
        {
          internalType: "contract IUniswapV2Factory",
          name: "_factory",
          type: "address",
        },
        { internalType: "address", name: "_bar", type: "address" },
        { internalType: "address", name: "_sushi", type: "address" },
        { internalType: "address", name: "_weth", type: "address" },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [],
      name: "bar",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "token0", type: "address" },
        { internalType: "address", name: "token1", type: "address" },
      ],
      name: "convert",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "factory",
      outputs: [
        {
          internalType: "contract IUniswapV2Factory",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "sushi",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "weth",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
  ],
  timelock: [
    {
      inputs: [
        { internalType: "address", name: "admin_", type: "address" },
        { internalType: "uint256", name: "delay_", type: "uint256" },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "txHash",
          type: "bytes32",
        },
        {
          indexed: true,
          internalType: "address",
          name: "target",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "string",
          name: "signature",
          type: "string",
        },
        { indexed: false, internalType: "bytes", name: "data", type: "bytes" },
        {
          indexed: false,
          internalType: "uint256",
          name: "eta",
          type: "uint256",
        },
      ],
      name: "CancelTransaction",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "txHash",
          type: "bytes32",
        },
        {
          indexed: true,
          internalType: "address",
          name: "target",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "string",
          name: "signature",
          type: "string",
        },
        { indexed: false, internalType: "bytes", name: "data", type: "bytes" },
        {
          indexed: false,
          internalType: "uint256",
          name: "eta",
          type: "uint256",
        },
      ],
      name: "ExecuteTransaction",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "newAdmin",
          type: "address",
        },
      ],
      name: "NewAdmin",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "newDelay",
          type: "uint256",
        },
      ],
      name: "NewDelay",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "newPendingAdmin",
          type: "address",
        },
      ],
      name: "NewPendingAdmin",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "txHash",
          type: "bytes32",
        },
        {
          indexed: true,
          internalType: "address",
          name: "target",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "string",
          name: "signature",
          type: "string",
        },
        { indexed: false, internalType: "bytes", name: "data", type: "bytes" },
        {
          indexed: false,
          internalType: "uint256",
          name: "eta",
          type: "uint256",
        },
      ],
      name: "QueueTransaction",
      type: "event",
    },
    {
      inputs: [],
      name: "GRACE_PERIOD",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "MAXIMUM_DELAY",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "MINIMUM_DELAY",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "acceptAdmin",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "admin",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "admin_initialized",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "target", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
        { internalType: "string", name: "signature", type: "string" },
        { internalType: "bytes", name: "data", type: "bytes" },
        { internalType: "uint256", name: "eta", type: "uint256" },
      ],
      name: "cancelTransaction",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "delay",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "target", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
        { internalType: "string", name: "signature", type: "string" },
        { internalType: "bytes", name: "data", type: "bytes" },
        { internalType: "uint256", name: "eta", type: "uint256" },
      ],
      name: "executeTransaction",
      outputs: [{ internalType: "bytes", name: "", type: "bytes" }],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [],
      name: "pendingAdmin",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "target", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
        { internalType: "string", name: "signature", type: "string" },
        { internalType: "bytes", name: "data", type: "bytes" },
        { internalType: "uint256", name: "eta", type: "uint256" },
      ],
      name: "queueTransaction",
      outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
      name: "queuedTransactions",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "delay_", type: "uint256" }],
      name: "setDelay",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "pendingAdmin_", type: "address" },
      ],
      name: "setPendingAdmin",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    { stateMutability: "payable", type: "receive" },
  ],

  poolnames: [
    { inputs: [], stateMutability: "nonpayable", type: "constructor" },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "previousOwner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "OwnershipTransferred",
      type: "event",
    },
    {
      inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      name: "logos",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      name: "names",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "renounceOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "pid", type: "uint256" },
        { internalType: "string", name: "logo", type: "string" },
        { internalType: "string", name: "name", type: "string" },
      ],
      name: "setPoolInfo",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
      name: "transferOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
  tokenInfo: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "previousOwner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "OwnershipTransferred",
      type: "event",
    },
    {
      inputs: [{ internalType: "address", name: "token", type: "address" }],
      name: "add",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "id", type: "uint256" },
        { internalType: "address", name: "token", type: "address" },
      ],
      name: "change",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "who", type: "address" },
        { internalType: "address[]", name: "extra", type: "address[]" },
      ],
      name: "getBalances",
      outputs: [
        {
          components: [
            { internalType: "address", name: "token", type: "address" },
            { internalType: "uint256", name: "balance", type: "uint256" },
          ],
          internalType: "struct BoringCryptoTokenScanner.Balance[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address[]", name: "extra", type: "address[]" }],
      name: "getInfo",
      outputs: [
        {
          components: [
            { internalType: "address", name: "token", type: "address" },
            { internalType: "uint256", name: "decimals", type: "uint256" },
            { internalType: "string", name: "name", type: "string" },
            { internalType: "string", name: "symbol", type: "string" },
          ],
          internalType: "struct BoringCryptoTokenScanner.TokenInfo[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "who", type: "address" },
        { internalType: "address[]", name: "extra", type: "address[]" },
      ],
      name: "getSpecificBalances",
      outputs: [
        {
          components: [
            { internalType: "address", name: "token", type: "address" },
            { internalType: "uint256", name: "balance", type: "uint256" },
          ],
          internalType: "struct BoringCryptoTokenScanner.Balance[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address[]", name: "extra", type: "address[]" }],
      name: "getSpecificInfo",
      outputs: [
        {
          components: [
            { internalType: "address", name: "token", type: "address" },
            { internalType: "uint256", name: "decimals", type: "uint256" },
            { internalType: "string", name: "name", type: "string" },
            { internalType: "string", name: "symbol", type: "string" },
          ],
          internalType: "struct BoringCryptoTokenScanner.TokenInfo[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "remove",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "renounceOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "tokenCount",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      name: "tokens",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
      name: "transferOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
  baseInfo: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "previousOwner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "OwnershipTransferred",
      type: "event",
    },
    {
      inputs: [],
      name: "getInfo",
      outputs: [
        {
          components: [
            {
              internalType: "uint256",
              name: "BONUS_MULTIPLIER",
              type: "uint256",
            },
            { internalType: "uint256", name: "bonusEndBlock", type: "uint256" },
            { internalType: "address", name: "devaddr", type: "address" },
            { internalType: "address", name: "migrator", type: "address" },
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "uint256", name: "startBlock", type: "uint256" },
            { internalType: "address", name: "sushi", type: "address" },
            { internalType: "uint256", name: "sushiPerBlock", type: "uint256" },
            {
              internalType: "uint256",
              name: "totalAllocPoint",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "sushiTotalSupply",
              type: "uint256",
            },
            { internalType: "address", name: "sushiOwner", type: "address" },
          ],
          internalType: "struct BaseInfo",
          name: "",
          type: "tuple",
        },
        {
          components: [
            { internalType: "string", name: "logo", type: "string" },
            { internalType: "string", name: "name", type: "string" },
            {
              internalType: "contract IUniswapPair",
              name: "lpToken",
              type: "address",
            },
            { internalType: "uint256", name: "allocPoint", type: "uint256" },
            {
              internalType: "uint256",
              name: "lastRewardBlock",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "accSushiPerShare",
              type: "uint256",
            },
            {
              internalType: "contract IERC20",
              name: "token0",
              type: "address",
            },
            {
              internalType: "contract IERC20",
              name: "token1",
              type: "address",
            },
            { internalType: "string", name: "token0name", type: "string" },
            { internalType: "string", name: "token1name", type: "string" },
            { internalType: "string", name: "token0symbol", type: "string" },
            { internalType: "string", name: "token1symbol", type: "string" },
            {
              internalType: "uint256",
              name: "token0decimals",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "token1decimals",
              type: "uint256",
            },
          ],
          internalType: "struct PoolInfo[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "renounceOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "names_", type: "address" },
        { internalType: "address", name: "masterChef_", type: "address" },
      ],
      name: "setContracts",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
      name: "transferOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
  userInfo: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "previousOwner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "OwnershipTransferred",
      type: "event",
    },
    {
      inputs: [{ internalType: "address", name: "token", type: "address" }],
      name: "getETHRate",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getMyInfoInUSDT",
      outputs: [
        {
          components: [
            { internalType: "uint256", name: "block", type: "uint256" },
            { internalType: "uint256", name: "timestamp", type: "uint256" },
            { internalType: "uint256", name: "eth_rate", type: "uint256" },
            { internalType: "uint256", name: "sushiBalance", type: "uint256" },
            { internalType: "address", name: "delegates", type: "address" },
            { internalType: "uint256", name: "currentVotes", type: "uint256" },
            { internalType: "uint256", name: "nonces", type: "uint256" },
          ],
          internalType: "struct UserInfo",
          name: "",
          type: "tuple",
        },
        {
          components: [
            {
              internalType: "uint256",
              name: "lastRewardBlock",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "accSushiPerShare",
              type: "uint256",
            },
            { internalType: "uint256", name: "balance", type: "uint256" },
            { internalType: "uint256", name: "totalSupply", type: "uint256" },
            { internalType: "uint256", name: "uniBalance", type: "uint256" },
            {
              internalType: "uint256",
              name: "uniTotalSupply",
              type: "uint256",
            },
            { internalType: "uint256", name: "uniAllowance", type: "uint256" },
            { internalType: "uint256", name: "reserve0", type: "uint256" },
            { internalType: "uint256", name: "reserve1", type: "uint256" },
            { internalType: "uint256", name: "token0rate", type: "uint256" },
            { internalType: "uint256", name: "token1rate", type: "uint256" },
            { internalType: "uint256", name: "rewardDebt", type: "uint256" },
            { internalType: "uint256", name: "pending", type: "uint256" },
          ],
          internalType: "struct UserPoolInfo[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "who", type: "address" },
        { internalType: "address", name: "currency", type: "address" },
      ],
      name: "getUserInfo",
      outputs: [
        {
          components: [
            { internalType: "uint256", name: "block", type: "uint256" },
            { internalType: "uint256", name: "timestamp", type: "uint256" },
            { internalType: "uint256", name: "eth_rate", type: "uint256" },
            { internalType: "uint256", name: "sushiBalance", type: "uint256" },
            { internalType: "address", name: "delegates", type: "address" },
            { internalType: "uint256", name: "currentVotes", type: "uint256" },
            { internalType: "uint256", name: "nonces", type: "uint256" },
          ],
          internalType: "struct UserInfo",
          name: "",
          type: "tuple",
        },
        {
          components: [
            {
              internalType: "uint256",
              name: "lastRewardBlock",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "accSushiPerShare",
              type: "uint256",
            },
            { internalType: "uint256", name: "balance", type: "uint256" },
            { internalType: "uint256", name: "totalSupply", type: "uint256" },
            { internalType: "uint256", name: "uniBalance", type: "uint256" },
            {
              internalType: "uint256",
              name: "uniTotalSupply",
              type: "uint256",
            },
            { internalType: "uint256", name: "uniAllowance", type: "uint256" },
            { internalType: "uint256", name: "reserve0", type: "uint256" },
            { internalType: "uint256", name: "reserve1", type: "uint256" },
            { internalType: "uint256", name: "token0rate", type: "uint256" },
            { internalType: "uint256", name: "token1rate", type: "uint256" },
            { internalType: "uint256", name: "rewardDebt", type: "uint256" },
            { internalType: "uint256", name: "pending", type: "uint256" },
          ],
          internalType: "struct UserPoolInfo[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "renounceOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "uniFactory_", type: "address" },
        { internalType: "address", name: "masterChef_", type: "address" },
        { internalType: "address", name: "sushi_", type: "address" },
        { internalType: "address", name: "WETH_", type: "address" },
      ],
      name: "setContracts",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
      name: "transferOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
  makerInfo: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "previousOwner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "OwnershipTransferred",
      type: "event",
    },
    {
      inputs: [{ internalType: "address", name: "pair", type: "address" }],
      name: "addPair",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "token", type: "address" }],
      name: "getETHRate",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "currency", type: "address" }],
      name: "getPairs",
      outputs: [
        { internalType: "uint256", name: "", type: "uint256" },
        {
          components: [
            { internalType: "address", name: "pair", type: "address" },
            { internalType: "uint256", name: "balance", type: "uint256" },
            { internalType: "uint256", name: "totalSupply", type: "uint256" },
            { internalType: "uint256", name: "reserve0", type: "uint256" },
            { internalType: "uint256", name: "reserve1", type: "uint256" },
            { internalType: "uint256", name: "token0rate", type: "uint256" },
            { internalType: "uint256", name: "token1rate", type: "uint256" },
            { internalType: "address", name: "token0", type: "address" },
            { internalType: "address", name: "token1", type: "address" },
          ],
          internalType: "struct PairInfo[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "remove",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "renounceOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "sushiMaker_", type: "address" },
        { internalType: "address", name: "factory_", type: "address" },
        { internalType: "address", name: "sushi_", type: "address" },
        { internalType: "address", name: "WETH_", type: "address" },
      ],
      name: "setContracts",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
      name: "transferOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
  dashboard: [
    {
      inputs: [
        { internalType: "address", name: "who", type: "address" },
        { internalType: "address[]", name: "addresses", type: "address[]" },
      ],
      name: "findBalances",
      outputs: [
        {
          components: [
            { internalType: "address", name: "token", type: "address" },
            { internalType: "uint256", name: "balance", type: "uint256" },
          ],
          internalType: "struct BoringCryptoTokenScanner.Balance[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "who", type: "address" },
        { internalType: "contract IFactory", name: "factory", type: "address" },
        { internalType: "uint256", name: "fromID", type: "uint256" },
        { internalType: "uint256", name: "toID", type: "uint256" },
      ],
      name: "findPairs",
      outputs: [
        {
          components: [
            { internalType: "address", name: "token", type: "address" },
            { internalType: "address", name: "token0", type: "address" },
            { internalType: "address", name: "token1", type: "address" },
          ],
          internalType: "struct BoringCryptoTokenScanner.Pair[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "who", type: "address" },
        { internalType: "address[]", name: "addresses", type: "address[]" },
        { internalType: "contract IFactory", name: "factory", type: "address" },
        { internalType: "address", name: "currency", type: "address" },
      ],
      name: "getBalances",
      outputs: [
        {
          components: [
            { internalType: "address", name: "token", type: "address" },
            { internalType: "uint256", name: "balance", type: "uint256" },
            { internalType: "uint256", name: "rate", type: "uint256" },
          ],
          internalType: "struct BoringCryptoTokenScanner.BalanceFull[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "contract IFactory[]",
          name: "addresses",
          type: "address[]",
        },
      ],
      name: "getFactoryInfo",
      outputs: [
        {
          components: [
            {
              internalType: "contract IFactory",
              name: "factory",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "allPairsLength",
              type: "uint256",
            },
            { internalType: "address", name: "feeTo", type: "address" },
            { internalType: "address", name: "feeToSetter", type: "address" },
          ],
          internalType: "struct BoringCryptoTokenScanner.Factory[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "contract IFactory", name: "factory", type: "address" },
        { internalType: "uint256", name: "fromID", type: "uint256" },
        { internalType: "uint256", name: "toID", type: "uint256" },
      ],
      name: "getPairs",
      outputs: [
        {
          components: [
            { internalType: "address", name: "token", type: "address" },
            { internalType: "address", name: "token0", type: "address" },
            { internalType: "address", name: "token1", type: "address" },
          ],
          internalType: "struct BoringCryptoTokenScanner.Pair[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "who", type: "address" },
        { internalType: "address[]", name: "addresses", type: "address[]" },
      ],
      name: "getPairsFull",
      outputs: [
        {
          components: [
            { internalType: "address", name: "token", type: "address" },
            { internalType: "address", name: "token0", type: "address" },
            { internalType: "address", name: "token1", type: "address" },
            { internalType: "uint256", name: "reserve0", type: "uint256" },
            { internalType: "uint256", name: "reserve1", type: "uint256" },
            { internalType: "uint256", name: "totalSupply", type: "uint256" },
            { internalType: "uint256", name: "balance", type: "uint256" },
          ],
          internalType: "struct BoringCryptoTokenScanner.PairFull[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address[]", name: "addresses", type: "address[]" },
      ],
      name: "getTokenInfo",
      outputs: [
        {
          components: [
            { internalType: "address", name: "token", type: "address" },
            { internalType: "uint256", name: "decimals", type: "uint256" },
            { internalType: "string", name: "name", type: "string" },
            { internalType: "string", name: "symbol", type: "string" },
          ],
          internalType: "struct BoringCryptoTokenScanner.TokenInfo[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ],
};

Web3.prototype.contract = function(abi_name, address) {
  return new this.eth.Contract(abis[abi_name], address);
};

// Add a decode method to all web3 instances
// To get the ABI decoder, use web3.decode.abi_name
Object.defineProperty(Web3.prototype, "decode", {
  get: function() {
    let web3 = this;
    return new Proxy(
      {},
      {
        get: function(target, name) {
          let decoder = new Decoder(web3);
          decoder.addABI(abis[name]);
          return decoder;
        },
      }
    );
  },
});

Object.defineProperty(Web3.prototype, "ens", {
  get: function() {
    return new ENS(this);
  },
});

// Registered contracts
addContract("sushi", abis.sushi, {
  "0x1": "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
  "0x3": "0x81db9c598b3ebbdc92426422fc0a1d06e77195ec",
});
addContract("chef", abis.chef, {
  "0x1": "0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd",
  "0x3": "0xFF281cEF43111A83f09C656734Fa03E6375d432A",
});
addContract("factory", abis.factory, {
  "0x1": "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac",
  "0x3": "0x0887edCe08f06190BA11706f0C4B442d2888d2b3",
});
addContract("router", abis.router, {
  "0x1": "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
  "0x3": "0x55321ae0a211495A7493A9dE1385EeD9D9027106",
});
addContract("bar", abis.bar, {
  "0x1": "0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272",
  "0x3": "",
});
addContract("maker", abis.maker, {
  "0x1": "0x6684977bBED67e101BB80Fc07fCcfba655c0a64F",
  "0x3": "",
});
addContract("timelock", abis.timelock, {
  "0x1": "0x9a8541ddf3a932a9a922b607e9cf7301f1d47bd1",
});

addContract("tokenInfo", abis.tokenInfo, {
  "0x1": "0x0254804A96beE6D5136F283998268Ed8ba8930B7",
  "0x3": "",
});
addContract("poolnames", abis.poolnames, {
  "0x1": "0xb373a5def62A907696C0bBd22Dc512e2Fc8cfC7E",
});
addContract("baseInfo", abis.baseInfo, {
  "0x1": "0xBb7dF27209ea65Ae02Fe02E76cC1C0247765dcFF",
  "0x3": "0x39Bb002c6400f7F1679090fdAc722BC08e2a8C1e",
});
addContract("userInfo", abis.userInfo, {
  "0x1": "0x39Ec6247dE60d885239aD0bcE1bC9f1553f4EF75",
  "0x3": "0xe8f852908A61e074032382E9B5058F86fe2a0ea7",
});
addContract("makerInfo", abis.makerInfo, {
  "0x1": "0x11db09195c70897021f13Fac5DF6a3c30b6A4b30",
  "0x3": "",
});
addContract("dashboard", abis.dashboard, {
  "0x1": "0xD132Ce8eA8865348Ac25E416d95ab1Ba84D216AF",
});

const DB = {
  get: function(key, callback) {
    if (typeof Storage !== "undefined") {
      let data = JSON.parseBigInt(localStorage.getItem(key));
      if (data) {
        callback(data);
        return true;
      }
    }
    return false;
  },
  set: function(key, data) {
    if (typeof Storage !== "undefined") {
      localStorage.setItem(key, JSON.stringifyBigInt(data));
      return true;
    }
    return false;
  },
  del: function(key) {
    if (typeof Storage !== "undefined") {
      localStorage.removeItem(key);
      return true;
    }
    return false;
  },
};

class LogMonitor {
  constructor(web3, address, topics, process, output, version) {
    this.web3 = web3;
    this.address = address;
    this.topics = topics;
    this.process = process;
    this.key = address + JSON.stringify(topics) + version;

    console.log("Logger created for ", address, topics);

    this.output = output || [];
    this.seen = {};
    this.local = [];
    this.lastBlock = 10750000;
    DB.get(this.key, (data) => {
      this.lastBlock = data.lastBlock;
      this.local = data.output;
      this.output.push(...data.output);
    });
    this._getPastLogsAndSubscribe();
  }

  async _getPastLogsAndSubscribe() {
    let raw_logs = await this.web3.eth.getPastLogs({
      fromBlock: this.lastBlock + 1,
      address: this.address,
      topics: this.topics,
    });

    for (var i in raw_logs) {
      await this._processLog(raw_logs[i]);
    }

    this._save();

    this.subscription = this.web3.eth.subscribe(
      "logs",
      {
        address: this.address,
        topics: this.topics,
      },
      async (error, log) => {
        if (!error) {
          await this._processLog(log);
          this._save();
        }
      }
    );
  }

  async _processLog(log) {
    if (!this.seen[log.blockNumber + "-" + log.logIndex]) {
      //console.log('Log received ', log);
      let result = await this.process(log);
      if (result) {
        this.local.push(result);
        this.output.push(result);
        this.lastBlock = Math.max(this.lastBlock, log.blockNumber);
      }
    }
    this.seen[log.blockNumber + "-" + log.logIndex] = true;
  }

  async _save() {
    DB.set(this.key, {
      lastBlock: this.lastBlock,
      output: this.local,
    });
  }

  refresh() {
    if (this.subscription) {
      DB.del(this.key);
      this.output.length = 0;
      this.seen = {};
      this.local = [];
      this.lastBlock = 10750000;

      this.subscription.unsubscribe((error, success) => {
        if (success) {
          console.log("Successfully unsubscribed!");
          this.subscription = null;
          this._getPastLogsAndSubscribe();
        }
      });
    }
  }

  close() {
    // TODO: Wait until there is a subscription?
    this.subscription.unsubscribe((error, success) => {
      if (success) {
        console.log("Successfully unsubscribed!");
        this.subscription = null;
      }
    });
  }
}

class Web3Component {
  constructor(options) {
    this.options = options;
  }

  get web3() {
    return this.options.web3;
  }

  get address() {
    return this.options.address;
  }

  get currency() {
    return this.options.currency;
  }
}

// Get info and interact with the SushiBar and SushiMaker
class SushiBar extends Web3Component {
  constructor(options) {
    super(options);

    this.makerPairs = [];
    this.eth_rate = BigInt(0);
    this.sushi = BigInt(0);
    this.barSushi = BigInt(0);
    this.xsushi = BigInt(0);
    this.totalXSushi = BigInt(0);
    this.allowance = BigInt(0);
    this.poolShare = BigInt(0);
    this.sushiStake = BigInt(0);
  }

  ETHtoCurrency(value) {
    return (value * this.eth_rate) / BigInt("1000000000000000000");
  }

  close() {
    if (this.servingMonitor) {
      this.servingMonitor.close();
    }
    delete this.servingMonitor;

    if (this.transfersIn) {
      this.transfersIn.close();
    }
    delete this.transfersIn;

    if (this.transfersOut) {
      this.transfersOut.close();
    }
    delete this.transfersOut;
  }

  async poll() {
    console.log("Poll");
    /*var batch = new this.web3.eth.BatchRequest();
        batch.add(this.web3.sushi.balanceOf(this.address).call.request((e, r) => { this.sushi = BigInt(r) }));
        console.log(batch.execute());*/
    this.sushi = BigInt(await this.web3.sushi.balanceOf(this.address).call());
    console.log(this.sushi);

    this.barSushi = BigInt(
      await this.web3.sushi.balanceOf(this.web3.bar.address).call()
    );
    this.xsushi = BigInt(await this.web3.bar.balanceOf(this.address).call());
    this.totalXSushi = BigInt(await this.web3.bar.totalSupply().call());
    this.allowance = BigInt(
      await this.web3.sushi
        .allowance(this.address, this.web3.bar.address)
        .call()
    );

    this.poolShare =
      (this.xsushi * BigInt("1000000000000000000")) / this.totalXSushi;
    this.sushiStake = (this.barSushi * this.xsushi) / this.totalXSushi;
  }

  async getMakerInfo() {
    console.log("Currency:", this.currency);
    var result = await this.web3.makerInfo
      .getPairs(this.currency)
      .call({ gas: 5000000 });
    this.eth_rate = BigInt(result[0]);

    for (var i in result[1]) {
      let pair = {};
      pair.pair = result[1][i].pair;
      pair.balance = BigInt(result[1][i].balance);
      pair.totalSupply = BigInt(result[1][i].totalSupply);
      pair.reserve0 = BigInt(result[1][i].reserve0);
      pair.reserve1 = BigInt(result[1][i].reserve1);
      pair.token0rate = BigInt(result[1][i].token0rate);
      pair.token1rate = BigInt(result[1][i].token1rate);
      pair.token0 = result[1][i].token0;
      pair.token1 = result[1][i].token1;

      pair.shareOfPool = pair.totalSupply
        ? (pair.balance * BigInt("1000000000000000000")) / pair.totalSupply
        : BigInt(0);
      pair.totalToken0 =
        (pair.reserve0 * pair.shareOfPool) / BigInt("1000000000000000000");
      pair.totalToken1 =
        (pair.reserve1 * pair.shareOfPool) / BigInt("1000000000000000000");
      pair.valueToken0 =
        (pair.totalToken0 * BigInt("1000000000000000000")) / pair.token0rate;
      pair.valueToken1 =
        (pair.totalToken1 * BigInt("1000000000000000000")) / pair.token1rate;
      pair.valueToken0InCurrency = this.ETHtoCurrency(pair.valueToken0);
      pair.valueToken1InCurrency = this.ETHtoCurrency(pair.valueToken1);
      pair.totalValueInCurrency =
        pair.valueToken0InCurrency + pair.valueToken1InCurrency;

      if (i >= this.makerPairs.length) {
        this.makerPairs.push(pair);
      } else {
        this.makerPairs[i] = pair;
      }
    }
  }

  getServings() {
    if (this.servingMonitor) {
      this.servingMonitor.close();
      this.servingMonitor = null;
    }
    this.servingMonitor = new LogMonitor(
      this.web3,
      "0x795065dcc9f64b5614c407a6efdc400da6221fb0",
      [
        "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822",
        "0x0000000000000000000000006684977bbed67e101bb80fc07fccfba655c0a64f",
        "0x0000000000000000000000008798249c2E607446EfB7Ad49eC89dD1865Ff4272",
      ],
      async (log) => {
        let serve = {
          block: log.blockNumber,
          txid: log.transactionHash,
          amount: BigInt(0),
        };
        let tx = await this.web3.eth.getTransactionReceipt(serve.txid);
        serve.from = await this.web3.ens.reverse(tx.from);
        let logsData = this.web3.decode.pair.decodeLogs(tx.logs);
        serve.amount = logsData
          .filter(
            (l) =>
              l.name == "Transfer" &&
              l.address == "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2" &&
              l.events[1].value == "0x8798249c2e607446efb7ad49ec89dd1865ff4272"
          )
          .map((l) => BigInt(l.events[2].value))
          .reduce((a, b) => a + b, BigInt(0));
        serve.pair = logsData.filter((l) => l.name == "Burn")[0].address;
        return serve;
      }
    );
    return this.servingMonitor.output;
  }

  getTransfers() {
    let output = [];
    if (this.transfersIn) {
      this.transfersIn.close();
      this.transfersOut = null;
    }
    if (this.transfersOut) {
      this.transfersOut.close();
      this.transfersOut = null;
    }

    this.transfersIn = new LogMonitor(
      this.web3,
      "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2",
      [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        this.address.addTopicZeroes(),
        "0x0000000000000000000000008798249c2e607446efb7ad49ec89dd1865ff4272",
      ],
      async (log) => {
        let logData = this.web3.decode.sushi.decodeLog(log);
        let transfer = {
          direction: "in",
          block: log.blockNumber,
          amount: BigInt(logData.events[2].value),
        };
        return transfer;
      },
      output
    );

    this.transfersOut = new LogMonitor(
      this.web3,
      "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2",
      [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x0000000000000000000000008798249c2e607446efb7ad49ec89dd1865ff4272",
        this.address.addTopicZeroes(),
      ],
      async (log) => {
        let logData = this.web3.decode.sushi.decodeLog(log);
        let transfer = {
          direction: "out",
          block: log.blockNumber,
          amount: BigInt(logData.events[2].value),
        };
        return transfer;
      },
      output
    );
    return output;
  }

  async allow() {
    await this.web3.sushi
      .approve(
        this.web3.bar.address,
        BigInt(1000000000000000000000000000000000000)
      )
      .send({ from: this.address, gas: 60000 });
  }

  async enter(amount) {
    await this.web3.bar.enter(amount).send({ from: this.address, gas: 100000 });
  }

  async leave(amount) {
    await this.web3.bar.leave(amount).send({ from: this.address, gas: 200000 });
  }

  async convert(from, token0, token1) {
    await this.web3.maker.convert(token0, token1).send({ from: from });
  }
}

class TimeLock extends Web3Component {
  constructor(options) {
    super(options);
  }

  getTransactions() {
    let output = [];
    this.queued = new LogMonitor(
      this.web3,
      "0x9a8541ddf3a932a9a922b607e9cf7301f1d47bd1",
      ["0x76e2796dc3a81d57b0e8504b647febcbeeb5f4af818e164f11eef8131a6a763f"],
      async (log) => {
        let logData = this.web3.decode.timelock.decodeLog(log);
        let row = {
          block: log.blockNumber,
          description: "",
          log: logData,
        };
        if (
          logData.events[1].value ==
          "0xc2edad668740f1aa35e4d8f227fb8e17dca888cd"
        ) {
          row.txid = logData.events[0].value;

          let fullData =
            this.web3.utils.keccak256(logData.events[3].value).substr(0, 10) +
            logData.events[4].value.substr(2);
          let p = {};
          try {
            let command = this.web3.decode.chef.decodeMethod(fullData);
            row.command = command;
            row.signature = logData.events[3].value;
            row.name = command.name;
            row.params = command.params;

            command.params.forEach((param) => (p[param.name] = param.value));
          } catch (e) {
            console.log("error", e);
            row.name = "Cannot decode";
            row.description = "Cannot decode";
          }
          row.queued = await this.web3.timelock
            .queuedTransactions(row.txid)
            .call();

          if (typeof p._pid == "string") {
            p.poolname = await this.web3.poolnames.names(p._pid).call();
          }

          if (row.signature == "set(uint256,uint256,bool)") {
            row.description = `Set pool allocation for ${p.poolname} (${
              p._pid
            }) to ${p._allocPoint / 1000}`;
          } else if (row.signature == "add(uint256,address,bool)") {
            try {
              let pair_info = await this.web3.dashboard
                .getPairsFull(this.address, [p._lpToken])
                .call();
              let token_info = await this.web3.dashboard
                .getTokenInfo([pair_info[0].token0, pair_info[0].token1])
                .call();
              row.description = `Add pool ${token_info[0].symbol}/${
                token_info[1].symbol
              } with allocation of ${p._allocPoint / 1000}`;
            } catch {
              row.description = `Add pool ${
                p._lpToken
              } with allocation of ${p._allocPoint / 1000}`;
            }
          } else if (row.signature == "setMigrator(address)") {
            row.description = `Change migrator to ${p._migrator}.`;
          }
        }
        return row;
      },
      output,
      4
    );
    return this.queued.output;
  }
}

class ERC20Handler {
  constructor(assets) {
    this.assets = assets;
    this.componentName = "erc20-handler";
  }

  async init() {}

  async find(address, allAssets) {
    let balances = await this.assets.web3.dashboard
      .findBalances(
        address,
        allAssets.map((t) => t.address)
      )
      .call();
    for (var i in balances) {
      if (BigInt(balances[i].balance) > BigInt(0)) {
        this.assets.add(
          {
            address: balances[i].token,
            balance: BigInt(balances[i].balance),
          },
          "ERC20Handler"
        );
      }
    }
  }

  async info(assets) {
    assets = assets.filter(
      (a) => !a.name || !a.symbol || typeof a.decimals != "bigint"
    );
    let infos = await this.assets.web3.dashboard
      .getTokenInfo(assets.map((t) => t.address))
      .call();
    for (var i in infos) {
      objAssign(this.assets.get(infos[i].token), rpcToObj(infos[i]));
    }
  }

  async poll(address, assets) {
    let balances = await this.assets.web3.dashboard
      .getBalances(
        address,
        assets.map((t) => t.address),
        "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Uniswap (for now), should add to tokenlist.
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" // Use WETH as currency for rate
      )
      .call();
    for (var i in balances) {
      let asset = this.assets.get(balances[i].token);
      objAssign(asset, rpcToObj(balances[i]));
      if (asset.address == "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2") {
        asset.rate = BigInt(1000000000000000000);
      }
    }
  }
}

class UniV2Handler {
  constructor(assets) {
    this.assets = assets;
    this.componentName = "univ2-handler";
  }

  async init() {
    // Get factory info from UniSwap V2 LP and SushiSwap SLP
    this.factories = (
      await this.assets.web3.dashboard
        .getFactoryInfo([
          "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Uniswap V2
          "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac", // SushiSwap
        ])
        .call()
    ).map((f) => rpcToObj(f));
    this.factories[0].name = "Uniswap V2 LP";
    this.factories[1].name = "SushiSwap SLP";
    this.factories[0].prefix = "UniV2 ";
    this.factories[1].prefix = "SLP ";
  }

  async find(address, allAssets) {
    for (let i in this.factories) {
      let factory = this.factories[i];
      let stepsize = BigInt(3333);
      for (let b = BigInt(0); b <= factory.allPairsLength / stepsize; b++) {
        let pairs = await this.assets.web3.dashboard
          .findPairs(
            address,
            factory.factory,
            b * stepsize,
            bigIntMin(factory.allPairsLength, (b + BigInt(1)) * stepsize)
          )
          .call();
        console.log(
          b * stepsize,
          bigIntMin(factory.allPairsLength, (b + BigInt(1)) * stepsize),
          pairs
        );
        for (let i in pairs) {
          this.assets.add({ address: pairs[i].token0 }, "ERC20Handler");
          this.assets.add({ address: pairs[i].token1 }, "ERC20Handler");
          this.assets.add(
            {
              name: null,
              symbol: null,
              address: pairs[i].token,
              token0: pairs[i].token0.toLowerCase(),
              token1: pairs[i].token1.toLowerCase(),
              decimals: 18,
              factory: factory,
            },
            "UniV2Handler"
          );
        }
      }
    }
  }

  async info(assets) {
    for (let i in assets) {
      let asset = assets[i];
      console.log(asset);
      asset.name =
        this.assets.get(asset.token0).name +
        "-" +
        this.assets.get(asset.token1).name +
        " " +
        asset.factory.name;
      asset.symbol =
        asset.factory.prefix +
        this.assets.get(asset.token0).symbol +
        "-" +
        this.assets.get(asset.token1).symbol;
    }
  }

  async poll(address, assets) {
    let balances = await this.assets.web3.dashboard
      .getPairsFull(
        address,
        assets.map((t) => t.address)
      )
      .call();
    for (var i in balances) {
      objAssign(this.assets.get(balances[i].token), rpcToObj(balances[i]));
    }
  }
}

class Assets extends Web3Component {
  constructor(options, assets) {
    super(options);
    if (!assets) {
      assets = [];
    }
    this.handlers = [];
    this._handlerMap = {};
    this.allAssets = [];
    this._allAssetsMap = {};
    this.assets = assets;
    this._assetmap = {};
  }

  add(asset, handler) {
    asset.address = asset.address.toLowerCase();
    if (this._allAssetsMap[asset.address]) {
      objAssign(asset, this._allAssetsMap[asset.address]);
    }
    asset.balance = asset.balance || BigInt(0);
    asset.handler = this._handlerMap[handler];
    if (!this._assetmap[asset.address]) {
      this.assets.push(asset);
      this._assetmap[asset.address] = asset;
    }
  }

  get(address) {
    return this._assetmap[address.toLowerCase()];
  }

  async init() {
    this._handlerMap["ERC20Handler"] = new ERC20Handler(this);
    this.handlers.push(this._handlerMap["ERC20Handler"]);
    this._handlerMap["UniV2Handler"] = new UniV2Handler(this);
    this.handlers.push(this._handlerMap["UniV2Handler"]);

    // Get tokens from list
    this.allAssets = (await fetch("tokenlist.json")).map((a) => {
      a.handler = a.handler || "ERC20Handler";
      a = rpcToObj(a);
      this._allAssetsMap[a.address] = a;
      return a;
    });

    for (let i in this.handlers) {
      await this.handlers[i].init(this.address, this.assets);
      await this.handlers[i].find(
        this.address,
        this.allAssets.filter(
          (a) => this.handlers[i] == this._handlerMap[a.handler]
        )
      );
    }

    for (let i in this.handlers) {
      await this.handlers[i].info(
        this.assets.filter((a) => a.handler == this.handlers[i])
      );
    }

    for (let i in this.handlers) {
      await this.handlers[i].poll(
        this.address,
        this.assets.filter((a) => a.handler == this.handlers[i])
      );
    }

    console.log(this.assets);

    return this;
  }

  async poll() {
    for (let i in this.handlers) {
      let assets = this.assets.filter((a) => (a.handler = this.handlers[i]));
      await this.handlers[i].poll(this.address, assets);
    }

    return this;
  }
}

class SushiPools extends Web3Component {
  constructor(options) {
    super(options);

    this.base = { loaded: false };
    this.pools = [];
  }

  ETHtoCurrency(value) {
    return (value * this.base.eth_rate) / BigInt("1000000000000000000");
  }

  async getInfo(currency) {
    console.log("THIS:", this);
    if (!this.base.loaded) {
      var result = await this.web3.baseInfo.getInfo().call({ gas: 5000000 });
      this.base = {};
      this.base.BONUS_MULTIPLIER = BigInt(result[0].BONUS_MULTIPLIER); // Multiplier during the bonus period
      this.base.bonusEndBlock = BigInt(result[0].bonusEndBlock); // Last block of the bonus period
      this.base.devaddr = result[0].devaddr; // Address that receives 10% of SUSHI distributed
      this.base.migrator = result[0].migrator; // Address of migration contract
      this.base.owner = result[0].owner; // Address of the owner of the masterchef contract
      this.base.startBlock = BigInt(result[0].startBlock); // Block at which SUSHI distribution started
      this.base.sushi = result[0].sushi; // Address of the sushi token contract
      this.base.sushiPerBlock = BigInt(result[0].sushiPerBlock); // Base number of sushi distributed per block (not including dev share)
      this.base.totalAllocPoint = BigInt(result[0].totalAllocPoint); // Total allocPoints of all pools, this must match adding all the pool allocPoints

      this.base.sushiTotalSupply = BigInt(result[0].sushiTotalSupply); // Total amount of minted SUSHI
      this.base.sushiOwner = result[0].sushiOwner; // Owner of the SUSHI token contract

      this.pools = [];
      for (var i in result[1]) {
        let pool = {};
        pool.id = this.pools.length;
        pool.logo = result[1][i].logo; // The character used as logo for the pool
        pool.name = result[1][i].name; // The name of the pool, like Tutle Tether
        pool.lpToken = result[1][i].lpToken; // Address of LP token contract. Currently uniswap, soon SushiSwap
        pool.allocPoint = BigInt(result[1][i].allocPoint); // How many allocation points assigned to this pool. Share of allocPoints out of total determines sushi/block.
        pool.lastRewardBlock = BigInt(result[1][i].lastRewardBlock); // Last block number that SUSHIs accululation occured.
        pool.accSushiPerShare = BigInt(result[1][i].accSushiPerShare); // Accumulated SUSHIs per share, times 1e12.
        pool.token0 = result[1][i].token0; // Token address (first) of the token in the LP pair
        pool.token1 = result[1][i].token1; // Token address (second) of the token in the LP pair
        pool.token0name = result[1][i].token0name; // Name of the first token
        pool.token1name = result[1][i].token1name; // Name of the second token
        pool.token0symbol = result[1][i].token0symbol; // Symbol of the first token
        pool.token1symbol = result[1][i].token1symbol; // Symbol of the second token
        pool.token0decimals = BigInt(result[1][i].token0decimals); // Decimals of the first token
        pool.token1decimals = BigInt(result[1][i].token1decimals); // Decimals of the scond token
        this.pools.push(pool);
      }
    }

    console.log("USERINFO:", this.web3);
    console.log("ADDRESS:", this.address);
    console.log("CURRENCY:", currency);

    var result = await this.web3.userInfo
      .getUserInfo(this.address, currency)
      .call({ gas: 5000000 });
    this.base.block = BigInt(result[0].block); // The block for which this info it valid
    this.base.timestamp = BigInt(result[0].timestamp); // The timestamp of that block?
    this.base.eth_rate = BigInt(result[0].eth_rate); // The 'price' of 1 wrapped Ether expressed in currency token
    this.base.sushiBalance = BigInt(result[0].sushiBalance); // User's balance of SUSHI (not pending)
    this.base.delegates = result[0].delegates; // See smart contract, just included it for completeness
    this.base.currentVotes = BigInt(result[0].currentVotes); // See smart contract, just included it for completeness
    this.base.nonces = BigInt(result[0].nonces); // See smart contract, just included it for completeness
    this.base.pending = BigInt(0); // Total pending SUSHI
    this.base.multiplier =
      this.base.block < this.base.bonusEndBlock
        ? this.base.BONUS_MULTIPLIER
        : BigInt(1); // Current base multiplier

    console.log("RESULT:", result);
    console.log("SUSHI_POOL:", this.sushi_pool);

    //this.base.sushiRate = BigInt(result[1][this.sushi_pool].token0rate); // The amount of SUSHIs in 1 wrapped Ether, times 1e18. This is taken from the ETH/SUSHI pool
    this.base.sushiRate = BigInt(result[1][12].token0rate);
    this.base.sushiValueInETH =
      (BigInt("1000000000000000000") * BigInt("1000000000000000000")) /
      this.base.sushiRate;
    this.base.sushiValueInCurrency = this.ETHtoCurrency(
      this.base.sushiValueInETH
    );

    for (i in result[1]) {
      let pool = this.pools[i];
      pool.lastRewardBlock = BigInt(result[1][i].lastRewardBlock); // Last block number that SUSHIs accululation occured
      pool.accSushiPerShare = BigInt(result[1][i].accSushiPerShare); // Accumulated SUSHIs per share, times 1e12
      pool.balance = BigInt(result[1][i].balance); // User's balance of pool tokens staked in the Masterchef contract
      pool.totalSupply = BigInt(result[1][i].totalSupply); // Total balance of pool tokens in the Masterchef contract
      pool.uniBalance = BigInt(result[1][i].uniBalance); // Users's balance of lp tokens not staked
      pool.uniTotalSupply = BigInt(result[1][i].uniTotalSupply); // TotalSupply of lp tokens
      pool.reserve0 = BigInt(result[1][i].reserve0); // Reserve of token0 in lp token pool
      pool.reserve1 = BigInt(result[1][i].reserve1); // Reserve of token1 in lp token pool
      pool.token0rate = BigInt(result[1][i].token0rate); // The amount of token0 in 1 wrapped Ether, times 1e18.
      pool.token1rate = BigInt(result[1][i].token1rate); // The amount of token1 in 1 wrapped Ether, times 1e18.
      pool.rewardDebt = BigInt(result[1][i].rewardDebt); // Used internally to calculate pending SUSHI, just use pending.
      pool.pending = BigInt(result[1][i].pending); // Pending SUSHI
      this.base.pending += pool.pending;

      pool.sushiReward =
        (this.base.sushiPerBlock * this.base.multiplier * pool.allocPoint) /
        this.base.totalAllocPoint; // SUSHI rewarded to this pool every block
      pool.sushiRewardInETH =
        (pool.sushiReward * BigInt("1000000000000000000")) /
        this.base.sushiRate; // SUSHI value rewarded to this pool every block in ETH
      pool.sushiRewardInCurrency =
        (pool.sushiRewardInETH * this.base.eth_rate) /
        BigInt("1000000000000000000"); // SUSHI value rewarded to this pool every block in currncy tokens
      pool.devShare = pool.sushiReward / BigInt("10"); // SUSHI rewarded to the dev every block
      pool.totalSushiPerBlock = pool.devShare + pool.sushiReward;

      pool.shareOfUniswapPool = pool.uniTotalSupply
        ? (pool.totalSupply * BigInt("1000000000000000000")) /
          pool.uniTotalSupply
        : BigInt(0); // Staked share of all lp tokens. 100% = 1e18.
      pool.totalStakedToken0 =
        (pool.reserve0 * pool.shareOfUniswapPool) /
        BigInt("1000000000000000000"); // Staked lp tokens contain this much of token0.
      pool.totalStakedToken1 =
        (pool.reserve1 * pool.shareOfUniswapPool) /
        BigInt("1000000000000000000"); // Staked lp tokens contain this much of token1.
      pool.valueStakedToken0 =
        (pool.totalStakedToken0 * BigInt("1000000000000000000")) /
        pool.token0rate; // Value of token0 in staked lp tokens in wrapped Ether
      pool.valueStakedToken1 =
        (pool.totalStakedToken1 * BigInt("1000000000000000000")) /
        pool.token1rate; // Value of token1 in staked lp tokens in wrapped Ether
      pool.valueStakedToken0InCurrency = this.ETHtoCurrency(
        pool.valueStakedToken0
      );
      pool.valueStakedToken1InCurrency = this.ETHtoCurrency(
        pool.valueStakedToken1
      );

      pool.shareOfPool = pool.totalSupply
        ? (pool.balance * BigInt("1000000000000000000")) / pool.totalSupply
        : BigInt(0);
      pool.userStakedToken0 =
        (pool.totalStakedToken0 * pool.shareOfPool) /
        BigInt("1000000000000000000"); // Staked lp tokens contain this much of token0.
      pool.userStakedToken1 =
        (pool.totalStakedToken1 * pool.shareOfPool) /
        BigInt("1000000000000000000"); // Staked lp tokens contain this much of token1.
      pool.valueUserStakedToken0 =
        (pool.userStakedToken0 * BigInt("1000000000000000000")) /
        pool.token0rate; // Value of token0 in staked lp tokens in wrapped Ether
      pool.valueUserStakedToken1 =
        (pool.userStakedToken1 * BigInt("1000000000000000000")) /
        pool.token1rate; // Value of token1 in staked lp tokens in wrapped Ether

      pool.hourlyROI =
        pool.valueStakedToken0 + pool.valueStakedToken1
          ? (pool.sushiRewardInETH * BigInt(276000000)) /
            (pool.valueStakedToken0 + pool.valueStakedToken1)
          : BigInt(0); // Hourly ROI
      pool.dailyROI =
        pool.valueStakedToken0 + pool.valueStakedToken1
          ? (pool.sushiRewardInETH * BigInt(6613000000)) /
            (pool.valueStakedToken0 + pool.valueStakedToken1)
          : BigInt(0); // Daily ROI
      pool.monthlyROI = pool.dailyROI * BigInt(30); // Monthly ROI
      pool.yearlyROI = pool.dailyROI * BigInt(365); // Yearly ROI

      pool.hourlyInCurrency =
        (pool.sushiRewardInCurrency * pool.shareOfPool * BigInt(276)) /
        BigInt("1000000000000000000");
      pool.dailyInCurrency =
        (pool.sushiRewardInCurrency * pool.shareOfPool * BigInt(6613)) /
        BigInt("1000000000000000000");
      pool.monthlyInCurrency = pool.dailyInCurrency * BigInt(30);
      pool.yearlyInCurrency = pool.dailyInCurrency * BigInt(365);

      pool.valueInCurrency =
        ((pool.valueStakedToken0 + pool.valueStakedToken1) *
          this.base.eth_rate) /
        BigInt("1000000000000000000"); // Value of lp tokens staked in currency
    }

    this.base.sushiBalanceInETH =
      (this.base.sushiBalance * BigInt("1000000000000000000")) /
      this.base.sushiRate;
    this.base.sushiBalanceInCurrency = this.ETHtoCurrency(
      this.base.sushiBalanceInETH
    );
    this.base.pendingInETH =
      (this.base.pending * BigInt("1000000000000000000")) / this.base.sushiRate;
    this.base.pendingInCurrency = this.ETHtoCurrency(this.base.pendingInETH);

    this.base.loaded = true;
    return this;
  }

  async harvest(from, pool_id) {
    await this.web3.chef.withdraw(pool_id, 0).send({ from: from });
  }
}

class Decoder {
  constructor(web3) {
    this.web3 = web3;
    this.state = {
      savedABIs: [],
      methodIDs: {},
    };
  }

  getABIs() {
    return this.state.savedABIs;
  }

  typeToString(input) {
    if (input.type === "tuple") {
      return "(" + input.components.map(this.typeToString).join(",") + ")";
    }
    return input.type;
  }

  addABI(abiArray) {
    let sha3 = this.web3.utils.sha3;
    let self = this;
    if (Array.isArray(abiArray)) {
      // Iterate new abi to generate method id"s
      abiArray.map(function(abi) {
        if (abi.name) {
          const signature = sha3(
            abi.name + "(" + abi.inputs.map(self.typeToString).join(",") + ")"
          );
          if (abi.type === "event") {
            self.state.methodIDs[signature.slice(2)] = abi;
          } else {
            self.state.methodIDs[signature.slice(2, 10)] = abi;
          }
        }
      });

      this.state.savedABIs = this.state.savedABIs.concat(abiArray);
    } else {
      throw new Error("Expected ABI array, got " + typeof abiArray);
    }
  }

  removeABI(abiArray) {
    let sha3 = this.web3.utils.sha3;
    let self = this;
    if (Array.isArray(abiArray)) {
      // Iterate new abi to generate method id"s
      abiArray.map(function(abi) {
        if (abi.name) {
          const signature = sha3(
            abi.name +
              "(" +
              abi.inputs
                .map(function(input) {
                  return input.type;
                })
                .join(",") +
              ")"
          );
          if (abi.type === "event") {
            if (this.state.methodIDs[signature.slice(2)]) {
              delete this.state.methodIDs[signature.slice(2)];
            }
          } else {
            if (this.state.methodIDs[signature.slice(2, 10)]) {
              delete this.state.methodIDs[signature.slice(2, 10)];
            }
          }
        }
      });
    } else {
      throw new Error("Expected ABI array, got " + typeof abiArray);
    }
  }

  getMethodIDs() {
    return this.state.methodIDs;
  }

  decodeMethod(data) {
    var BN = this.web3.utils.BN;
    const methodID = data.slice(2, 10);
    const abiItem = this.state.methodIDs[methodID];
    if (abiItem) {
      let decoded = this.web3.eth.abi.decodeParameters(
        abiItem.inputs,
        data.slice(10)
      );

      let retData = {
        name: abiItem.name,
        params: [],
      };

      for (let i = 0; i < decoded.__length__; i++) {
        let param = decoded[i];
        let parsedParam = param;
        const isUint = abiItem.inputs[i].type.indexOf("uint") === 0;
        const isInt = abiItem.inputs[i].type.indexOf("int") === 0;
        const isAddress = abiItem.inputs[i].type.indexOf("address") === 0;

        if (isUint || isInt) {
          const isArray = Array.isArray(param);

          if (isArray) {
            parsedParam = param.map((val) => new BN(val).toString());
          } else {
            parsedParam = new BN(param).toString();
          }
        }

        // Addresses returned by web3 are randomly cased so we need to standardize and lowercase all
        if (isAddress) {
          const isArray = Array.isArray(param);

          if (isArray) {
            parsedParam = param.map((_) => _.toLowerCase());
          } else {
            parsedParam = param.toLowerCase();
          }
        }

        retData.params.push({
          name: abiItem.inputs[i].name,
          value: parsedParam,
          type: abiItem.inputs[i].type,
        });
      }

      return retData;
    }
  }

  decodeLogs(logs) {
    var BN = this.web3.utils.BN;

    return logs
      .filter((log) => log.topics.length > 0)
      .map((logItem) => {
        const methodID = logItem.topics[0].slice(2);
        const method = this.state.methodIDs[methodID];
        if (method) {
          const logData = logItem.data;
          let decodedParams = [];
          let dataIndex = 0;
          let topicsIndex = 1;

          let dataTypes = [];
          method.inputs.map(function(input) {
            if (!input.indexed) {
              dataTypes.push(input.type);
            }
          });

          const decodedData = this.web3.eth.abi.decodeParameters(
            dataTypes,
            logData.slice(2)
          );

          // Loop topic and data to get the params
          method.inputs.map(function(param) {
            let decodedP = {
              name: param.name,
              type: param.type,
            };

            if (param.indexed) {
              decodedP.value = logItem.topics[topicsIndex];
              topicsIndex++;
            } else {
              decodedP.value = decodedData[dataIndex];
              dataIndex++;
            }

            if (param.type === "address") {
              decodedP.value = decodedP.value.toLowerCase();
              // 42 because len(0x) + 40
              if (decodedP.value.length > 42) {
                let toRemove = decodedP.value.length - 42;
                let temp = decodedP.value.split("");
                temp.splice(2, toRemove);
                decodedP.value = temp.join("");
              }
            }

            if (
              param.type === "uint256" ||
              param.type === "uint8" ||
              param.type === "int"
            ) {
              // ensure to remove leading 0x for hex numbers
              if (
                typeof decodedP.value === "string" &&
                decodedP.value.startsWith("0x")
              ) {
                decodedP.value = new BN(decodedP.value.slice(2), 16).toString(
                  10
                );
              } else {
                decodedP.value = new BN(decodedP.value).toString(10);
              }
            }

            decodedParams.push(decodedP);
          });

          return {
            name: method.name,
            events: decodedParams,
            address: logItem.address,
          };
        }
      });
  }

  decodeLog(log) {
    return this.decodeLogs([log])[0];
  }
}

class ENS {
  constructor(web3) {
    this.web3 = web3;
    this.resolver_abi = [
      {
        inputs: [
          { internalType: "contract ENS", name: "ensAddr", type: "address" },
        ],
        payable: false,
        stateMutability: "nonpayable",
        type: "constructor",
      },
      {
        constant: true,
        inputs: [],
        name: "ens",
        outputs: [{ internalType: "contract ENS", name: "", type: "address" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
      {
        constant: true,
        inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        name: "name",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
      {
        constant: false,
        inputs: [
          { internalType: "bytes32", name: "node", type: "bytes32" },
          { internalType: "string", name: "_name", type: "string" },
        ],
        name: "setName",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
      },
    ];
    this.resolver_contract = new web3.eth.Contract(
      this.resolver_abi,
      "0xA2C122BE93b0074270ebeE7f6b7292C7deB45047"
    );
    this.reverse_abi = [
      {
        inputs: [
          { internalType: "contract ENS", name: "ensAddr", type: "address" },
          {
            internalType: "contract Resolver",
            name: "resolverAddr",
            type: "address",
          },
        ],
        payable: false,
        stateMutability: "nonpayable",
        type: "constructor",
      },
      {
        constant: true,
        inputs: [],
        name: "ADDR_REVERSE_NODE",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
      {
        constant: false,
        inputs: [{ internalType: "address", name: "owner", type: "address" }],
        name: "claim",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        constant: false,
        inputs: [
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "resolver", type: "address" },
        ],
        name: "claimWithResolver",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        constant: true,
        inputs: [],
        name: "defaultResolver",
        outputs: [
          { internalType: "contract Resolver", name: "", type: "address" },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
      {
        constant: true,
        inputs: [],
        name: "ens",
        outputs: [{ internalType: "contract ENS", name: "", type: "address" }],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
      {
        constant: true,
        inputs: [{ internalType: "address", name: "addr", type: "address" }],
        name: "node",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        payable: false,
        stateMutability: "pure",
        type: "function",
      },
      {
        constant: false,
        inputs: [{ internalType: "string", name: "name", type: "string" }],
        name: "setName",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
      },
    ];
    this.reverse_contract = new web3.eth.Contract(
      this.reverse_abi,
      "0x084b1c3C81545d370f3634392De611CaaBFf8148"
    );

    this.reverse_names = {};
  }

  async reverse(address, fallback) {
    if (!fallback) {
      fallback = (a) => a.substr(0, 14) + "...";
    }

    let node = await this.reverse_contract.methods.node(address).call();
    let name = await this.resolver_contract.methods.name(node).call();
    if (name) {
      return name;
    }

    return fallback(address);
  }
}

// Handles connecting to wallets, changing address, chain and subscribes to new block notifications.
class Web3Manager {
  constructor(web3) {
    this.web3 = web3;
    this.addresses = [];

    this.address = null;
    this.currency = null;
    this.provider = "Unknown";
    this.connected = false;

    let self = this;

    if (window.ethereum) {
      this.web3 = new Web3(window.ethereum);
      if (window.ethereum.isMetaMask) {
        console.log("MetaMask detected.");

        this.provider = "MetaMask";
      } else {
        console.log("Non MetaMask provider detected.");

        this.provider = "Other";
      }

      // This code is for MetaMask, but trying also for others.
      window.ethereum.on("connect", (info) => this.onConnected(self, info));
      window.ethereum.on("disconnect", (error) =>
        this.onDisconnected(self, error)
      );
      window.ethereum.on("accountsChanged", (a) =>
        this.handleAccountsChanged(self, a)
      );
      //ethereum.on('chainChanged', () => window.location.reload());
      this.connected = window.ethereum.isConnected();
      window.ethereum.autoRefreshOnNetworkChange = false;

      if (this.connected) {
        this.onConnected(this);
      }
    } else {
      this.provider = "None";
    }
  }

  async onConnected(self) {
    console.log("Connected to Web3");
    self.chainId = this.web3.givenProvider.chainId;
    self.connected = window.ethereum.isConnected();
    if (self.chainId == "0x1") {
      self.currency = "0xdac17f958d2ee523a2206206994597c13d831ec7";
    } else if (self.chainId == "0x3") {
      self.currency = "0x292c703A980fbFce4708864Ae6E8C40584DAF323";
    }

    self.hash = "";
    self.header = {};

    self.subscription = self.web3.eth.subscribe(
      "newBlockHeaders",
      (error, result) => {
        if (error) {
          return;
        }

        self.block = result.number;
        self.hash = result.hash;
        self.header = result.header;
      }
    );

    self.block = await this.web3.eth.getBlockNumber();
  }

  onDisconnected(self) {
    self.connected = window.ethereum.isConnected();
    console.log("Disconnected");
    // Force reload? Even better, prompt user to reload.
  }

  handleAccountsChanged(self, addresses) {
    if (addresses && addresses.length) {
      self.address = addresses[0];
      for (let i in addresses) {
        if (self.addresses.indexOf(addresses[i].toLowerCase()) == -1) {
          self.addresses.push(addresses[i].toLowerCase());
        }
      }
    }
  }

  async connect() {
    let addresses = await window.ethereum.request({ method: "eth_accounts" });
    if (addresses && addresses.length) {
      this.handleAccountsChanged(this, addresses);
    } else {
      console.log("No address was retrieved. Fallback to .enable()");
      let addresses = await window.ethereum.enable();
      this.handleAccountsChanged(this, addresses);
    }
  }

  close() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}

export {
  LogMonitor,
  Web3Component,
  SushiBar,
  TimeLock,
  ERC20Handler,
  UniV2Handler,
  Assets,
  SushiPools,
  Decoder,
  ENS,
  Web3Manager,
};
