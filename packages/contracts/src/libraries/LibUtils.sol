// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

library LibUtils {
  /**
   * @notice Returns the largest of two numbers.
   * @param _a First number
   * @param _b Second number
   */
  function max(int32 _a, int32 _b) internal pure returns (int32) {
    return _a > _b ? _a : _b;
  }

  /**
   * @notice Returns the largest of two numbers.
   * @param _a First number
   * @param _b Second number
   */
  function max(uint256 _a, uint256 _b) internal pure returns (uint256) {
    return _a > _b ? _a : _b;
  }

  /**
   * @notice Returns the smallest of two numbers.
   * @param _a First number
   * @param _b Second number
   */
  function min(int32 _a, int32 _b) internal pure returns (int32) {
    return _a < _b ? _a : _b;
  }

  /**
   * @notice Returns the smallest of two numbers.
   * @param _a First number
   * @param _b Second number
   */
  function min(uint256 _a, uint256 _b) internal pure returns (uint256) {
    return _a < _b ? _a : _b;
  }

  /**
   * @notice Returns the absolute value.
   * @param _x The number to take the absolute value of
   */
  function abs(int32 _x) internal pure returns (int32) {
    return _x >= 0 ? _x : -_x;
  }

  /**
   * @notice Returns the absolute value.
   * @param _x The number to take the absolute value of
   */
  function abs(int256 _x) internal pure returns (int256) {
    return _x >= 0 ? _x : -_x;
  }

  /**
   * @notice Converts a signed integer to an unsigned integer.
   * @param _value Value to convert
   */
  function signedToUnsigned(int256 _value) public pure returns (uint256) {
    require(_value != type(int256).min, "Value out of range");
    return _value < 0 ? uint256(-_value) : uint256(_value);
  }

  /**
   * @notice Returns the absolute difference.
   * @param _a First number
   * @param _b Second number
   */
  function absDif(int32 _a, int32 _b) internal pure returns (uint32) {
    return uint32(_a > _b ? _a - _b : _b - _a);
  }

  /**
   * @notice Conversion from address to bytes32.
   * @param _address The address to convert
   */
  function addressToEntityKey(address _address) internal pure returns (bytes32 key) {
    return bytes32(uint256(uint160(_address)));
  }

  /**
   * @notice Conversion from bytes32 to address.
   * @param _key The entity to convert
   */
  function addressToEntityKey(bytes32 _key) internal pure returns (address) {
    return address(uint160(uint256(_key)));
  }

  /**
   * @notice Removes an element from an array of `bytes32` if it exists and returns the new array.
   * @param _array The original array of `bytes32` elements.
   * @param _element The `bytes32` element to be removed from the array.
   * @return newArray The new array containing all elements of the original array except for the removed element.
   */
  function removeFromArray(
    bytes32[] memory _array,
    bytes32 _element
  ) internal pure returns (bytes32[] memory newArray) {
    bool found = false;
    uint256 foundIndex = 0;

    for (uint256 i = 0; i < _array.length; i++) {
      if (_array[i] == _element) {
        found = true;
        foundIndex = i;
        break;
      }
    }

    if (!found) {
      return _array;
    }

    newArray = new bytes32[](_array.length - 1);

    uint256 j = 0;
    for (uint256 i = 0; i < _array.length; i++) {
      if (i != foundIndex) {
        newArray[j] = _array[i];
        j++;
      }
    }

    return newArray;
  }

  /**
   * @notice Subtract without underflow.
   * @param _a First number
   * @param _b Second number
   */
  function safeSubtract(uint256 _a, uint256 _b) internal pure returns (uint256) {
    if (_b > _a) {
      return 0;
    } else {
      return _a - _b;
    }
  }

  /**
   * @notice Check if an element is included in an array.
   * @param _array The array to check
   * @param _element The element to check for
   */
  function arrayIncludes(bytes32[] memory _array, bytes32 _element) internal pure returns (bool) {
    for (uint256 i = 0; i < _array.length; i++) {
      if (_array[i] == _element) {
        return true;
      }
    }
    return false;
  }
}
